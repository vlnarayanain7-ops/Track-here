

export function mailConfigured() {
  return Boolean(process.env.BREVO_API_KEY?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.MAIL_FROM_EMAIL?.trim() || ''));
}

export async function sendMail({ to, subject, text }) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim().replace(/[\r\n\t]/g, '');
  const fromEmail = (process.env.MAIL_FROM_EMAIL || '').trim().replace(/[\r\n\t]/g, '');

  if (!mailConfigured()) {
    if (process.env.NODE_ENV === 'production') throw new Error('mail_not_configured');
    console.log('[dev mail]', to, text);
    return; // development only, never in an API response
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Track Here', email: fromEmail },
      to: [{ email: to.trim() }],
      subject,
      textContent: text,
    }),
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) {
    // Provider response bodies can contain recipient details. Log only the status.
    throw new Error(`mail_failed_${res.status}`);
  }
}
