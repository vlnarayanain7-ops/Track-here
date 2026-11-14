// server/utils/sessionName.js: Unique automatic session naming
export function defaultSessionName(date = new Date(), tz = 'Asia/Kolkata', subjectName) {
  const d = new Date(date);
  try {
    const day = d.toLocaleDateString('en', { weekday: 'short', timeZone: tz });
    const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', timeZone: tz }).toLowerCase();
    return `${subjectName || 'Focus'} · ${day} ${time}`;
  } catch {
    const day = d.toLocaleDateString('en', { weekday: 'short' });
    const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    return `${subjectName || 'Focus'} · ${day} ${time}`;
  }
}
