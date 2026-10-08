import { buildHolidayBrandedEmail } from "../emailLayout.js";

const festivalEmojis: Record<string, string> = {
  "new year": "🎆",
  "independence day": "🇺🇸",
  "thanksgiving": "🦃",
  "christmas": "🎄",
  "holi": "🌈",
  "ugadi": "🎊",
  "vinayaka chavithi": "🐘",
  "dussehra": "⚔️",
  "diwali": "🪔",
};

export function getFestivalEmoji(holidayName: string): string {
  return festivalEmojis[holidayName.toLowerCase()] || "🎉";
}

export function buildHolidayGreetingEmail(
  recipientName: string,
  holidayName: string,
  holidayType: "us" | "indian",
  senderName: string,
  isPreview = false,
  flyerUrl?: string
): string {
  const senderEmail = senderName.toLowerCase().includes("swetha")
    ? "swethanimma@texasrealtyhub.com"
    : "ramanimma@texasrealtyhub.com";

  const contentHtml = `
    <!-- Festival Flyer — full width, only if uploaded -->
    ${flyerUrl ? `
    <tr>
      <td style="padding:0;line-height:0;">
        <img src="${flyerUrl}"
             alt="${holidayName} Greetings from Texas Realty Hub"
             width="600"
             style="width:100%;max-width:600px;height:auto;display:block;border:0;border-radius:8px;"
        />
      </td>
    </tr>` : ""}

    <!-- Gold divider after flyer -->
    <tr>
      <td style="padding: 0 32px;">
        <hr style="border:none;border-top:1px solid #C9A84C;margin:24px 0 0 0;" />
      </td>
    </tr>

    <!-- Festival greeting heading — large, gold, centered -->
    <tr>
      <td style="padding: 28px 32px 8px 32px; text-align: center;">
        <h1 style="font-family: Georgia, 'Times New Roman', serif;
                   font-size: 30px;
                   font-weight: 600;
                   color: #C9A84C;
                   margin: 0;
                   line-height: 1.3;">
          ${getFestivalEmoji(holidayName)} Happy ${holidayName}, ${recipientName}!
        </h1>
      </td>
    </tr>

    <!-- Festival message paragraphs — centered, well spaced -->
    <tr>
      <td style="padding: 20px 40px 8px 40px; text-align: center;">
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif;
                   font-size: 16px;
                   color: #444444;
                   line-height: 1.8;
                   margin: 0 0 16px 0;">
          Wishing you and your family a joyful and memorable ${holidayName}!
        </p>
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif;
                   font-size: 16px;
                   color: #444444;
                   line-height: 1.8;
                   margin: 0 0 16px 0;">
          May this special occasion bring happiness, peace, and cherished
          moments with your loved ones.
        </p>
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif;
                   font-size: 15px;
                   color: #666666;
                   line-height: 1.8;
                   margin: 0;">
          From all of us at Texas Realty Hub, we are grateful to have you
          as part of our community.
        </p>
      </td>
    </tr>

    <!-- Gold divider before signature -->
    <tr>
      <td style="padding: 24px 32px 0 32px;">
        <hr style="border:none;border-top:1px solid #C9A84C;margin:0;" />
      </td>
    </tr>

    <!-- Signature -->
    <tr>
      <td style="padding: 20px 32px 32px 32px;">
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif;
                   font-size: 15px;
                   color: #444444;
                   margin: 0;
                   line-height: 1.6;">
          Warm wishes,<br/>
          <strong style="color: #222222;">${senderName}</strong>
        </p>
      </td>
    </tr>
  `;

  return buildHolidayBrandedEmail({
    contentHtml,
    recipientName,
    unsubscribeToken: "holiday-greeting",
    senderEmail,
    isPreview,
  });
}
