import { LOGO_URL, SITE_URL, getAgent } from "../emailLayout.js";

const DEFAULT_BANNER_URL =
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80"; // Austin skyline

export interface MarketUpdateData {
  month: string;           // e.g. "July 2026"
  bannerImageUrl?: string;
  medianPrice: string;     // e.g. "$485,000"
  medianPriceTrend?: string;
  daysOnMarket: string;    // e.g. "28"
  daysOnMarketTrend?: string;
  homesSold: string;       // e.g. "342"
  homesSoldTrend?: string;
  inventory: string;       // e.g. "2.1 months"
  inventoryTrend?: string;
  neighborhoodSpotlight: string;
  buyerInsights: string;
  sellerInsights: string;
  tipOfTheMonth: string;
  marketSummary: string;
  recipientName: string;
  senderName: string;
  unsubscribeToken: string;
  senderEmail: string;
  isPreview?: boolean;
}

function trendColor(trend?: string): string {
  if (!trend) return "#6B7280";
  if (trend.startsWith("▲") || trend.startsWith("+")) return "#16A34A";
  if (trend.startsWith("▼") || trend.startsWith("-")) return "#DC2626";
  return "#6B7280";
}

function sectionHeading(emoji: string, title: string): string {
  return `
    <tr>
      <td style="padding:24px 32px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-left:3px solid #C9A84C;padding-left:12px;">
              <p style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#1E293B;margin:0;">
                ${emoji} ${title}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function divider(): string {
  return `<tr><td><hr style="border:none;border-top:1px solid #E5E7EB;margin:0 32px;" /></td></tr>`;
}

export function buildMarketUpdateEmail(data: MarketUpdateData): string {
  const {
    month,
    bannerImageUrl,
    medianPrice, medianPriceTrend,
    daysOnMarket, daysOnMarketTrend,
    homesSold, homesSoldTrend,
    inventory, inventoryTrend,
    neighborhoodSpotlight,
    buyerInsights,
    sellerInsights,
    tipOfTheMonth,
    marketSummary,
    recipientName,
    senderName,
    unsubscribeToken,
    senderEmail,
    isPreview = false,
  } = data;

  const agent = getAgent(senderEmail);
  const bannerUrl = bannerImageUrl || DEFAULT_BANNER_URL;
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
  const footerLink = `color:#666666;text-decoration:none;`;

  const unsubscribeSection = isPreview
    ? `<p style="color:#999;font-size:11px;font-style:italic;">[Preview mode — unsubscribe link disabled]</p>`
    : `<a href="${unsubscribeUrl}" target="_blank" style="color:#999999;text-decoration:underline;">Unsubscribe from these emails</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>DFW Market Report — ${month} | Aura Realty</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F3EF;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#F5F3EF;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Content card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);">

          <!-- ── HEADER ─────────────────────────────────────────────── -->
          <tr>
            <td style="background:linear-gradient(180deg,#1E293B 0%,#111827 100%);padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:20px 28px;vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:14px;">
                          <img src="${LOGO_URL}" alt="Aura Realty" width="54" height="54"
                               style="width:54px;height:54px;border-radius:50%;display:block;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.2;margin:0 0 4px 0;">
                            Aura Realty
                          </div>
                          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:400;color:#D1D5DB;line-height:1.3;margin:0;">
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

          <!-- Gold divider -->
          <tr>
            <td style="background-color:#D4AF37;height:2px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── HERO BANNER ─────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#1E293B;background-image:url('${bannerUrl}');background-size:cover;background-position:center;padding:60px 32px;text-align:center;mso-padding-alt:60px 32px;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:220px;position:absolute;">
                <v:fill type="tile" src="${bannerUrl}" color="#1E293B" />
                <v:textbox inset="0,0,0,0">
              <![endif]-->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:center;padding:0;">
                    <p style="color:#C9A84C;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px 0;font-family:'Helvetica Neue',Arial,sans-serif;">
                      Aura Realty
                    </p>
                    <h1 style="color:#FFFFFF;font-size:28px;font-weight:700;font-family:Georgia,serif;margin:0 0 8px 0;text-shadow:0 2px 8px rgba(0,0,0,0.6);">
                      DFW Market Report
                    </h1>
                    <p style="color:#E5E7EB;font-size:16px;margin:0;font-family:'Helvetica Neue',Arial,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,0.5);">
                      ${month}
                    </p>
                  </td>
                </tr>
              </table>
              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>

          <!-- ── GREETING + MARKET SUMMARY ─────────────────────────── -->
          <tr>
            <td style="padding:28px 32px 8px;background:#ffffff;">
              <p style="font-size:16px;color:#333;font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.7;margin:0 0 12px 0;">
                Dear ${recipientName},
              </p>
              <p style="font-size:15px;color:#555;line-height:1.7;margin:0;font-family:'Helvetica Neue',Arial,sans-serif;">
                ${marketSummary}
              </p>
            </td>
          </tr>

          <!-- ── MARKET STATS HEADING ───────────────────────────────── -->
          ${sectionHeading("📈", "Market at a Glance")}

          <!-- ── STAT CARDS 2×2 ─────────────────────────────────────── -->
          <tr>
            <td style="padding:8px 24px 16px;background:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Card 1: Median Price -->
                  <td width="48%" style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;vertical-align:top;">
                    <p style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;">Median Home Price</p>
                    <p style="font-size:24px;font-weight:700;color:#1E293B;margin:0 0 4px;font-family:Georgia,serif;">${medianPrice}</p>
                    <p style="font-size:12px;color:${trendColor(medianPriceTrend)};margin:0;font-family:'Helvetica Neue',Arial,sans-serif;">${medianPriceTrend || "&nbsp;"}</p>
                  </td>
                  <td width="4%"></td>
                  <!-- Card 2: Days on Market -->
                  <td width="48%" style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;vertical-align:top;">
                    <p style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;">Days on Market</p>
                    <p style="font-size:24px;font-weight:700;color:#1E293B;margin:0 0 4px;font-family:Georgia,serif;">${daysOnMarket}</p>
                    <p style="font-size:12px;color:${trendColor(daysOnMarketTrend)};margin:0;font-family:'Helvetica Neue',Arial,sans-serif;">${daysOnMarketTrend || "&nbsp;"}</p>
                  </td>
                </tr>
                <tr><td colspan="3" style="height:12px;"></td></tr>
                <tr>
                  <!-- Card 3: Homes Sold -->
                  <td width="48%" style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;vertical-align:top;">
                    <p style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;">Homes Sold</p>
                    <p style="font-size:24px;font-weight:700;color:#1E293B;margin:0 0 4px;font-family:Georgia,serif;">${homesSold}</p>
                    <p style="font-size:12px;color:${trendColor(homesSoldTrend)};margin:0;font-family:'Helvetica Neue',Arial,sans-serif;">${homesSoldTrend || "&nbsp;"}</p>
                  </td>
                  <td width="4%"></td>
                  <!-- Card 4: Inventory -->
                  <td width="48%" style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:8px;padding:16px;text-align:center;vertical-align:top;">
                    <p style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;">Active Inventory</p>
                    <p style="font-size:24px;font-weight:700;color:#1E293B;margin:0 0 4px;font-family:Georgia,serif;">${inventory}</p>
                    <p style="font-size:12px;color:${trendColor(inventoryTrend)};margin:0;font-family:'Helvetica Neue',Arial,sans-serif;">${inventoryTrend || "&nbsp;"}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${divider()}

          <!-- ── NEIGHBORHOOD SPOTLIGHT ─────────────────────────────── -->
          ${sectionHeading("🏘️", "Neighborhood Spotlight")}
          <tr><td style="padding:0 32px 20px;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;">${neighborhoodSpotlight || "<p>Coming soon.</p>"}</td></tr>

          ${divider()}

          <!-- ── BUYER INSIGHTS ─────────────────────────────────────── -->
          ${sectionHeading("🏠", "For Buyers")}
          <tr><td style="padding:0 32px 20px;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;">${buyerInsights || "<p>Coming soon.</p>"}</td></tr>

          ${divider()}

          <!-- ── SELLER INSIGHTS ────────────────────────────────────── -->
          ${sectionHeading("📋", "For Sellers")}
          <tr><td style="padding:0 32px 20px;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;">${sellerInsights || "<p>Coming soon.</p>"}</td></tr>

          ${divider()}

          <!-- ── TIP OF THE MONTH ───────────────────────────────────── -->
          ${sectionHeading("💡", "Tip of the Month")}
          <tr><td style="padding:0 32px 20px;background:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;">${tipOfTheMonth || "<p>Coming soon.</p>"}</td></tr>

          <!-- ── CALL TO ACTION ─────────────────────────────────────── -->
          <tr>
            <td style="padding:24px 32px;text-align:center;background:#F8F9FA;">
              <p style="font-family:Georgia,serif;font-size:18px;color:#1E293B;font-weight:600;margin:0 0 8px;">
                Ready to make your next move?
              </p>
              <p style="font-size:14px;color:#6B7280;margin:0 0 20px;font-family:'Helvetica Neue',Arial,sans-serif;">
                Let's discuss what these market trends mean for you personally.
              </p>
              <a href="${SITE_URL}/contact"
                 style="display:inline-block;background:#C9A84C;color:#000000;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:2px;">
                Schedule a Free Consultation
              </a>
              <br/><br/>
              <a href="${SITE_URL}/properties"
                 style="font-size:13px;color:#C9A84C;font-family:'Helvetica Neue',Arial,sans-serif;text-decoration:underline;">
                Browse Current Listings &rarr;
              </a>
            </td>
          </tr>

          <!-- ── FOOTER ─────────────────────────────────────────────── -->
          <tr>
            <td bgcolor="#F0EDE6" style="background-color:#F0EDE6;padding:24px;text-align:center;color:#666666;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.8;">

              <p style="margin:0 0 2px 0;font-weight:700;font-size:14px;color:#1C1C1C;">${agent.name}</p>
              <p style="margin:0 0 10px 0;font-size:11px;color:#888888;font-style:italic;letter-spacing:0.04em;">Licensed REALTOR&reg;</p>

              <p style="margin:0 0 3px 0;"><a href="tel:${agent.phoneTel}" style="${footerLink}">&#128222; ${agent.phone}</a></p>
              <p style="margin:0 0 10px 0;"><a href="mailto:${agent.email}" style="${footerLink}">&#9993; ${agent.email}</a></p>

              <p style="margin:0 0 3px 0;"><a href="${SITE_URL}" target="_blank" style="${footerLink}">&#127760; aurarealty.com</a></p>
              <p style="margin:0 0 20px 0;font-style:italic;font-size:11px;color:#999999;">Full Circle Real Estate</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #C9A84C;padding-top:16px;font-size:11px;color:#999999;">
                    You are receiving this email because you are a client of Aura Realty.<br />
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

export interface MarketUpdateNewsletterData {
  medianPrice: string;
  medianPriceTrend: string;
  homesSold: string;
  homesSoldTrend: string;
  daysOnMarket: string;
  daysOnMarketTrend: string;
  soldListRatio: string;
  soldListRatioTrend: string;
  pricePerSqFt: string;
  pricePerSqFtTrend: string;
  inventory: string;
  inventoryTrend: string;
  marketSummary: string;
  neighborhoodSpotlight: string;
  buyerInsights: string;
  sellerInsights: string;
  tipOfMonth: string;
  month: string;
}

export function buildMarketUpdateNewsletterHtml(data: MarketUpdateNewsletterData): string {
  function bullets(text: string): string {
    if (!text) return "<p>See full report for details.</p>";
    const result = text.split("|").map((b) => b.trim()).filter(Boolean)
      .map((b) => `<p style="margin-bottom:8px;">• ${b}</p>`).join("");
    return result;
  }

  return `
    <h2 style="font-family:Georgia,serif;font-size:13px;color:#C9A84C;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;text-align:center;">Austin Real Estate Market Update</h2>
    <h1 style="font-family:Georgia,serif;font-size:24px;color:#111827;margin:0 0 20px;text-align:center;">${data.month}</h1>

    <p style="font-family:Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">${data.marketSummary}</p>

    <h2 style="font-family:Georgia,serif;font-size:18px;color:#111827;border-left:4px solid #C9A84C;padding-left:10px;margin:0 0 12px;">📊 Market Snapshot</h2>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#374151;line-height:1.9;margin:0 0 24px;">
      <strong>Median Home Price:</strong> ${data.medianPrice} ${data.medianPriceTrend}<br/>
      <strong>Homes Sold:</strong> ${data.homesSold} ${data.homesSoldTrend}<br/>
      <strong>Days on Market:</strong> ${data.daysOnMarket} ${data.daysOnMarketTrend}<br/>
      <strong>Sold-to-List Ratio:</strong> ${data.soldListRatio} ${data.soldListRatioTrend}<br/>
      <strong>Price per Sq Ft:</strong> ${data.pricePerSqFt} ${data.pricePerSqFtTrend}<br/>
      <strong>Active Inventory:</strong> ${data.inventory} ${data.inventoryTrend}
    </p>

    <h2 style="font-family:Georgia,serif;font-size:18px;color:#111827;border-left:4px solid #C9A84C;padding-left:10px;margin:0 0 12px;">🏘️ Neighborhood Spotlight</h2>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">${data.neighborhoodSpotlight}</p>

    <h2 style="font-family:Georgia,serif;font-size:18px;color:#111827;border-left:4px solid #C9A84C;padding-left:10px;margin:0 0 12px;">🏡 For Buyers</h2>
    <div style="margin:0 0 24px;">${bullets(data.buyerInsights)}</div>

    <h2 style="font-family:Georgia,serif;font-size:18px;color:#111827;border-left:4px solid #C9A84C;padding-left:10px;margin:0 0 12px;">💰 For Sellers</h2>
    <div style="margin:0 0 24px;">${bullets(data.sellerInsights)}</div>

    <h2 style="font-family:Georgia,serif;font-size:18px;color:#111827;border-left:4px solid #C9A84C;padding-left:10px;margin:0 0 12px;">⭐ Tip of the Month</h2>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">${data.tipOfMonth}</p>

    <p style="font-family:Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;margin:0;text-align:center;">
      <strong>Thinking About Buying or Selling?</strong><br/>
      Contact us today to schedule a free consultation.<br/>
      <a href="https://aurarealty.com/contact" style="color:#C9A84C;">aurarealty.com/contact</a>
    </p>
  `;
}
