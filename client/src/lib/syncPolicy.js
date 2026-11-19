export function syncDisposition(status) {
  if (status === 401 || status === 403) return 'auth';
  if (!status || status === 408 || status === 429 || status >= 500) return 'retry';
  return 'rejected';
}
export function belongsToAccount(item, ownerId) {
  return Boolean(ownerId && item.ownerId && item.ownerId === ownerId);
}
export function retryDelay(attempts, retryAfter) {
  const seconds = Number(retryAfter);
  if (retryAfter && Number.isFinite(seconds)) return Math.max(1000, seconds * 1000);
  const date = retryAfter && Date.parse(retryAfter);
  if (date) return Math.max(1000, date - Date.now());
  return Math.min(300000, 1000 * 2 ** Math.min(attempts, 8));
}
