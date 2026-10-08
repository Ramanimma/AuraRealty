import "dotenv/config";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { buildBrandedEmail } from "./emailLayout.js";
import { buildMarketUpdateEmail, type MarketUpdateData } from "./templates/marketUpdateEmail.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getDb() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase admin credentials not configured (SUPABASE_SERVICE_ROLE_KEY missing)");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  });
}

function senderInfo(senderEmail: string): { name: string } {
  return {
    name: senderEmail.includes("agent2") ? "Agent 2" : "Agent 1",
  };
}

export interface CampaignOptions {
  campaignType: string;
  campaignTitle: string;
  recipientFilter: string;
  contentHtml: string;
  subjectLine: string;
  createdBy?: string;
  marketUpdateData?: MarketUpdateData;
}

export interface CampaignResult {
  campaignId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
}

export async function sendCampaign(options: CampaignOptions): Promise<CampaignResult> {
  const { campaignType, campaignTitle, recipientFilter, contentHtml, subjectLine, createdBy } = options;
  const db = getDb();

  // ── 1. Resolve clients based on recipientFilter ──────────────────────────────
  let query = db
    .from("master_clients")
    .select("id, full_name, email_address, sender_email, unsubscribe_token, email_opted_out, client_role");

  // Check if recipientFilter is a JSON array of specific IDs
  let specificIds: string[] | null = null;
  try {
    const parsed = JSON.parse(recipientFilter);
    if (Array.isArray(parsed)) specificIds = parsed as string[];
  } catch {
    // not JSON — treat as named filter
  }

  if (specificIds) {
    query = query.in("id", specificIds);
  } else if (recipientFilter !== "all") {
    // "owner" | "tenant" | "buyer"
    query = query.eq("client_role", recipientFilter);
  }

  const { data: clients, error: clientError } = await query;
  if (clientError) throw new Error(`Failed to query clients: ${clientError.message}`);
  if (!clients || clients.length === 0) {
    throw new Error("No clients match the selected filter");
  }

  // ── 2. Send to each client ───────────────────────────────────────────────────
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const recipientLogs: Array<{
    client_id: string;
    client_name: string;
    client_email: string | null;
    sender_used: string | null;
    status: string;
    error_detail: string | null;
  }> = [];

  for (const client of clients) {
    const clientName = client.full_name || "Friend";
    const firstName = clientName.split(" ")[0];

    if (client.email_opted_out) {
      skippedCount++;
      recipientLogs.push({
        client_id: client.id,
        client_name: clientName,
        client_email: client.email_address ?? null,
        sender_used: null,
        status: "skipped",
        error_detail: "Client has opted out of emails",
      });
      continue;
    }

    if (!client.email_address) {
      skippedCount++;
      recipientLogs.push({
        client_id: client.id,
        client_name: clientName,
        client_email: null,
        sender_used: null,
        status: "skipped",
        error_detail: "No email address on file",
      });
      continue;
    }

    const senderEmail: string = client.sender_email || "agent1@aurarealty.com";
    const { name: senderName } = senderInfo(senderEmail);
    const unsubscribeToken: string = client.unsubscribe_token || "unknown";

    const html = options.marketUpdateData
      ? buildMarketUpdateEmail({
          ...options.marketUpdateData,
          recipientName: firstName,
          senderName,
          senderEmail,
          unsubscribeToken,
        })
      : buildBrandedEmail({
          contentHtml,
          recipientName: firstName,
          unsubscribeToken,
          senderEmail,
        });

    try {
      await resend.emails.send({
        from: `Aura Realty <${senderEmail}>`,
        to: client.email_address,
        subject: subjectLine,
        html,
      });
      sentCount++;
      recipientLogs.push({
        client_id: client.id,
        client_name: clientName,
        client_email: client.email_address,
        sender_used: senderEmail,
        status: "sent",
        error_detail: null,
      });
    } catch (err: any) {
      failedCount++;
      const detail: string =
        err?.response?.body?.errors?.[0]?.message ?? err?.message ?? "Unknown error";
      recipientLogs.push({
        client_id: client.id,
        client_name: clientName,
        client_email: client.email_address,
        sender_used: senderEmail,
        status: "failed",
        error_detail: detail,
      });
    }
  }

  // ── 3. Record campaign summary ───────────────────────────────────────────────
  // For market update campaigns, store a preview HTML (non-personalized) as the content record
  const storedContentHtml = options.marketUpdateData
    ? buildMarketUpdateEmail({
        ...options.marketUpdateData,
        recipientName: "Homeowner",
        senderName: "Agent 1",
        senderEmail: "agent1@aurarealty.com",
        unsubscribeToken: "preview",
        isPreview: true,
      })
    : contentHtml;

  const { data: campaign, error: campaignError } = await db
    .from("email_campaigns")
    .insert({
      campaign_type: campaignType,
      campaign_title: campaignTitle,
      recipient_filter: recipientFilter,
      total_recipients: clients.length,
      sent_count: sentCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      created_by: createdBy ?? null,
      content_html: storedContentHtml,
    })
    .select("id")
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Failed to log campaign: ${campaignError?.message ?? "unknown"}`);
  }

  // ── 4. Record per-recipient rows ─────────────────────────────────────────────
  if (recipientLogs.length > 0) {
    await db
      .from("email_campaign_recipients")
      .insert(recipientLogs.map((r) => ({ ...r, campaign_id: campaign.id })));
  }

  return {
    campaignId: campaign.id,
    totalRecipients: clients.length,
    sentCount,
    failedCount,
    skippedCount,
  };
}
