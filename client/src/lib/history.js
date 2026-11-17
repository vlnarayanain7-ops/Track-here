// src/lib/history.js
const key = (d) => new Intl.DateTimeFormat('en-CA').format(d);

const clock = (d) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

export const timeRange = (s) => {
  const rawDate = s.startedAt || s.date || s.startTime;
  const a = rawDate ? new Date(rawDate) : new Date();
  const durSec = s.durationSec ?? (s.duration ? s.duration * 60 : 0);
  const b = new Date(a.getTime() + durSec * 1000);
  return `${clock(a)} – ${clock(b)}`;
};

export function groupByDay(sessions, now = new Date()) {
  const today = key(now);
  const yesterday = key(new Date(now.getTime() - 864e5));
  const groups = new Map();

  for (const s of sessions) {
    const rawDate = s.startedAt || s.date || s.startTime;
    const d = rawDate ? new Date(rawDate) : new Date();
    const k = key(d);
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
      minutes: items.reduce((acc, s) => {
        const sec = s.durationSec ?? (s.duration ? s.duration * 60 : 0);
        return acc + Math.round(sec / 60);
      }, 0),
      items: items.sort((a, b) => {
        const ta = new Date(a.startedAt || a.date || a.startTime || 0).getTime();
        const tb = new Date(b.startedAt || b.date || b.startTime || 0).getTime();
        return tb - ta;
      }),
    }));
}
