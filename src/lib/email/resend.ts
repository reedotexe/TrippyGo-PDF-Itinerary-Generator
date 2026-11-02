import { Resend } from "resend";

const DEFAULT_FROM = process.env.EMAIL_FROM || "TrippyGo Operations <operations@trippygo.com>";

/**
 * Low-level transactional email dispatcher.
 * In local development (or when RESEND_API_KEY is not configured),
 * it outputs the message and link to the terminal so developers can test seamlessly.
 */
export async function sendEmail({
  to,
  subject,
  html,
  linkForDev,
}: {
  to: string;
  subject: string;
  html: string;
  linkForDev?: string;
}): Promise<{ success: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("\n" + "=".repeat(72));
    console.log("📨 [LOCAL DEV EMAIL DISPATCH] (No RESEND_API_KEY configured)");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    if (linkForDev) {
      console.log(`Action Link:`);
      console.log(`👉 ${linkForDev}`);
    }
    console.log("=".repeat(72) + "\n");
    return { success: true, id: "dev-simulated-email-id" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("[Email Dispatch Error]", error);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email Dispatch Exception]", err);
    return { success: false };
  }
}

/**
 * Dispatch an invitation email to a newly added team member.
 */
export async function sendInvitationEmail({
  email,
  name,
  inviteUrl,
}: {
  email: string;
  name: string;
  inviteUrl: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf7; margin: 0; padding: 40px 20px; color: #091c3e; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px 32px; box-shadow: 0 4px 12px rgba(9, 28, 62, 0.04); }
          .logo { display: inline-block; width: 36px; height: 36px; background: #091c3e; color: #ffffff; border-radius: 8px; text-align: center; line-height: 36px; font-weight: 900; font-family: Georgia, serif; font-size: 20px; margin-bottom: 24px; }
          h1 { font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #091c3e; margin: 0 0 16px; letter-spacing: -0.5px; }
          p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
          .button-wrap { margin: 32px 0; text-align: left; }
          .btn { background-color: #091c3e; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; }
          .note { font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 32px; }
          .break-link { word-break: break-all; color: #091c3e; text-decoration: underline; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">T</div>
          <h1>Welcome to TrippyGo Operations</h1>
          <p>Hello <strong>${name}</strong>,</p>
          <p>An administrator has invited you to join the TrippyGo B2B Itinerary and Proposal Operations platform.</p>
          <p>To activate your account and set your secure password, please click the button below:</p>
          <div class="button-wrap">
            <a href="${inviteUrl}" class="btn">Set Up Your Account</a>
          </div>
          <p class="note">This single-use invitation link expires in <strong>48 hours</strong>. If you did not expect this invitation, you can safely ignore this email.</p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">Direct link: <a href="${inviteUrl}" class="break-link">${inviteUrl}</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Invitation to TrippyGo Operations Workbench",
    html,
    linkForDev: inviteUrl,
  });
}

/**
 * Dispatch a password reset email.
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf7; margin: 0; padding: 40px 20px; color: #091c3e; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px 32px; box-shadow: 0 4px 12px rgba(9, 28, 62, 0.04); }
          .logo { display: inline-block; width: 36px; height: 36px; background: #091c3e; color: #ffffff; border-radius: 8px; text-align: center; line-height: 36px; font-weight: 900; font-family: Georgia, serif; font-size: 20px; margin-bottom: 24px; }
          h1 { font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #091c3e; margin: 0 0 16px; letter-spacing: -0.5px; }
          p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
          .button-wrap { margin: 32px 0; text-align: left; }
          .btn { background-color: #c92229; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; }
          .note { font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 32px; }
          .break-link { word-break: break-all; color: #c92229; text-decoration: underline; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">T</div>
          <h1>Password Reset Request</h1>
          <p>Hello <strong>${name}</strong>,</p>
          <p>A password reset was requested for your TrippyGo Operations account. Click the button below to choose a new password:</p>
          <div class="button-wrap">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>
          <p class="note">This single-use reset link expires in <strong>1 hour</strong>. For security, all other active sessions will be terminated upon reset. If you did not make this request, please contact an administrator immediately.</p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">Direct link: <a href="${resetUrl}" class="break-link">${resetUrl}</a></p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your TrippyGo Password",
    html,
    linkForDev: resetUrl,
  });
}
