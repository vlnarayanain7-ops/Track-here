// src/lib/format.js: Reference formatting helpers
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
export const fmtDuration = (m) => {
  if (!Number.isFinite(m)) return '–';
  const h = Math.floor(m / 60), r = Math.round(m % 60);
  return h ? `${h}h ${String(r).padStart(2, '0')}m` : `${r}m`;
};
export const localISODate = (d = new Date()) => new Intl.DateTimeFormat('en-CA').format(d); // YYYY-MM-DD in the user's own timezone
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
