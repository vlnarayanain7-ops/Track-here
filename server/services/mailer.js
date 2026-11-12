import nodemailer from 'nodemailer';

const transport = process.env.MAIL_HOST
  ? nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })
  : null;

export async function sendMail(m) {
  if (!transport) {
    if (process.env.NODE_ENV === 'production') throw new Error('Mail is not configured');
    console.log('[dev mail]', m.to, m.text);
    return; // development only, never in an API response
  }
  return transport.sendMail({ from: process.env.MAIL_FROM || 'Track Here <no-reply@yourdomain.com>', ...m });
}

