import nodemailer from 'nodemailer';

const transport = process.env.MAIL_HOST
  ? nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: Number(process.env.MAIL_PORT) === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })
  : null;

export async function sendMail(m) {
  if (!transport) {
    console.log('[mail fallback - not configured]', m.to, m.text);
    return; // safe fallback when SMTP is not configured yet
  }
  return transport.sendMail({ from: process.env.MAIL_FROM || 'Track Here <no-reply@yourdomain.com>', ...m });
}

