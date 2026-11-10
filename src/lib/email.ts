import { createServerFn } from "@tanstack/react-start";

export type CreatorEmailType = "welcome_draft" | "profile_live" | "draft_reminder" | "subscription_activated";

export type CreatorEmailInput = {
  type: CreatorEmailType;
  to: string;
  name: string;
  profileSlug?: string | undefined;
  city?: string | undefined;
  instagram?: string | undefined;
  baseUrl?: string | undefined;
  // Subscription receipt fields:
  planName?: string | undefined;
  expiresAt?: string | undefined;
  amountPaid?: number | undefined;
  discountCode?: string | undefined;
  discountAmount?: number | undefined;
  paymentId?: string | undefined;
  upgradeSource?: "paid" | "promo100" | "admin_extension" | undefined;
  extensionDays?: number | undefined;
};

export type EmailSendResult = {
  success: boolean;
  simulated?: boolean | undefined;
  messageId?: string | undefined;
  error?: string | undefined;
};

function getBaseUrl(overrideUrl?: string): string {
  if (overrideUrl && overrideUrl.startsWith("http")) {
    return overrideUrl.replace(/\/+$/, "");
  }
  return "https://influencerdhundo.com";
}

function renderWelcomeDraftHtml(name: string, baseUrl: string, city?: string): string {
  const registerUrl = `${baseUrl}/creator/register`;
  const locationText = city ? ` in ${city} and across India` : " across India";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Influencer Dhundo</title>
</head>
<body style="margin: 0; padding: 0; background-color: #d96324; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #d96324; padding: 48px 16px 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <tr>
      <td align="center">
        
        <!-- Main White Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16); overflow: hidden; text-align: left;">
          
          <!-- Header (Brand Logo) -->
          <tr>
            <td style="padding: 34px 36px 20px 36px;">
              <a href="https://influencerdhundo.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://raw.githubusercontent.com/dip6esh/influencerdhundo/main/public/brand-logo.png" alt="Influencer Dhundo" width="200" height="46" style="display: block; width: 200px; height: 46px; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 36px 36px 36px;">
              
              <!-- Headline -->
              <h1 style="margin: 0 0 14px 0; font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                Welcome, ${escapeHtml(name)}!
              </h1>

              <!-- Context Paragraph -->
              <p style="margin: 0 0 26px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                Your creator account has been successfully created. You're just a few quick steps away from putting your profile in front of brands and businesses${locationText}.
              </p>

              <!-- Pure Black Action Button -->
              <div style="margin: 0 0 28px 0;">
                <a href="${registerUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 8px; letter-spacing: 0.04em; text-transform: uppercase;">
                  COMPLETE YOUR PROFILE
                </a>
              </div>

              <!-- Soft Reassurance / Pro Tip Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffaf5; border: 1px solid #fed7aa; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #9a3412; line-height: 1.55;">
                    💡 <strong>Pro Tip:</strong> Complete profiles with verified social handles and starting rates receive up to <strong>5x more brand inquiries</strong>. Finish your categories and pricing to activate your profile.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Subtle Divider Line -->
          <tr>
            <td height="1" style="background-color: #f3f2ef; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Redesigned Card Footer with Instagram Pill -->
          <tr>
            <td style="padding: 26px 36px; background-color: #faf9f6; text-align: center;">
              
              <!-- Clear Tagline -->
              <p style="margin: 0 auto 16px auto; font-size: 13px; line-height: 1.55; color: #52525b; max-width: 380px;">
                A platform where businesses find and connect with relevant influencers directly — <strong>No middlemen, No commissions.</strong>
              </p>

              <!-- Sleek Instagram Action Pill -->
              <div style="margin: 0 0 16px 0;">
                <a href="https://instagram.com/influencerdhundo" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 7px 16px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td valign="middle">
                        <img src="https://raw.githubusercontent.com/dip6esh/influencerdhundo/main/public/instagram-icon.png" width="16" height="16" alt="Instagram" style="display: block; width: 16px; height: 16px; border: 0;" />
                      </td>
                      <td valign="middle" style="padding-left: 8px; font-size: 12px; font-weight: 600; color: #374151;">
                        Follow @influencerdhundo
                      </td>
                    </tr>
                  </table>
                </a>
              </div>

              <!-- Small Subtle Copyright -->
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; 2026 Influencer Dhundo. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
        
        <!-- Outer Footer (Below the Card) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; margin-top: 24px; text-align: center;">
          <tr>
            <td style="font-size: 12px; line-height: 1.6; color: #ffffff; opacity: 0.95;">
              You received this email because an account was registered with this email on Influencer Dhundo.
              <div style="margin-top: 6px;">
                <a href="https://influencerdhundo.com/privacy" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 500; margin-right: 8px;">Privacy policy</a>
                &bull;
                <a href="https://influencerdhundo.com/terms" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 500; margin-left: 8px;">Terms of service</a>
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderProfileLiveHtml(name: string, baseUrl: string, profileSlug?: string): string {
  const profileUrl = profileSlug ? `${baseUrl}/creators/${profileSlug}` : `${baseUrl}/discover`;
  const dashboardUrl = `${baseUrl}/creator/dashboard`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Profile is Live!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #d96324; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #d96324; padding: 48px 16px 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <tr>
      <td align="center">
        
        <!-- Main White Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16); overflow: hidden; text-align: left;">
          
          <!-- Header (Brand Logo) -->
          <tr>
            <td style="padding: 34px 36px 20px 36px;">
              <a href="https://influencerdhundo.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://raw.githubusercontent.com/dip6esh/influencerdhundo/main/public/brand-logo.png" alt="Influencer Dhundo" width="200" height="46" style="display: block; width: 200px; height: 46px; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 36px 36px 36px;">
              
              <!-- Headline -->
              <h1 style="margin: 0 0 14px 0; font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                You're Live, ${escapeHtml(name)}! 🚀
              </h1>

              <!-- Context Paragraph -->
              <p style="margin: 0 0 26px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                Your creator profile has been published and is now <strong>actively visible in the public discovery directory</strong>. Brands and local businesses can now discover your work, check your engagement stats, and connect directly with you.
              </p>

              <!-- Pure Black Action Button -->
              <div style="margin: 0 0 28px 0;">
                <a href="${profileUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 8px; letter-spacing: 0.04em; text-transform: uppercase;">
                  VIEW YOUR LIVE PROFILE
                </a>
              </div>

              <!-- Soft Reassurance / Trial Activated Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffaf5; border: 1px solid #fed7aa; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #9a3412; line-height: 1.55;">
                    ✨ <strong>3-Day Free Trial Activated:</strong> Your profile has full featured visibility. You can manage inquiries, check profile visits, and update your starting rates anytime in your <a href="${dashboardUrl}" style="color: #9a3412; font-weight: bold; text-decoration: underline;">Creator Dashboard</a>.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Subtle Divider Line -->
          <tr>
            <td height="1" style="background-color: #f3f2ef; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Redesigned Card Footer with Instagram Pill -->
          <tr>
            <td style="padding: 26px 36px; background-color: #faf9f6; text-align: center;">
              
              <!-- Clear Tagline -->
              <p style="margin: 0 auto 16px auto; font-size: 13px; line-height: 1.55; color: #52525b; max-width: 380px;">
                A platform where businesses find and connect with relevant influencers directly — <strong>No middlemen, No commissions.</strong>
              </p>

              <!-- Sleek Instagram Action Pill -->
              <div style="margin: 0 0 16px 0;">
                <a href="https://instagram.com/influencerdhundo" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 7px 16px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td valign="middle">
                        <img src="https://raw.githubusercontent.com/dip6esh/influencerdhundo/main/public/instagram-icon.png" width="16" height="16" alt="Instagram" style="display: block; width: 16px; height: 16px; border: 0;" />
                      </td>
                      <td valign="middle" style="padding-left: 8px; font-size: 12px; font-weight: 600; color: #374151;">
                        Follow @influencerdhundo
                      </td>
                    </tr>
                  </table>
                </a>
              </div>

              <!-- Small Subtle Copyright -->
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; 2026 Influencer Dhundo. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
        
        <!-- Outer Footer (Below the Card) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; margin-top: 24px; text-align: center;">
          <tr>
            <td style="font-size: 12px; line-height: 1.6; color: #ffffff; opacity: 0.95;">
              You received this email because an account was registered with this email on Influencer Dhundo.
              <div style="margin-top: 6px;">
                <a href="https://influencerdhundo.com/privacy" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 500; margin-right: 8px;">Privacy policy</a>
                &bull;
                <a href="https://influencerdhundo.com/terms" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 500; margin-left: 8px;">Terms of service</a>
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderDraftReminderHtml(name: string, baseUrl: string): string {
  const registerUrl = `${baseUrl}/creator/register`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Profile is Still in Draft</title>
</head>
<body style="margin: 0; padding: 0; background-color: #d96324; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #d96324; padding: 48px 16px 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <tr>
      <td align="center">
        
        <!-- Main White Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16); overflow: hidden; text-align: left;">
          
          <!-- Header (Brand Logo) -->
          <tr>
            <td style="padding: 34px 36px 20px 36px;">
              <a href="https://influencerdhundo.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://raw.githubusercontent.com/dip6esh/influencerdhundo/main/public/brand-logo.png" alt="Influencer Dhundo" width="200" height="46" style="display: block; width: 200px; height: 46px; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 36px 36px 36px;">
              
              <!-- Headline -->
              <h1 style="margin: 0 0 14px 0; font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                Your Profile Is Still in Draft
              </h1>

              <!-- Context Paragraphs -->
              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                Hi ${escapeHtml(name)},
              </p>
              <p style="margin: 0 0 26px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                Just a quick reminder that your creator profile on Influencer Dhundo is currently saved as an incomplete draft.<br /><br />
                Whenever you're ready, click below to finish setting it up and publish your listing.
              </p>

              <!-- Pure Black Action Button -->
              <div style="margin: 0 0 28px 0;">
                <a href="${registerUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 8px; letter-spacing: 0.04em; text-transform: uppercase;">
                  FINISH PROFILE SETUP
                </a>
              </div>

              <!-- Soft Reassurance / Support Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffaf5; border: 1px solid #fed7aa; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #9a3412; line-height: 1.55;">
                    ℹ️ <strong>Need help or have questions?</strong> Reach out to our team anytime at <a href="mailto:support.influencerdhundo@gmail.com" style="color: #9a3412; font-weight: 700; text-decoration: underline;">support.influencerdhundo@gmail.com</a>.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Subtle Divider Line -->
          <tr>
            <td height="1" style="background-color: #f3f2ef; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Redesigned Card Footer with Instagram Pill -->
          <tr>
            <td style="padding: 26px 36px; background-color: #faf9f6; text-align: center;">
              
              <!-- Clear Tagline -->
              <p style="margin: 0 auto 16px auto; font-size: 13px; line-height: 1.55; color: #52525b; max-width: 380px;">
                A platform where businesses find and connect with relevant influencers directly — <strong>No middlemen, No commissions.</strong>
              </p>

              <!-- Sleek Instagram Action Pill -->
              <div style="margin: 0 0 16px 0;">
                <a href="https://instagram.com/influencerdhundo" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 7px 16px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td valign="middle">
                        <img src="https://raw.githubusercontent.com/dip6esh/influencerdhundo/main/public/instagram-icon.png" width="16" height="16" alt="Instagram" style="display: block; width: 16px; height: 16px; border: 0;" />
                      </td>
                      <td valign="middle" style="padding-left: 8px; font-size: 12px; font-weight: 600; color: #374151;">
                        Follow @influencerdhundo
                      </td>
                    </tr>
                  </table>
                </a>
              </div>

              <!-- Small Subtle Copyright -->
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; 2026 Influencer Dhundo. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
        
        <!-- Outer Footer (Below the Card) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; margin-top: 24px; text-align: center;">
          <tr>
            <td style="font-size: 12px; line-height: 1.6; color: #ffffff; opacity: 0.95;">
              You received this email because an account was registered with this email on Influencer Dhundo.
              <div style="margin-top: 6px;">
                <a href="https://influencerdhundo.com/privacy" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 500; margin-right: 8px;">Privacy policy</a>
                &bull;
                <a href="https://influencerdhundo.com/terms" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 500; margin-left: 8px;">Terms of service</a>
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderSubscriptionActivatedHtml(
  name: string,
  baseUrl: string,
  options: {
    planName?: string | undefined;
    expiresAt?: string | undefined;
    amountPaid?: number | undefined;
    discountCode?: string | undefined;
    discountAmount?: number | undefined;
    paymentId?: string | undefined;
    upgradeSource?: "paid" | "promo100" | "admin_extension" | undefined;
    extensionDays?: number | undefined;
  },
): string {
  const dashboardUrl = `${baseUrl}/creator/dashboard`;
  const isExtension = options.upgradeSource === "admin_extension";
  const isPromo100 =
    options.upgradeSource === "promo100" ||
    (options.amountPaid === 0 && Boolean(options.discountCode));

  let headline = `Payment Confirmed, ${escapeHtml(name)}! 🎉`;
  let subtitle = `Your Influencer Subscription is now active. Your profile is live in the discovery directory so businesses and brands across India can find you and connect with you directly.`;

  if (isExtension) {
    headline = `Your Subscription Has Been Extended, ${escapeHtml(name)}! ⏳`;
    subtitle = `The Influencer Dhundo team has added extra days to your subscription so your profile stays active and discoverable for brands without interruption.`;
  } else if (isPromo100) {
    headline = `Subscription Activated, ${escapeHtml(name)}! 🎟️`;
    subtitle = `Your promo code has been redeemed successfully. Your Influencer Subscription is now active and your profile is live in the directory.`;
  }

  const planLabel = isExtension ? "Extension Added" : "Subscription Plan";
  const planVal =
    options.planName ||
    (options.extensionDays ? `+${options.extensionDays} Days Added` : "Influencer Subscription");
  const expiresVal = options.expiresAt || "Active";

  let amountRowHtml = "";
  if (isExtension) {
    amountRowHtml = `
      <tr>
        <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Charge</td>
        <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #059669; border-bottom: 1px solid #f3f4f6;">
          ₹0 (Complimentary extension)
        </td>
      </tr>`;
  } else if (isPromo100) {
    const codeStr = options.discountCode
      ? `Code: ${escapeHtml(options.discountCode)} applied`
      : "100% OFF Code";
    amountRowHtml = `
      <tr>
        <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Amount Paid</td>
        <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #059669; border-bottom: 1px solid #f3f4f6;">
          ₹0 (100% OFF &bull; ${codeStr})
        </td>
      </tr>`;
  } else {
    amountRowHtml = `
      <tr>
        <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Amount Paid</td>
        <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #111827; border-bottom: 1px solid #f3f4f6;">
          ₹${options.amountPaid ?? 0} <span style="font-size: 11px; font-weight: normal; color: #6b7280;">(Paid via UPI / Card)</span>
        </td>
      </tr>`;
  }

  const discountRowHtml =
    !isPromo100 && !isExtension && options.discountCode && (options.discountAmount ?? 0) > 0
      ? `
      <tr>
        <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Discount Applied</td>
        <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #7c3aed; border-bottom: 1px solid #f3f4f6;">
          ${escapeHtml(options.discountCode)} (Saved ₹${options.discountAmount})
        </td>
      </tr>`
      : "";

  const paymentIdRowHtml = options.paymentId
    ? `
      <tr>
        <td style="padding: 10px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Payment ID</td>
        <td align="right" style="padding: 10px 0; font-size: 12px; font-family: monospace; color: #4b5563; border-bottom: 1px solid #f3f4f6;">
          ${escapeHtml(options.paymentId)}
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Influencer Subscription Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #d96324; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #d96324; padding: 48px 16px 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <tr>
      <td align="center">
        
        <!-- Main White Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16); overflow: hidden; text-align: left;">
          
          <!-- Header (Brand Logo) -->
          <tr>
            <td style="padding: 34px 36px 20px 36px;">
              <a href="https://influencerdhundo.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://raw.githubusercontent.com/dip6esh/influencerdhundo/main/public/brand-logo.png" alt="Influencer Dhundo" width="200" height="46" style="display: block; width: 200px; height: 46px; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 10px 36px 36px 36px;">
              
              <!-- Headline -->
              <h1 style="margin: 0 0 14px 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.025em; line-height: 1.25;">
                ${headline}
              </h1>

              <!-- Subtitle -->
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                ${subtitle}
              </p>

              <!-- Receipt / Membership Summary Table -->
              <div style="margin: 0 0 24px 0; background-color: #faf9f6; border: 1px solid #e5e5e5; border-radius: 12px; padding: 18px 20px;">
                <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">
                  Subscription Details
                </p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">${planLabel}</td>
                    <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #111827; border-bottom: 1px solid #f3f4f6;">${escapeHtml(planVal)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Valid Until</td>
                    <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #111827; border-bottom: 1px solid #f3f4f6;">${escapeHtml(expiresVal)}</td>
                  </tr>
                  ${amountRowHtml}
                  ${discountRowHtml}
                  ${paymentIdRowHtml}
                  <tr>
                    <td style="padding: 8px 0 0 0; font-size: 13px; color: #6b7280;">Profile Status</td>
                    <td align="right" style="padding: 8px 0 0 0; font-size: 13px; font-weight: 700; color: #059669;">
                      &bull; Active &amp; Discoverable
                    </td>
                  </tr>
                </table>
              </div>

              <!-- What's active / Benefits Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffaf5; border: 1px solid #fed7aa; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #9a3412;">
                      What's active for you:
                    </p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 3px 0; font-size: 13px; line-height: 1.5; color: #7c2d12;">
                          &bull; <strong>Directory Listing:</strong> Brands can search, filter, and view your profile, niche, and social links.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-size: 13px; line-height: 1.5; color: #7c2d12;">
                          &bull; <strong>Direct Brand Deals:</strong> Brands reach out directly to your WhatsApp, Phone, or Email with zero middlemen and zero commission fees.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-size: 13px; line-height: 1.5; color: #7c2d12;">
                          &bull; <strong>Influencer Referral Link:</strong> Share your unique invite link with other influencers to earn bonus subscription days.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Pure Black Action Button -->
              <div style="margin: 0;">
                <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 26px; border-radius: 8px; letter-spacing: 0.04em; text-transform: uppercase;">
                  GO TO INFLUENCER DASHBOARD
                </a>
              </div>

            </td>
          </tr>

          <!-- Subtle Divider Line -->
          <tr>
            <td height="1" style="background-color: #f3f2ef; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Footer with Tagline & Instagram Pill -->
          <tr>
            <td style="padding: 26px 36px; background-color: #faf9f6; text-align: center;">
              
              <!-- Clear Tagline -->
              <p style="margin: 0 auto 16px auto; font-size: 13px; line-height: 1.55; color: #52525b; max-width: 380px;">
                A platform where businesses find and connect with relevant influencers directly &mdash; <strong>No middlemen, No commissions.</strong>
              </p>

              <!-- Sleek Instagram Action Pill -->
              <div style="margin: 0 0 16px 0;">
                <a href="https://instagram.com/influencerdhundo" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 7px 16px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td valign="middle">
                        <img src="https://raw.githubusercontent.com/dip6esh/influencerdhundo/main/public/instagram-icon.png" width="16" height="16" alt="Instagram" style="display: block; width: 16px; height: 16px; border: 0;" />
                      </td>
                      <td valign="middle" style="padding-left: 8px; font-size: 12px; font-weight: 600; color: #374151;">
                        Follow @influencerdhundo
                      </td>
                    </tr>
                  </table>
                </a>
              </div>

              <!-- Small Subtle Copyright -->
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; 2026 Influencer Dhundo. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
        
        <!-- Outer Footer (Below the Card) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; margin-top: 24px; text-align: center;">
          <tr>
            <td style="font-size: 12px; line-height: 1.6; color: #ffffff; opacity: 0.95;">
              You received this email because you have an account on Influencer Dhundo.
              <div style="margin-top: 6px;">
                <a href="https://influencerdhundo.com/privacy" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 500; margin-right: 8px;">Privacy policy</a>
                &bull;
                <a href="https://influencerdhundo.com/terms" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 500; margin-left: 8px;">Terms of service</a>
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Server Function: Dispatches transactional creator onboarding emails.
 * Uses Resend API with graceful local simulation if API key is not yet set.
 */
export const sendCreatorEmailFn = createServerFn({ method: "POST" })
  .validator((data: CreatorEmailInput) => data)
  .handler(async ({ data }): Promise<EmailSendResult> => {
    try {
      const apiKey =
        ((import.meta as any)?.env?.["VITE_RESEND_API_KEY"] as string | undefined)?.trim() ||
        ((import.meta as any)?.env?.["RESEND_API_KEY"] as string | undefined)?.trim() ||
        process.env["VITE_RESEND_API_KEY"]?.trim() ||
        process.env["RESEND_API_KEY"]?.trim() ||
        (globalThis as any)?.VITE_RESEND_API_KEY ||
        (globalThis as any)?.RESEND_API_KEY ||
        "";
      const from =
        ((import.meta as any)?.env?.["EMAIL_FROM"] as string | undefined)?.trim() ||
        process.env["EMAIL_FROM"]?.trim() ||
        (globalThis as any)?.EMAIL_FROM ||
        "Influencer Dhundo <support@influencerdhundo.com>";
      const replyTo =
        ((import.meta as any)?.env?.["EMAIL_REPLY_TO"] as string | undefined)?.trim() ||
        process.env["EMAIL_REPLY_TO"]?.trim() ||
        (globalThis as any)?.EMAIL_REPLY_TO ||
        "support.influencerdhundo@gmail.com";
      const baseUrl = getBaseUrl(data.baseUrl);

      let subject = "";
      let html = "";

      if (data.type === "welcome_draft") {
        subject = `Welcome to Influencer Dhundo, ${data.name}! Complete your profile 🚀`;
        html = renderWelcomeDraftHtml(data.name, baseUrl, data.city);
      } else if (data.type === "profile_live") {
        subject = `🎉 Congratulations ${data.name}! Your profile is now LIVE on Influencer Dhundo`;
        html = renderProfileLiveHtml(data.name, baseUrl, data.profileSlug);
      } else if (data.type === "draft_reminder") {
        subject = `Quick reminder: Your Influencer Dhundo profile`;
        html = renderDraftReminderHtml(data.name, baseUrl);
      } else if (data.type === "subscription_activated") {
        if (data.upgradeSource === "admin_extension") {
          subject = `Good News! Your Influencer Subscription Has Been Extended ⏳`;
        } else if (data.upgradeSource === "promo100") {
          subject = `Your Influencer Subscription is Activated! 🎟️`;
        } else {
          subject = `Your Influencer Subscription is Active! Payment Receipt 🧾`;
        }
        html = renderSubscriptionActivatedHtml(data.name, baseUrl, {
          planName: data.planName,
          expiresAt: data.expiresAt,
          amountPaid: data.amountPaid,
          discountCode: data.discountCode,
          discountAmount: data.discountAmount,
          paymentId: data.paymentId,
          upgradeSource: data.upgradeSource,
          extensionDays: data.extensionDays,
        });
      } else {
        return { success: false, error: "Invalid email type" };
      }

      // If no Resend API key is configured yet, simulate safely in dev without failing
      if (!apiKey || apiKey === "re_placeholder" || apiKey.length < 10) {
        console.warn(
          `[Email Service Warning] No valid Resend API key detected. Email '${data.type}' to ${data.to} was simulated, not sent over network. Check RESEND_API_KEY/VITE_RESEND_API_KEY in environment settings.`,
        );
        return {
          success: false,
          simulated: true,
          error: "Resend API key missing or invalid in environment settings.",
          messageId: `sim_${Date.now()}`,
        };
      }

      // Direct Resend API call (zero dependency issues on edge or Node runtime)
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [data.to],
          reply_to: replyTo,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[Email Service] Resend API error (${res.status}):`, errorText);
        return { success: false, error: errorText };
      }

      const resData = (await res.json()) as { id?: string };
      console.log(`[Email Service] Sent '${data.type}' email to ${data.to} (id: ${resData.id})`);
      return { success: true, messageId: resData.id };
    } catch (err) {
      console.error("[Email Service] Exception sending email:", err);
      return { success: false, error: String(err) };
    }
  });
