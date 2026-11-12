import env from '../config/env.js';

/**
 * Service to deliver transactional emails (Password Reset, Email Verification).
 * Supports Resend, SendGrid, or development local logging.
 * NEVER logs tokens or sensitive data to production logs.
 */

const FROM_EMAIL = process.env.EMAIL_FROM || 'Track Here <noreply@trackhere.dev>';

/**
 * Sends a password reset email to the user.
 * @param {{ to: string, resetToken: string, userName?: string }} params
 */
export const sendPasswordResetEmail = async ({ to, resetToken, userName = 'Student' }) => {
  const clientUrl = env.CLIENT_URL.replace(/\/$/, '');
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  const subject = 'Reset your Track Here password';
  const textBody = `Hello ${userName},\n\nWe received a request to reset your password for your Track Here account.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not make this request, you can safely ignore this email.\n\n— The Track Here Team`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0b; color: #f5f5f5; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #171717; border: 1px solid #292929; border-radius: 12px; padding: 32px; }
          .header { font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #f5f5f5; }
          .text { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
          .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-bottom: 24px; }
          .footer { font-size: 12px; color: #71717a; border-top: 1px solid #292929; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Track Here Password Reset</div>
          <p class="text">Hello ${userName},</p>
          <p class="text">We received a request to reset the password for your account (<strong>${to}</strong>). Click the button below to choose a new password:</p>
          <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
          <p class="text">This link is valid for <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.</p>
          <div class="footer">
            Track Here &mdash; Personal Productivity &amp; Study Operating System
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API responded with ${response.status}: ${errorText}`);
      }
      return { success: true, provider: 'resend' };
    } catch (err) {
      console.error('Failed to send email via Resend:', err.message);
      if (env.NODE_ENV === 'production') throw err;
    }
  }

  // 2. SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.SENDGRID_FROM || 'noreply@trackhere.dev', name: 'Track Here' },
          subject,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API responded with ${response.status}: ${errorText}`);
      }
      return { success: true, provider: 'sendgrid' };
    } catch (err) {
      console.error('Failed to send email via SendGrid:', err.message);
      if (env.NODE_ENV === 'production') throw err;
    }
  }

  // Fallback in development: log link for local testing
  if (env.NODE_ENV === 'development') {
    console.log(`\n📧 [DEV ONLY] Password reset email simulated for: ${to}`);
    console.log(`   Reset URL: ${resetUrl}\n`);
    return { success: true, provider: 'dev-console' };
  }

  // In production with no provider configured: Log error WITHOUT revealing reset token
  console.error('CRITICAL: No transactional email provider configured in production (Set RESEND_API_KEY or SENDGRID_API_KEY). Email not delivered.');
  return { success: false, error: 'Email service unavailable in production without provider credentials' };
};

