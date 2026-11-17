// src/lib/history.js
import { sessionMinutes, sessionSeconds } from './sessions.js';

export const dayKey = (d) => new Intl.DateTimeFormat('en-CA').format(new Date(d)); // the user's LOCAL date
export const level = (m) => (m <= 0 ? 0 : m < 25 ? 1 : m < 60 ? 2 : m < 120 ? 3 : m < 240 ? 4 : 5); // --heat-N

const clock = (d) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

export const timeRange = (s) => {
  const rawDate = s.startedAt || s.date || s.startTime || new Date();
  const a = new Date(rawDate);
  const sec = sessionSeconds(s) ?? 0;
  const b = new Date(a.getTime() + sec * 1000);
  return `${clock(a)} – ${clock(b)}`;
};

export function groupByDay(sessions, now = new Date()) {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 864e5));
  const groups = new Map();

  for (const s of sessions) {
    const rawDate = s.startedAt || s.date || s.startTime || new Date();
    const k = dayKey(rawDate);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }

  return [...groups]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([k, items]) => ({
      key: k,
      label:
        k === today
          ? 'Today'
          : k === yesterday
          ? 'Yesterday'
          : new Date(`${k}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
      minutes: items.reduce((a, s) => a + sessionMinutes(s), 0),
      items: [...items].sort((a, b) => {
        const ta = new Date(a.startedAt || a.date || a.startTime || 0).getTime();
        const tb = new Date(b.startedAt || b.date || b.startTime || 0).getTime();
        return tb - ta;
      }),
    }));
}
