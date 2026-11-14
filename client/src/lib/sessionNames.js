// src/lib/sessionNames.js
export function defaultSessionName(date = new Date(), subjectName) {
  const day = date.toLocaleDateString('en', { weekday: 'short' });
  const time = date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${subjectName || 'Focus'} · ${day} ${time}`; // "Focus · Sat 2:05 pm"
}
