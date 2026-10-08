export const LOGO_URL =
  "https://xxiwznuuaouwsugtgsut.supabase.co/storage/v1/object/public/agent-photos/LogoWithTransBackgrnd%20(1).png";
export const SITE_URL = "https://texasrealtyhub.com";

const AGENTS = {
  swetha: {
    name: "Swetha Nimma",
    phone: "(512) 900-1897",
    phoneTel: "+15129001897",
    email: "swethanimma@texasrealtyhub.com",
  },
  rama: {
    name: "Rama Nimma",
    phone: "(732) 740-2800",
    phoneTel: "+17327402800",
    email: "ramanimma@texasrealtyhub.com",
  },
};

export function getAgent(senderEmail: string) {
  return senderEmail.includes("swetha") ? AGENTS.swetha : AGENTS.rama;
}

export function buildBrandedEmail({
  contentHtml,
  recipientName,
  unsubscribeToken,
  senderEmail = "ramanimma@texasrealtyhub.com",
  isPreview = false,
}: {
  contentHtml: string;
  recipientName: string;
  unsubscribeToken: string;
  senderEmail?: string;
  isPreview?: boolean;
}): string {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
  const agent = getAgent(senderEmail);

  const unsubscribeSection = isPreview
    ? `<p style="color:#999;font-size:11px;font-style:italic;">
                      [Preview mode — unsubscribe link disabled]
                    </p>`
    : `<a href="${unsubscribeUrl}" target="_blank"
                      style="color:#999999;text-decoration:underline;">
                      Unsubscribe from these emails
                    </a>`;

  const footerLink = `color:#666666;text-decoration:none;`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Texas Realty Hub</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F3EF;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#F5F3EF;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Content card (max 600px) -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td align="center" bgcolor="#111111"
              style="background-color:#111111;padding:24px 24px;">
              <a href="${SITE_URL}" target="_blank" style="display:inline-block;text-decoration:none;">
                <img
                  src="${LOGO_URL}"
                  alt="Texas Realty Hub"
                  width="160"
                  style="max-height:60px;width:auto;display:block;border:0;outline:none;"
                />
              </a>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td bgcolor="#FFFFFF"
              style="background-color:#FFFFFF;padding:32px 24px;color:#1C1C1C;
                     font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;">
              ${contentHtml}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#F0EDE6"
              style="background-color:#F0EDE6;padding:24px;text-align:center;
                     color:#666666;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.8;">

              <p style="margin:0 0 2px 0;font-weight:700;font-size:14px;color:#1C1C1C;">
                ${agent.name}
              </p>
              <p style="margin:0 0 10px 0;font-size:11px;color:#888888;font-style:italic;letter-spacing:0.04em;">
                Licensed REALTOR&reg;
              </p>

              <p style="margin:0 0 3px 0;">
                <a href="tel:${agent.phoneTel}" style="${footerLink}">&#128222; ${agent.phone}</a>
              </p>
              <p style="margin:0 0 10px 0;">
                <a href="mailto:${agent.email}" style="${footerLink}">&#9993; ${agent.email}</a>
              </p>

              <p style="margin:0 0 3px 0;">
                <a href="${SITE_URL}" target="_blank" style="${footerLink}">&#127760; texasrealtyhub.com</a>
              </p>
              <p style="margin:0 0 20px 0;font-style:italic;font-size:11px;color:#999999;">
                Full Circle Real Estate
              </p>

              <!-- Gold divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #C9A84C;padding-top:16px;font-size:11px;color:#999999;">
                    You are receiving this email because you are a client of Texas Realty Hub.<br />
                    ${unsubscribeSection}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
        <!-- /Content card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`;
}

// Holiday-specific branded shell. Same footer, content area, and unsubscribe
// logic as buildBrandedEmail, but with a premium gradient header + gold divider.
export function buildHolidayBrandedEmail({
  contentHtml,
  recipientName,
  unsubscribeToken,
  senderEmail = "ramanimma@texasrealtyhub.com",
  isPreview = false,
}: {
  contentHtml: string;
  recipientName: string;
  unsubscribeToken: string;
  senderEmail?: string;
  isPreview?: boolean;
}): string {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
  const agent = getAgent(senderEmail);

  const unsubscribeSection = isPreview
    ? `<p style="color:#999;font-size:11px;font-style:italic;">
                      [Preview mode — unsubscribe link disabled]
                    </p>`
    : `<a href="${unsubscribeUrl}" target="_blank"
                       style="color:#999999;text-decoration:underline;">
                       Unsubscribe from these emails
                     </a>`;

  const footerLink = `color:#666666;text-decoration:none;`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Texas Realty Hub</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F3EF;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#F5F3EF;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Content card (max 600px) -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- HOLIDAY EMAIL HEADER -->
          <tr>
            <td style="background: linear-gradient(180deg, #1E293B 0%, #111827 100%); padding: 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 20px 28px; vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <!-- Logo — left aligned, 46px -->
                        <td style="vertical-align: middle; padding-right: 14px;">
                          <img src="${LOGO_URL}"
                               alt="Texas Realty Hub"
                               width="46"
                               height="46"
                               style="width:54px;height:54px;border-radius:50%;display:block;" />
                        </td>
                        <!-- Brand name + tagline -->
                        <td style="vertical-align: middle;">
                          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                                       font-size: 24px;
                                       font-weight: 700;
                                       color: #FFFFFF;
                                       line-height: 1.2;
                                       margin: 0 0 4px 0;">
                            Texas Realty Hub
                          </div>
                          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                                       font-size: 14px;
                                       font-weight: 400;
                                       color: #D1D5DB;
                                       line-height: 1.3;
                                       margin: 0;">
                            Premium real estate in Austin &amp; Central Texas
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold divider — 2px luxury gold -->
          <tr>
            <td style="background-color: #D4AF37; height: 2px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- 20px breathing space before flyer -->
          <tr>
            <td style="height: 14px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td bgcolor="#FFFFFF"
              style="background-color:#FFFFFF;padding:0 24px 32px 24px;color:#1C1C1C;
                     font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;">
              ${contentHtml}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#F0EDE6"
              style="background-color:#F0EDE6;padding:24px;text-align:center;
                     color:#666666;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.8;">

              <p style="margin:0 0 2px 0;font-weight:700;font-size:14px;color:#1C1C1C;">
                ${agent.name}
              </p>
              <p style="margin:0 0 10px 0;font-size:11px;color:#888888;font-style:italic;letter-spacing:0.04em;">
                Licensed REALTOR&reg;
              </p>

              <p style="margin:0 0 3px 0;">
                <a href="tel:${agent.phoneTel}" style="${footerLink}">&#128222; ${agent.phone}</a>
              </p>
              <p style="margin:0 0 10px 0;">
                <a href="mailto:${agent.email}" style="${footerLink}">&#9993; ${agent.email}</a>
              </p>

              <p style="margin:0 0 3px 0;">
                <a href="${SITE_URL}" target="_blank" style="${footerLink}">&#127760; texasrealtyhub.com</a>
              </p>
              <p style="margin:0 0 20px 0;font-style:italic;font-size:11px;color:#999999;">
                Full Circle Real Estate
              </p>

              <!-- Gold divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #C9A84C;padding-top:16px;font-size:11px;color:#999999;">
                    You are receiving this email because you are a client of Texas Realty Hub.<br />
                    ${unsubscribeSection}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
        <!-- /Content card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`;
}
