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
  period = null,
}) {
  const canvas = Object.assign(document.createElement('canvas'), { width: 1200, height: 630 });
  const ctx = canvas.getContext('2d');
  if (type === 'weekly' || type === 'monthly') {
    const label = value => new Date(value + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    const write = (value, x, y, size, color, weight = 500, maxWidth = 1000) => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px Inter, sans-serif`;
      ctx.fillText(String(value), x, y, maxWidth);
    };
    ctx.fillStyle = '#f6f7ee';
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = '#173d30';
    ctx.fillRect(0, 0, 1200, 292);
    write('TRACK HERE   /   STUDY REPORT', 60, 58, 20, '#bbddbc', 700);
    write(type === 'weekly' ? 'Weekly focus' : 'Monthly focus', 60, 137, 64, '#ffffff', 700);
    write(period ? label(period.start) + ' – ' + label(period.end) : label(dateStr), 62, 188, 25, '#dbeddf');
    if (showName && displayName) write(displayName, 62, 242, 23, '#dbeddf', 500, 500);
    write('TOTAL FOCUS TIME', 755, 104, 19, '#bbddbc', 700);
    write(formatMinutes(minutes), 750, 191, 66, '#ffffff', 700, 390);
    const metrics = [['SESSIONS', sessions], ['CURRENT STREAK', streak + (streak === 1 ? ' day' : ' days')], ['TOP SUBJECT', topSubject || '—']];
    metrics.forEach(([name, value], i) => {
      const x = 60 + i * 365;
      write(name, x, 356, 18, '#476151', 700);
      write(value, x, 414, 42, '#193c2e', 700, 340);
    });
    if (period?.days?.length) {
      write('Daily focus', 60, 482, 21, '#193c2e', 700);
      write(period.days.filter(n => n >= 25).length + ' streak days', 903, 482, 20, '#476151');
      const stride = 1080 / period.days.length;
      const peak = Math.max(25, ...period.days);
      period.days.forEach((n, i) => {
        const h = n > 0 ? Math.max(1, n / peak * 80) : 0;
        ctx.fillStyle = n >= 25 ? '#26784b' : '#aebcaf';
        ctx.fillRect(60 + i * stride, 588 - h, stride * .78, h);
        if (type === 'weekly' || i === 0 || (i + 1) % 7 === 0) {
          const day = new Date(period.start + 'T12:00:00Z');
          day.setUTCDate(day.getUTCDate() + i);
          const options = type === 'weekly' ? { weekday: 'short' } : { day: 'numeric' };
          write(day.toLocaleDateString(undefined, { ...options, timeZone: 'UTC' }), 60 + i * stride, 613, 17, '#476151');
        }
      });
    }
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

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

export async function shareReportCard(blob, filename, title = 'Track Here Focus Report', text) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, ...(text ? { text } : {}) });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.warn('Share rejected:', e);
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
