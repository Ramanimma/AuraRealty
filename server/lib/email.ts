import { Resend } from "resend";
import { buildBrandedEmail } from "./emailLayout.js";
import { buildHolidayGreetingEmail, getFestivalEmoji } from "./templates/holidayGreetingEmail.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "ramanimma@texasrealtyhub.com";
const FROM_NAME = process.env.RESEND_FROM_NAME || "Texas Realty Hub";
const AGENT_EMAIL = "ramanimma@texasrealtyhub.com";
const AGENT_EMAIL_2 = "swethanimma@texasrealtyhub.com";
const SITE_URL = "https://444d061f-7f31-4310-9fe8-9530001c2ca3-00-2amm4076yk3sk.janeway.replit.dev";

// ─── Shared HTML helpers ───────────────────────────────────────────────────────

function htmlWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Texas Realty Hub</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        ${bodyContent}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function header(title = "Texas Realty Hub"): string {
  return `<tr>
    <td style="background:#1C2B4A;padding:28px 40px;text-align:center;">
      <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:0.04em;">${title}</p>
    </td>
  </tr>`;
}

function footer(): string {
  return `<tr>
    <td style="background:#1C1C1C;padding:24px 40px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">
        Texas Realty Hub &nbsp;|&nbsp; <a href="mailto:ramanimma@texasrealtyhub.com" style="color:rgba(255,255,255,0.5);text-decoration:none;">ramanimma@texasrealtyhub.com</a>
      </p>
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);font-family:Arial,sans-serif;">
        TREC licensed real estate broker. This email and any attachments are confidential.
      </p>
    </td>
  </tr>`;
}

function goldButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#C9A84C;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 36px;">${label}</a>`;
}

function detailsTable(rows: Array<[string, string | null | undefined]>): string {
  const rowsHtml = rows
    .filter(([, val]) => val)
    .map(([label, val]) => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#555555;white-space:nowrap;width:140px;border-bottom:1px solid #EEEEEE;">${label}</td>
        <td style="padding:10px 16px;font-size:13px;color:#1C1C1C;border-bottom:1px solid #EEEEEE;">${val}</td>
      </tr>`)
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EEEEEE;border-radius:2px;overflow:hidden;">${rowsHtml}</table>`;
}

// ─── G) Birthday Email — Client Outreach ──────────────────────────────────────

export interface BirthdayEmailData {
  toEmail: string;
  firstName: string;
  senderName: string;
  senderEmail: string;
  unsubscribeToken: string;
  isPreview?: boolean;
}

export function buildBirthdayEmailHtml(data: BirthdayEmailData): string {
  const contentHtml = `
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#888888;letter-spacing:0.02em;">
      Happy Birthday,
    </p>
    <p style="margin:0 0 32px;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#1C1C1C;line-height:1.15;">
      ${data.firstName}! 🎉
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.8;">
      Wishing you a wonderful birthday from all of us at Texas Realty Hub.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.8;">
      We hope your day is filled with joy, good company, and everything that makes it special.
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#444444;line-height:1.8;">
      Thank you for being part of our community — we're grateful to know you.
    </p>

    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.8;">Warm wishes,</p>
    <p style="margin:0 0 2px;font-size:16px;font-weight:600;color:#1C1C1C;">${data.senderName}</p>
    <p style="margin:0 0 16px;font-size:12px;color:#888888;font-style:italic;letter-spacing:0.04em;">Licensed REALTOR&reg;</p>
    <p style="margin:0;font-size:15px;font-weight:500;color:#1C1C1C;">Texas Realty Hub</p>
  `;
  return buildBrandedEmail({
    contentHtml,
    recipientName: data.firstName,
    unsubscribeToken: data.unsubscribeToken,
    senderEmail: data.senderEmail,
    isPreview: data.isPreview,
  });
}

export async function sendBirthdayEmail(data: BirthdayEmailData): Promise<void> {
  const html = buildBirthdayEmailHtml(data);
  await resend.emails.send({
    from: `Texas Realty Hub <${data.senderEmail}>`,
    to: data.toEmail,
    subject: `Happy Birthday, ${data.firstName}! 🎉`,
    html,
  });
}

// ─── H) Lease Renewal / Expiry — Manual Send ──────────────────────────────────

export interface LeaseRenewalRecipient {
  role: "owner" | "tenant" | "agent";
  name: string;
  email: string;
}

export interface LeaseRenewalSendResult {
  recipient: LeaseRenewalRecipient;
  status: "sent" | "failed";
  errorDetail: string | null;
}

export async function sendLeaseRenewalEmail(
  recipient: LeaseRenewalRecipient,
  html: string,
  fromEmail: string,
  subject: string
): Promise<LeaseRenewalSendResult> {
  try {
    await resend.emails.send({
      from: `Texas Realty Hub <${fromEmail}>`,
      to: recipient.email,
      subject,
      html,
    });
    return { recipient, status: "sent", errorDetail: null };
  } catch (err: any) {
    const detail: string = err?.response?.body?.errors?.[0]?.message ?? err?.message ?? "Unknown error";
    return { recipient, status: "failed", errorDetail: detail };
  }
}

// ─── A) Tour Request — Agent Notification ─────────────────────────────────────

export interface TourRequestData {
  full_name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  preferred_date?: string | null;
  listing_id?: string | null;
  inquiry_id?: string | null;
  type?: string;
}

export async function sendTourRequestToAgent(data: TourRequestData): Promise<void> {
  console.log('[EMAIL] sendTourRequestToAgent called for:', data.email);
  const body = htmlWrapper(`
    ${header()}
    <tr>
      <td style="background:#ffffff;padding:40px 40px 24px;">
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1C1C1C;">New Tour Request Received</h1>
        <p style="margin:0 0 28px;font-size:14px;color:#888888;">Submitted on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        ${detailsTable([
          ["Name", data.full_name],
          ["Email", data.email],
          ["Phone", data.phone],
          ["Property ID", data.listing_id],
          ["Preferred Date", data.preferred_date],
          ["Message", data.message],
        ])}
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:8px 40px 40px;text-align:center;">
        ${goldButton("View in Dashboard", `${SITE_URL}/admin/inquiries`)}
      </td>
    </tr>
    ${footer()}
  `);

  await resend.emails.send({
    from: `Texas Realty Hub <ramanimma@texasrealtyhub.com>`,
    to: [AGENT_EMAIL, AGENT_EMAIL_2],
    subject: `🏠 New Tour Request — ${data.full_name}`,
    html: body,
  });
}

// ─── B) Tour Request — Visitor Confirmation ───────────────────────────────────

export async function sendTourConfirmationToVisitor(data: TourRequestData): Promise<void> {
  console.log('[EMAIL] sendTourConfirmationToVisitor called for:', data.email);
  const firstName = data.full_name.split(" ")[0];
  const body = htmlWrapper(`
    ${header()}
    <tr>
      <td style="background:#ffffff;padding:40px 40px 24px;">
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1C1C1C;">Thank You, ${firstName}!</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#555555;line-height:1.7;">
          We've received your tour request and one of our agents will contact you within 24 hours to confirm your appointment.
        </p>
        ${data.preferred_date || data.listing_id ? `
        <div style="background:#F8F5F0;border-left:3px solid #C9A84C;padding:18px 24px;margin-bottom:28px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#888888;">Your Request Details</p>
          ${data.preferred_date ? `<p style="margin:6px 0 0;font-size:14px;color:#1C1C1C;">📅 Preferred Date: <strong>${data.preferred_date}</strong></p>` : ""}
          ${data.listing_id ? `<p style="margin:6px 0 0;font-size:14px;color:#1C1C1C;">🏠 Property: <strong>${data.listing_id}</strong></p>` : ""}
        </div>` : ""}
        <div style="background:#1C2B4A;padding:24px;margin-bottom:28px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#C9A84C;letter-spacing:0.08em;text-transform:uppercase;">Your Agent</p>
          <p style="margin:0 0 2px;font-size:16px;font-weight:400;color:#ffffff;font-family:Georgia,serif;">Rama Nimma</p>
          <p style="margin:6px 0 2px;font-size:13px;color:rgba(255,255,255,0.7);">📞 732-740-2800</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">✉️ ramanimma@texasrealtyhub.com</p>
        </div>
        <div style="text-align:center;">
          ${goldButton("Browse More Properties", SITE_URL)}
        </div>
      </td>
    </tr>
    ${footer()}
  `);

  await resend.emails.send({
    from: `Texas Realty Hub <ramanimma@texasrealtyhub.com>`,
    to: data.email,
    subject: "We received your tour request — Texas Realty Hub",
    html: body,
  });
}

// ─── C) Home Valuation — Agent Notification ───────────────────────────────────

export interface ValuationData {
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip_code?: string | null;
  state?: string | null;
  property_type?: string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  sqft?: number | string | null;
  year_built?: number | string | null;
  condition?: string | null;
  notes?: string | null;
}

export async function sendValuationRequestToAgent(data: ValuationData): Promise<void> {
  console.log('[EMAIL] sendValuationRequestToAgent called for:', data.email);
  const addressLine = [data.address, data.city, data.state, data.zip_code].filter(Boolean).join(", ");
  const body = htmlWrapper(`
    ${header()}
    <tr>
      <td style="background:#ffffff;padding:40px 40px 24px;">
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1C1C1C;">New Home Valuation Request</h1>
        <p style="margin:0 0 28px;font-size:14px;color:#888888;">Submitted on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#888888;">Property Details</p>
        ${detailsTable([
          ["Address", data.address],
          ["City", data.city],
          ["ZIP Code", data.zip_code],
          ["State", data.state],
          ["Type", data.property_type],
          ["Bedrooms", data.bedrooms?.toString()],
          ["Bathrooms", data.bathrooms?.toString()],
          ["Sq Footage", data.sqft ? `${Number(data.sqft).toLocaleString()} sq ft` : null],
          ["Year Built", data.year_built?.toString()],
          ["Condition", data.condition],
        ])}
        <p style="margin:24px 0 12px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#888888;">Contact Information</p>
        ${detailsTable([
          ["Name", data.full_name],
          ["Email", data.email],
          ["Phone", data.phone],
        ])}
        ${data.notes ? `
        <p style="margin:24px 0 12px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#888888;">Notes</p>
        <div style="background:#F8F5F0;border:1px solid #EEEEEE;padding:16px;font-size:14px;color:#1C1C1C;line-height:1.6;">${data.notes}</div>` : ""}
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:8px 40px 40px;text-align:center;">
        ${goldButton("View in Dashboard", `${SITE_URL}/admin/dashboard`)}
      </td>
    </tr>
    ${footer()}
  `);

  await resend.emails.send({
    from: `Texas Realty Hub <ramanimma@texasrealtyhub.com>`,
    to: [AGENT_EMAIL, AGENT_EMAIL_2],
    subject: `📊 New Valuation Request — ${data.full_name} — ${addressLine || "No address"}`,
    html: body,
  });
}

// ─── D) Home Valuation — Visitor Confirmation ─────────────────────────────────

export async function sendValuationConfirmationToVisitor(data: ValuationData): Promise<void> {
  console.log('[EMAIL] sendValuationConfirmationToVisitor called for:', data.email);
  const firstName = data.full_name.split(" ")[0];
  const body = htmlWrapper(`
    ${header()}
    <tr>
      <td style="background:#ffffff;padding:40px 40px 24px;">
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1C1C1C;">We're On It, ${firstName}!</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#555555;line-height:1.7;">
          Our team is analyzing comparable sales${data.city ? ` in <strong>${data.city}</strong>` : ""} and will deliver your personalized market report within 24 hours.
        </p>
        <div style="background:#F8F5F0;border-left:3px solid #C9A84C;padding:18px 24px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#888888;">What to Expect</p>
          <p style="margin:0 0 8px;font-size:14px;color:#1C1C1C;">📊 <strong>Market Analysis</strong> — Current pricing trends in your area</p>
          <p style="margin:0 0 8px;font-size:14px;color:#1C1C1C;">🏘️ <strong>Comparable Sales</strong> — Recent sold homes near your property</p>
          <p style="margin:0;font-size:14px;color:#1C1C1C;">💡 <strong>Expert Recommendation</strong> — Pricing strategy tailored to your goals</p>
        </div>
        <div style="background:#1C2B4A;padding:24px;margin-bottom:28px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#C9A84C;letter-spacing:0.08em;text-transform:uppercase;">Your Agent</p>
          <p style="margin:0 0 2px;font-size:16px;font-weight:400;color:#ffffff;font-family:Georgia,serif;">Rama Nimma</p>
          <p style="margin:6px 0 2px;font-size:13px;color:rgba(255,255,255,0.7);">📞 732-740-2800</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">✉️ ramanimma@texasrealtyhub.com</p>
        </div>
        <div style="text-align:center;">
          ${goldButton("Learn More About Selling", `${SITE_URL}/home-valuation`)}
        </div>
      </td>
    </tr>
    ${footer()}
  `);

  await resend.emails.send({
    from: `Texas Realty Hub <ramanimma@texasrealtyhub.com>`,
    to: data.email,
    subject: "Your free home valuation request — Texas Realty Hub",
    html: body,
  });
}

// ─── E) Newsletter Signup — Welcome Email ─────────────────────────────────────

export interface NewsletterData {
  full_name?: string | null;
  email: string;
}

export async function sendNewsletterWelcome(data: NewsletterData): Promise<void> {
  const firstName = data.full_name ? data.full_name.split(" ")[0] : "Friend";
  const body = htmlWrapper(`
    ${header()}
    <tr>
      <td style="background:#ffffff;padding:40px 40px 24px;">
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1C1C1C;">Welcome, ${firstName}!</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#555555;line-height:1.7;">
          You're now part of our exclusive list. We'll keep you updated on new listings, market trends, and opportunities in Central Texas.
        </p>
        <div style="background:#F8F5F0;border-left:3px solid #C9A84C;padding:18px 24px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#888888;">What You'll Receive</p>
          <p style="margin:0 0 8px;font-size:14px;color:#1C1C1C;">🏠 <strong>New Listings</strong> — First look at fresh properties on the market</p>
          <p style="margin:0 0 8px;font-size:14px;color:#1C1C1C;">📈 <strong>Market Updates</strong> — Monthly insights on Central Texas real estate</p>
          <p style="margin:0 0 8px;font-size:14px;color:#1C1C1C;">🗺️ <strong>Neighborhood Guides</strong> — Deep dives into Leander, Georgetown, Cedar Park &amp; more</p>
          <p style="margin:0;font-size:14px;color:#1C1C1C;">💰 <strong>Investment Tips</strong> — Strategies for buyers and sellers alike</p>
        </div>
        <div style="text-align:center;">
          ${goldButton("Explore Current Listings", SITE_URL)}
        </div>
      </td>
    </tr>
    ${footer()}
  `);

  await resend.emails.send({
    from: `Texas Realty Hub <ramanimma@texasrealtyhub.com>`,
    to: data.email,
    subject: "Welcome to Texas Realty Hub Insider Updates",
    html: body,
  });
}

// ─── Holiday Greeting Email ───────────────────────────────────────────────────

export interface HolidayGreetingData {
  toEmail: string;
  recipientName: string;
  holidayName: string;
  holidayType: "us" | "indian";
  senderName: string;
  senderEmail: string;
  flyerUrl?: string;
}

export async function sendHolidayGreetingEmail(data: HolidayGreetingData): Promise<void> {
  const html = buildHolidayGreetingEmail(
    data.recipientName,
    data.holidayName,
    data.holidayType,
    data.senderName,
    false,
    data.flyerUrl
  );
  await resend.emails.send({
    from: `Texas Realty Hub <${data.senderEmail}>`,
    to: data.toEmail,
    subject: `Happy ${data.holidayName} from Texas Realty Hub! ${getFestivalEmoji(data.holidayName)}`,
    html,
  });
}

// ─── F) New Contact/Lead — Agent Notification ─────────────────────────────────

export interface LeadData {
  full_name: string;
  email: string;
  phone?: string | null;
  source?: string;
  notes?: string | null;
}

export async function sendNewLeadToAgent(data: LeadData): Promise<void> {
  const body = htmlWrapper(`
    ${header()}
    <tr>
      <td style="background:#ffffff;padding:40px 40px 24px;">
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1C1C1C;">New Lead Captured</h1>
        <p style="margin:0 0 28px;font-size:14px;color:#888888;">Source: <strong>${data.source || "Website"}</strong></p>
        ${detailsTable([
          ["Name", data.full_name],
          ["Email", data.email],
          ["Phone", data.phone],
          ["Source", data.source],
          ["Notes", data.notes],
        ])}
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:8px 40px 40px;text-align:center;">
        ${goldButton("View Contacts", `${SITE_URL}/admin/contacts`)}
      </td>
    </tr>
    ${footer()}
  `);

  await resend.emails.send({
    from: `Texas Realty Hub <ramanimma@texasrealtyhub.com>`,
    to: AGENT_EMAIL,
    subject: `👤 New Lead — ${data.full_name} from ${data.source || "Website"}`,
    html: body,
  });
}
