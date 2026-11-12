import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(e) {
      delete e.user;
      delete e.request?.cookies;
      delete e.request?.data;
      return e;
    },
  });
}
