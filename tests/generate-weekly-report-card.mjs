import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const pngBase64 = await page.evaluate(async () => {
    const COLORS = {
      bg: '#141815',
      card: '#1B221D',
      border: '#29352C',
      accent: '#2EA043',
      text: '#F0F6FC',
      muted: '#8B949E',
    };

    const canvas = Object.assign(document.createElement('canvas'), { width: 1200, height: 630 });
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1120, 550);

    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(40, 40, 1120, 6);

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.accent;
    ctx.font = '700 24px sans-serif';
    ctx.fillText('TRACK HERE', 80, 105);

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.muted;
    ctx.font = '500 18px sans-serif';
    ctx.fillText('STUDY OPERATING SYSTEM', 1120, 105);

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 52px sans-serif';
    ctx.fillText('Weekly Focus Report', 80, 185);

    ctx.fillStyle = COLORS.muted;
    ctx.font = '500 24px sans-serif';
    ctx.fillText('Week of Nov 10 – Nov 16, 2026', 80, 225);

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 24px sans-serif';
    ctx.fillText('Narayana', 1120, 185);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '400 18px sans-serif';
    ctx.fillText('Learner', 1120, 215);
    ctx.textAlign = 'left';

    const metrics = [
      { label: 'WEEKLY FOCUS TIME', value: '7h 45m' },
      { label: 'SESSIONS COMPLETED', value: '14 sessions' },
      { label: 'ACTIVE STREAK', value: '7 days' },
      { label: 'TOP SUBJECT', value: 'Algorithms' },
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

      ctx.fillStyle = COLORS.card;
      ctx.fillRect(x, y, boxW, boxH);
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, boxW, boxH);

      ctx.fillStyle = COLORS.muted;
      ctx.font = '600 15px sans-serif';
      ctx.fillText(m.label, x + 24, y + 40);

      ctx.fillStyle = COLORS.text;
      ctx.font = '700 34px sans-serif';
      ctx.fillText(m.value, x + 24, y + 84);
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.muted;
    ctx.font = '500 16px sans-serif';
    ctx.fillText('Generated on device  ·  trackhere.app', 80, 550);

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.accent;
    ctx.font = '600 16px sans-serif';
    ctx.fillText('Consistency over intensity', 1120, 550);

    return canvas.toDataURL('image/png').split(',')[1];
  });

  const buffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync('screenshots/prompt14/step-14-8-report-card-weekly.png', buffer);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'step-14-8-report-card-weekly.png'), buffer);
  console.log('Saved weekly report card artifact: step-14-8-report-card-weekly.png');

  await browser.close();
}

run().catch(console.error);
