// client/src/lib/reportCard.js
// Draws shareable report cards entirely on device canvas
// Contains NO email, NO task titles, NO notes.
// Shows user name ONLY if explicitly enabled.

const COLORS = {
  bg: '#141815',
  card: '#1B221D',
  border: '#29352C',
  accent: '#2EA043',
  text: '#F0F6FC',
  muted: '#8B949E',
  softAccent: '#1F3F2A',
};

function formatMinutes(min) {
  if (!min || min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export async function drawReportCard({
  type = 'daily', // 'daily' | 'weekly'
  dateStr = new Date().toISOString().split('T')[0],
  minutes = 0,
  sessions = 0,
  streak = 0,
  topSubject = null,
  showName = false,
  displayName = '',
}) {
  const canvas = Object.assign(document.createElement('canvas'), { width: 1200, height: 630 });
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, 1200, 630);

  // Card outline container
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 1120, 550);

  // Decorative top green bar
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(40, 40, 1120, 6);

  // Header: Brand & Tag
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.accent;
  ctx.font = '700 24px "Space Grotesk", sans-serif';
  ctx.fillText('TRACK HERE', 80, 105);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.muted;
  ctx.font = '500 18px Inter, sans-serif';
  ctx.fillText('STUDY OPERATING SYSTEM', 1120, 105);

  // Report Title
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 52px "Space Grotesk", sans-serif';
  const title = type === 'weekly' ? 'Weekly Focus Report' : 'Daily Focus Report';
  ctx.fillText(title, 80, 185);

  // Date / Subtitle
  ctx.fillStyle = COLORS.muted;
  ctx.font = '500 24px Inter, sans-serif';
  let dateLabel = dateStr;
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dateLabel = dt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {}
  ctx.fillText(type === 'weekly' ? `Week of ${dateStr}` : dateLabel, 80, 225);

  // Optional Name (off by default)
  if (showName && displayName) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillText(displayName, 1120, 185);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '400 18px Inter, sans-serif';
    ctx.fillText('Learner', 1120, 215);
    ctx.textAlign = 'left';
  }

  // 4 Metric cards in a 2x2 grid
  const metrics = [
    { label: 'FOCUS TIME', value: formatMinutes(minutes) },
    { label: 'SESSIONS', value: `${sessions} completed` },
    { label: 'CURRENT STREAK', value: `${streak} ${streak === 1 ? 'day' : 'days'}` },
    { label: 'TOP FOCUS SUBJECT', value: topSubject || 'General' },
  ];

  const gridStartX = 80;
  const gridStartY = 270;
  const boxW = 500;
  const boxH = 110;
  const gapX = 40;
  const gapY = 25;

  metrics.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = gridStartX + col * (boxW + gapX);
    const y = gridStartY + row * (boxH + gapY);

    // Box background
    ctx.fillStyle = COLORS.card;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, boxW, boxH);

    // Metric label
    ctx.fillStyle = COLORS.muted;
    ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText(m.label, x + 24, y + 40);

    // Metric value
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 34px "Space Grotesk", sans-serif';
    ctx.fillText(m.value, x + 24, y + 84);
  });

  // Footer mark
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.muted;
  ctx.font = '500 16px Inter, sans-serif';
  ctx.fillText('Generated on device  ·  trackhere.app', 80, 550);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.accent;
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText('Consistency over intensity', 1120, 550);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export async function shareReportCard(blob, filename, title = 'Track Here Focus Report') {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('Share rejected:', e);
    }
  }

  // Fallback to direct download
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default {
  drawReportCard,
  shareReportCard,
};
