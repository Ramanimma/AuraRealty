import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { sendBirthdayEmail } from "./email.js";
import { sendLeaseRenewalForLease } from "./leaseRenewal.js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Admin client not configured — SUPABASE_SERVICE_ROLE_KEY missing");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  });
}

// Sends birthday emails to every master_clients record whose birthdate is
// today (month + day) and who hasn't opted out.
// Logs a single campaign entry with every recipient recorded individually.
export async function sendTodaysBirthdayEmails(): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const todayStr = today.toISOString().split("T")[0];

  const { data: clients, error } = await supabaseAdmin
    .from("master_clients")
    .select("id, full_name, email_address, birthdate, sender_email, unsubscribe_token, email_opted_out")
    .not("birthdate", "is", null);

  if (error) {
    console.error("[Automation] Failed to fetch birthday clients:", error.message);
    return;
  }

  const todaysClients = (clients || []).filter((c) => {
    if (!c.birthdate || !c.email_address || c.email_opted_out) return false;
    const parts = String(c.birthdate).split("-");
    const mm = parseInt(parts[1], 10);
    const dd = parseInt(parts[2], 10);
    return mm === month && dd === day;
  });

  if (todaysClients.length === 0) {
    console.log("[Automation] No birthday clients today.");
    return;
  }

  let sent = 0;
  let failed = 0;
  const recipientLogs: Array<{
    client_id: string;
    client_name: string;
    client_email: string | null;
    sender_used: string | null;
    status: "sent" | "failed";
    error_detail: string | null;
  }> = [];

  for (const client of todaysClients) {
    const clientName = client.full_name || "Friend";
    const firstName = clientName.split(" ")[0];
    const senderEmail = client.sender_email || "ramanimma@texasrealtyhub.com";
    const senderName = senderEmail.includes("swetha") ? "Swetha Nimma" : "Rama Nimma";
    const unsubscribeToken = client.unsubscribe_token || "unknown";

    let status: "sent" | "failed" = "sent";
    let errorDetail: string | null = null;

    try {
      await sendBirthdayEmail({
        toEmail: client.email_address as string,
        firstName,
        senderName,
        senderEmail,
        unsubscribeToken,
      });
      sent++;
      console.log(`[Automation] Birthday email sent to ${clientName} (${client.email_address})`);
    } catch (err: any) {
      failed++;
      status = "failed";
      errorDetail = err.message ?? "Unknown error";
      console.error(`[Automation] Birthday email failed for ${clientName}:`, err.message);
    }

    recipientLogs.push({
      client_id: client.id,
      client_name: clientName,
      client_email: client.email_address,
      sender_used: senderEmail,
      status,
      error_detail: errorDetail,
    });
  }

  // Log one campaign for the entire automation run
  try {
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("email_campaigns")
      .insert({
        campaign_type: "birthday",
        campaign_title: `Birthday Automation — ${todayStr}`,
        recipient_filter: JSON.stringify(todaysClients.map((c) => c.id)),
        total_recipients: todaysClients.length,
        sent_count: sent,
        failed_count: failed,
        skipped_count: 0,
        content_html: null,
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      console.error("[Automation] Failed to create birthday campaign:", campaignError?.message);
    } else {
      await supabaseAdmin
        .from("email_campaign_recipients")
        .insert(recipientLogs.map((r) => ({ ...r, campaign_id: campaign.id })));
    }
  } catch (err) {
    console.error("[Automation] Failed to log birthday campaign:", err);
  }

  console.log(`Birthday automation: sent ${sent}, failed ${failed}`);
}

// Sends lease renewal emails for every lease whose notice_reminder_date is
// today AND that hasn't already had a renewal email sent (renewal_email_sent_at
// IS NULL). This duplicate-protection check only applies to the automation —
// manual sends from the admin UI always go through regardless of this field.
export async function sendTodaysLeaseRenewalEmails(): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data: leases, error } = await supabaseAdmin
    .from("lease_reminders")
    .select("id")
    .eq("notice_reminder_date", today)
    .is("renewal_email_sent_at", null);

  if (error) {
    console.error("[Automation] Failed to fetch due lease reminders:", error.message);
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const lease of leases || []) {
    const result = await sendLeaseRenewalForLease(supabaseAdmin, lease.id, null);
    if (result.ok) {
      sent += result.sent;
      failed += result.failed;
    } else {
      failed++;
      console.error(`[Automation] Lease renewal failed for lease ${lease.id}:`, result.error);
    }
  }

  console.log(`Lease renewal automation: sent ${sent}, failed ${failed}`);
}

// ─── Holiday Greetings ────────────────────────────────────────────────────────

// Sends holiday greeting emails for every active holiday whose date is today
// and that hasn't already had a greeting sent (greeting_email_sent_at IS NULL).
export async function sendTodaysHolidayGreetings(): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data: holidays, error } = await supabaseAdmin
    .from("holidays")
    .select("*")
    .eq("holiday_date", today)
    .eq("is_active", true)
    .is("greeting_email_sent_at", null);

  if (error) {
    console.error("[Automation] Failed to fetch today's holidays:", error.message);
    return;
  }

  if (!holidays || holidays.length === 0) {
    console.log("[Automation] No holidays today.");
    return;
  }

  const { data: allClients, error: clientError } = await supabaseAdmin
    .from("master_clients")
    .select("id, full_name, email_address, sender_email, greeting_preference, email_opted_out, unsubscribe_token")
    .not("email_address", "is", null);

  if (clientError) {
    console.error("[Automation] Failed to fetch clients for holiday greetings:", clientError.message);
    return;
  }

  const resend = (await import("resend")).Resend;
  const resendClient = new resend(process.env.RESEND_API_KEY);

  for (const holiday of holidays) {
    const isUS = holiday.type === "us";

    // Audience filter
    const recipients = (allClients || []).filter((c) => {
      if (!c.email_address || c.email_opted_out) return false;
      if (isUS) return c.greeting_preference !== "none";
      return c.greeting_preference === "indian_and_us";
    });

    if (recipients.length === 0) {
      console.log(`[Automation] Holiday "${holiday.name}" — no eligible recipients.`);
      continue;
    }

    let sent = 0;
    let failed = 0;
    const recipientLogs: Array<{
      client_id: string | null;
      client_name: string;
      client_email: string | null;
      sender_used: string | null;
      status: string;
      error_detail: string | null;
    }> = [];

    for (const client of recipients) {
      const senderEmail = client.sender_email || "ramanimma@texasrealtyhub.com";
      const senderName = senderEmail.includes("swetha") ? "Swetha Nimma" : "Rama Nimma";
      const firstName = (client.full_name || "Friend").split(" ")[0];

      let status: "sent" | "failed" = "sent";
      let errorDetail: string | null = null;

      try {
        await sendHolidayGreetingEmail({
          toEmail: client.email_address,
          recipientName: firstName,
          holidayName: holiday.name,
          holidayType: holiday.type as "us" | "indian",
          senderName,
          senderEmail,
          flyerUrl: holiday.flyer_url,
        });
        sent++;
      } catch (err: any) {
        failed++;
        status = "failed";
        errorDetail = err?.message || "Unknown error";
        console.error(
          `[Automation] Holiday "${holiday.name}" failed for ${client.full_name}:`,
          err?.message || err
        );
      }

      recipientLogs.push({
        client_id: client.id,
        client_name: client.full_name || "Friend",
        client_email: client.email_address,
        sender_used: senderEmail,
        status,
        error_detail: errorDetail,
      });
    }

    // Log campaign
    try {
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from("email_campaigns")
        .insert({
          campaign_type: "holiday",
          campaign_title: `Holiday Automation — ${holiday.name}`,
          recipient_filter: JSON.stringify({ holidayId: holiday.id, type: holiday.type }),
          total_recipients: recipients.length,
          sent_count: sent,
          failed_count: failed,
          skipped_count: 0,
          content_html: null,
        })
        .select("id")
        .single();

      if (campaignError || !campaign) {
        console.error("[Automation] Failed to create holiday campaign:", campaignError?.message);
      } else {
        await supabaseAdmin
          .from("email_campaign_recipients")
          .insert(recipientLogs.map((r) => ({ ...r, campaign_id: campaign.id })));
      }
    } catch (err) {
      console.error("[Automation] Failed to log holiday campaign:", err);
    }

    // Mark holiday as sent
    if (sent > 0) {
      await supabaseAdmin
        .from("holidays")
        .update({ greeting_email_sent_at: new Date().toISOString() })
        .eq("id", holiday.id);
    }

    console.log(
      `[Automation] Holiday "${holiday.name}": sent ${sent}, failed ${failed}, total ${recipients.length}`
    );
  }
}
