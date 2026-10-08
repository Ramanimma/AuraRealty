import { buildBrandedEmail } from "../emailLayout.js";

function nl2p(text: string): string {
  return text
    .split("\n\n")
    .map((para) => `<p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.8;">${para.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function buildTenantLeaseRenewalEmail(
  tenantName: string,
  propertyAddress: string,
  leaseEndDate: string,
  senderName: string,
  isPreview = false
): string {
  const contentHtml = `
    <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1C1C1C;">
      Important Notice — Your Lease is Approaching Expiration
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.8;">Dear ${tenantName},</p>
    ${nl2p(
      `We wanted to reach out regarding your lease at ${propertyAddress}.\nYour current lease agreement is scheduled to expire on ${leaseEndDate}.`
    )}
    ${nl2p(
      `If you would like to discuss renewal options or have any questions about the next steps, please don't hesitate to contact us — we're here to help.`
    )}
    ${nl2p(`We appreciate you as a valued tenant and look forward to hearing from you.`)}
    <p style="margin:24px 0 4px;font-size:15px;color:#444444;line-height:1.8;">Warm regards,</p>
    <p style="margin:0;font-size:16px;font-weight:600;color:#1C1C1C;">${senderName}</p>
  `;
  return buildBrandedEmail({
    contentHtml,
    recipientName: tenantName,
    unsubscribeToken: "n/a",
    senderEmail: senderName.toLowerCase().includes("agent2") ? "agent2@aurarealty.com" : "agent1@aurarealty.com",
    isPreview,
  });
}

export function buildOwnerLeaseRenewalEmail(
  ownerName: string,
  propertyAddress: string,
  leaseEndDate: string,
  senderName: string,
  isPreview = false
): string {
  const contentHtml = `
    <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1C1C1C;">
      Lease Expiration Notice — ${propertyAddress}
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.8;">Dear ${ownerName},</p>
    ${nl2p(
      `This is to inform you that the lease for your property at ${propertyAddress} is approaching its expiration date of ${leaseEndDate}.`
    )}
    ${nl2p(
      `We have notified the tenant regarding the upcoming lease expiration and renewal options. We will keep you informed of any updates or decisions made by the tenant.`
    )}
    ${nl2p(`Please feel free to reach out if you have any questions or would like to discuss next steps.`)}
    <p style="margin:24px 0 4px;font-size:15px;color:#444444;line-height:1.8;">Warm regards,</p>
    <p style="margin:0;font-size:16px;font-weight:600;color:#1C1C1C;">${senderName}</p>
  `;
  return buildBrandedEmail({
    contentHtml,
    recipientName: ownerName,
    unsubscribeToken: "n/a",
    senderEmail: senderName.toLowerCase().includes("agent2") ? "agent2@aurarealty.com" : "agent1@aurarealty.com",
    isPreview,
  });
}

export function buildAgentLeaseRenewalNotificationEmail(
  propertyAddress: string,
  tenantName: string,
  leaseEndDate: string,
  agentName: string,
  isPreview = false
): string {
  const contentHtml = `
    <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1C1C1C;">
      [Action Required] Lease Renewal Email Sent — ${propertyAddress}
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#444444;line-height:1.8;">Hi ${agentName},</p>
    ${nl2p(
      `This is an automated notification to inform you that the Lease Renewal / Expiry email has been sent for the following lease:`
    )}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EEEEEE;border-radius:2px;overflow:hidden;margin:0 0 24px;">
      <tr>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#555555;white-space:nowrap;width:140px;border-bottom:1px solid #EEEEEE;">Property</td>
        <td style="padding:10px 16px;font-size:13px;color:#1C1C1C;border-bottom:1px solid #EEEEEE;">${propertyAddress}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#555555;white-space:nowrap;width:140px;border-bottom:1px solid #EEEEEE;">Tenant</td>
        <td style="padding:10px 16px;font-size:13px;color:#1C1C1C;border-bottom:1px solid #EEEEEE;">${tenantName}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#555555;white-space:nowrap;width:140px;">Lease End Date</td>
        <td style="padding:10px 16px;font-size:13px;color:#1C1C1C;">${leaseEndDate}</td>
      </tr>
    </table>
    ${nl2p(
      `Both the tenant and owner have been notified. Please follow up with the tenant if needed to discuss renewal options or next steps.`
    )}
    <p style="margin:24px 0 0;font-size:15px;font-weight:500;color:#1C1C1C;">Aura Realty</p>
  `;
  return buildBrandedEmail({
    contentHtml,
    recipientName: "Agent",
    unsubscribeToken: "n/a",
    senderEmail: "agent1@aurarealty.com",
    isPreview,
  });
}
