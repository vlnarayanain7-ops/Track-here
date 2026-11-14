// src/lib/format.js: Reference formatting helpers
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
export const fmtDuration = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
export const localISODate = (d = new Date()) => new Intl.DateTimeFormat('en-CA').format(d); // YYYY-MM-DD in the user's own timezone
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
