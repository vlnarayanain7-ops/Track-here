/**
 * Local Date Helper for Track Here
 * Phase 4 requirement:
 * "Dates: never use toISOString() for a date the user sees or picks. Use the local-date helper."
 * This helper avoids timezone drift bugs where UTC shifts dates backward or forward.
 */

/**
 * Convert a Date object (or timestamp) to local YYYY-MM-DD string.
 * @param {Date | string | number} [date=new Date()]
 * @returns {string} e.g. "2026-11-12"
 */
export function toLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a local midnight Date object (not UTC).
 * @param {string} dateString
 * @returns {Date}
 */
export function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;

  const clean = String(dateString).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  return new Date(dateString);
}

/**
 * Format a date for human-readable display using local time.
 * @param {Date | string} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatLocalDateDisplay(
  date,
  options = { month: 'short', day: 'numeric', year: 'numeric' }
) {
  const d = date instanceof Date ? date : parseLocalDate(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Format relative time (e.g. "Today", "Yesterday", "In 3 days").
 * @param {Date | string} date
 * @returns {string}
 */
export function formatRelativeLocalDate(date) {
  const d = date instanceof Date ? date : parseLocalDate(date);
  if (isNaN(d.getTime())) return '';

  const todayStr = toLocalDateString(new Date());
  const targetStr = toLocalDateString(d);

  if (targetStr === todayStr) return 'Today';

  const today = parseLocalDate(todayStr);
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatLocalDateDisplay(d);
}

