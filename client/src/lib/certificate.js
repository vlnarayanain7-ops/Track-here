// src/lib/certificate.js: drawn on the device; always light so it looks the same in dark mode
const C = { bg: '#FFFFFF', ink: '#141815', muted: '#5F6862', line: '#E5E8E1', accent: '#216E39' }; // the only hex values allowed outside tokens.css

export async function certificateBlob({ name, serial, issuedAt, hours = 15, origin = (typeof location !== 'undefined' ? location.origin : 'http://localhost:5173') }) {
  const c = Object.assign(document.createElement('canvas'), { width: 1600, height: 1130 });
  const g = c.getContext('2d');
  g.fillStyle = C.bg;
  g.fillRect(0, 0, 1600, 1130);
  g.strokeStyle = C.accent;
  g.lineWidth = 6;
  g.strokeRect(50, 50, 1500, 1030);
  g.strokeStyle = C.line;
  g.lineWidth = 2;
  g.strokeRect(70, 70, 1460, 990);
  g.textAlign = 'center';
  g.fillStyle = C.muted;
  g.font = '600 34px Inter, sans-serif';
  g.fillText('TRACK HERE', 800, 190);
  g.fillStyle = C.ink;
  g.font = '700 84px Space Grotesk, sans-serif';
  g.fillText('Certificate of Consistency', 800, 330);
  g.fillStyle = C.muted;
  g.font = '500 38px Inter, sans-serif';
  g.fillText('This certifies that', 800, 440);
  g.fillStyle = C.accent;
  g.font = '700 88px Space Grotesk, sans-serif';
  g.fillText(name || 'A Track Here learner', 800, 560);
  g.fillStyle = C.ink;
  g.font = '500 44px Inter, sans-serif';
  g.fillText('completed a 30-day focus streak', 800, 660);
  g.fillStyle = C.muted;
  g.font = '500 34px Inter, sans-serif';
  g.fillText(`with ${hours} hours of timer-verified study`, 800, 720);
  g.font = '500 30px Inter, sans-serif';
  g.fillText(`Issued ${new Date(issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 800, 870);
  g.fillText(`Serial ${serial}  ·  Verify at ${origin.replace(/^https?:\/\//, '')}/verify/${serial}`, 800, 920);
  g.font = '500 24px Inter, sans-serif';
  g.fillText('Not academic credit or a professional accreditation.', 800, 1010);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

export async function shareBlob(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file], title });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default {
  certificateBlob,
  shareBlob,
};
