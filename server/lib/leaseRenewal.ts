import type { SupabaseClient } from "@supabase/supabase-js";
import { sendLeaseRenewalEmail, type LeaseRenewalRecipient } from "./email.js";
import {
  buildTenantLeaseRenewalEmail,
  buildOwnerLeaseRenewalEmail,
  buildAgentLeaseRenewalNotificationEmail,
} from "./templates/leaseRenewalEmail.js";

export interface LeaseRenewalResult {
  ok: boolean;
  sent: number;
  failed: number;
  error?: string;
}

// Sends lease renewal emails (owner/tenant/agent) for a single lease, logs the
// campaign history, and marks renewal_email_sent_at on success.
// Manual sends (from the admin UI) should always be allowed regardless of
// whether renewal_email_sent_at is already set — only the automation cron
// job checks that field before calling this function.
export async function sendLeaseRenewalForLease(
  supabaseAdmin: SupabaseClient,
  leaseId: string,
  createdBy: string | null = null
): Promise<LeaseRenewalResult> {
  const { data: lease, error: leaseError } = await supabaseAdmin
    .from("lease_reminders")
    .select("*")
    .eq("id", leaseId)
    .single();

  if (leaseError || !lease) return { ok: false, sent: 0, failed: 0, error: "Lease not found" };

  const propertyAddress = lease.property_address || "your property";
  const leaseEndDate = lease.lease_end_date
    ? new Date(lease.lease_end_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "N/A";

  // Determine assigned sender based on owner1's master_clients record
  let senderEmail = "agent1@aurarealty.com";
  if (lease.owner1_email) {
    const { data: ownerClient } = await supabaseAdmin
      .from("master_clients")
      .select("sender_email")
      .eq("email_address", lease.owner1_email)
      .maybeSingle();
    if (ownerClient?.sender_email) senderEmail = ownerClient.sender_email;
  }
  const senderName = senderEmail.includes("agent2") ? "Agent 2" : "Agent 1";

  const recipients: LeaseRenewalRecipient[] = [];
  if (lease.owner1_email) recipients.push({ role: "owner", name: lease.owner1_name || "Owner", email: lease.owner1_email });
  if (lease.tenant1_email) recipients.push({ role: "tenant", name: lease.tenant1_name || "Tenant", email: lease.tenant1_email });
  if (lease.owner2_email) recipients.push({ role: "owner", name: lease.owner2_name || "Owner", email: lease.owner2_email });
  if (lease.tenant2_email) recipients.push({ role: "tenant", name: lease.tenant2_name || "Tenant", email: lease.tenant2_email });

  const primaryTenantName = lease.tenant1_name || lease.tenant2_name || "Tenant";
  recipients.push({ role: "agent", name: "Agent", email: senderEmail });

  let sentCount = 0;
  let failedCount = 0;
  const recipientLogs: Array<{
    client_id: string | null;
    client_name: string;
    client_email: string | null;
    sender_used: string | null;
    status: string;
    error_detail: string | null;
  }> = [];

  for (const recipient of recipients) {
    let html: string;
    let subject: string;
    let fromEmail: string;

    if (recipient.role === "owner") {
      html = buildOwnerLeaseRenewalEmail(recipient.name, propertyAddress, leaseEndDate, senderName);
      subject = `Lease Expiration Notice — ${propertyAddress}`;
      fromEmail = senderEmail;
    } else if (recipient.role === "tenant") {
      html = buildTenantLeaseRenewalEmail(recipient.name, propertyAddress, leaseEndDate, senderName);
      subject = "Important Notice — Your Lease is Approaching Expiration";
      fromEmail = senderEmail;
    } else {
      html = buildAgentLeaseRenewalNotificationEmail(propertyAddress, primaryTenantName, leaseEndDate, senderName);
      subject = `[Action Required] Lease Renewal Email Sent — ${propertyAddress}`;
      fromEmail = "agent1@aurarealty.com";
    }

    const result = await sendLeaseRenewalEmail(recipient, html, fromEmail, subject);
    if (result.status === "sent") sentCount++;
    else failedCount++;

    recipientLogs.push({
      client_id: null,
      client_name: recipient.name,
      client_email: recipient.email,
      sender_used: fromEmail,
      status: result.status,
      error_detail: result.errorDetail,
    });
  }

  try {
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("email_campaigns")
      .insert({
        campaign_type: "lease_renewal",
        campaign_title: `Lease Renewal — ${propertyAddress}`,
        recipient_filter: JSON.stringify({ leaseId }),
        total_recipients: recipients.length,
        sent_count: sentCount,
        failed_count: failedCount,
        skipped_count: 0,
        created_by: createdBy,
        content_html: null,
      })
      .select("id")
      .single();

    if (!campaignError && campaign) {
      await supabaseAdmin
        .from("email_campaign_recipients")
        .insert(recipientLogs.map((r) => ({ ...r, campaign_id: campaign.id })));
    }
  } catch (err) {
    console.error("[lease renewal email] failed to log campaign history:", err);
  }

  if (sentCount > 0) {
    await supabaseAdmin
      .from("lease_reminders")
      .update({ renewal_email_sent_at: new Date().toISOString() })
      .eq("id", leaseId);
  }

  return { ok: true, sent: sentCount, failed: failedCount };
}
