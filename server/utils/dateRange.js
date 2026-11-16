import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Universal date range helper that respects the user's local timezone.
 * Resolves 'today', specific ISO strings, or Date objects into the exact
 * UTC start and end bounds of that local day.
 *
 * @param {string|Date} dateStr - 'today', 'YYYY-MM-DD', or Date
 * @param {string} timezone - e.g. 'Asia/Kolkata', 'America/New_York'
 * @returns {{ start: Date, end: Date, targetDate: string }}
 */
export function parseDateRange(dateStr, timezone = 'Asia/Kolkata') {
  let target = dateStr;
  const tz = timezone || 'Asia/Kolkata';

  if (!target || target === 'today') {
    const nowInTz = toZonedTime(new Date(), tz);
    target = format(nowInTz, 'yyyy-MM-dd');
  } else if (target instanceof Date) {
    const dInTz = toZonedTime(target, tz);
    target = format(dInTz, 'yyyy-MM-dd');
  } else if (typeof target === 'string' && target.includes('T')) {
    const dInTz = toZonedTime(new Date(target), tz);
    target = format(dInTz, 'yyyy-MM-dd');
  }

  // Exact local midnight start and end of that day converted to UTC Date
  const start = fromZonedTime(new Date(`${target}T00:00:00.000`), tz);
  const end = fromZonedTime(new Date(`${target}T23:59:59.999`), tz);

  return { start, end, targetDate: target };
}

/**
 * Get end of today in user's timezone converted to UTC Date
 */
export function getEndOfToday(timezone = 'Asia/Kolkata') {
  const { end } = parseDateRange('today', timezone);
  return end;
}

/**
 * Get today's YYYY-MM-DD in user's timezone
 */
export function getTodayDateString(timezone = 'Asia/Kolkata') {
  const { targetDate } = parseDateRange('today', timezone);
  return targetDate;
}

export default {
  parseDateRange,
  getEndOfToday,
  getTodayDateString,
};
