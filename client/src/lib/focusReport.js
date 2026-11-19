export function summarizePeriod(type, today, history) {
  const first = new Date(today + 'T12:00:00Z');
  if (type === 'weekly') first.setUTCDate(first.getUTCDate() - (first.getUTCDay() + 6) % 7);
  if (type === 'monthly') first.setUTCDate(1);
  const start = first.toISOString().slice(0, 10);
  const days = history.filter(day => day.date >= start && day.date <= today);
  const subjects = new Map();
  for (const day of days) {
    for (const [name, minutes] of Object.entries(day.bySubject || {})) {
      subjects.set(name, (subjects.get(name) || 0) + minutes);
    }
  }
  return { start, end: today, days: days.map(d => d.minutes),
    minutes: days.reduce((n, day) => n + day.minutes, 0),
    sessions: days.reduce((n, day) => n + day.sessions, 0),
    topSubject: [...subjects].sort((a,b) => b[1] - a[1])[0]?.[0] || null };
}
