import { calculateNextInterval } from '../../../server/lib/revision.mjs';
export function reviewDate(interval, feedback) {
  const date = new Date();
  date.setDate(date.getDate() + calculateNextInterval(interval, feedback));
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
