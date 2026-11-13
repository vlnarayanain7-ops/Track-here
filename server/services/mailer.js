export async function sendMail({ to, subject, text }) {
  if (!process.env.BREVO_API_KEY) {
    if (process.env.NODE_ENV === 'production') throw new Error('mail_not_configured');
    console.log('[dev mail]', to, text);
    return; // development only, never in an API response
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Track Here', email: process.env.MAIL_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`mail_failed_${res.status}: ${errorText}`);
  }
}
