import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Run the certificate drawing in browser context
  const pngBase64 = await page.evaluate(async () => {
    const C = { bg: '#FFFFFF', ink: '#141815', muted: '#5F6862', line: '#E5E8E1', accent: '#216E39' };
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
    g.font = '600 34px sans-serif';
    g.fillText('TRACK HERE', 800, 190);
    g.fillStyle = C.ink;
    g.font = '700 84px sans-serif';
    g.fillText('Certificate of Consistency', 800, 330);
    g.fillStyle = C.muted;
    g.font = '500 38px sans-serif';
    g.fillText('This certifies that', 800, 440);
    g.fillStyle = C.accent;
    g.font = '700 88px sans-serif';
    g.fillText('Narayana', 800, 560);
    g.fillStyle = C.ink;
    g.font = '500 44px sans-serif';
    g.fillText('completed a 30-day focus streak', 800, 660);
    g.fillStyle = C.muted;
    g.font = '500 34px sans-serif';
    g.fillText('with 18 hours of timer-verified study', 800, 720);
    g.font = '500 30px sans-serif';
    g.fillText('Issued November 16, 2026', 800, 870);
    g.fillText('Serial TH30-ABC1234567  ·  Verify at trackhere.app/verify/TH30-ABC1234567', 800, 920);
    g.font = '500 24px sans-serif';
    g.fillText('Not academic credit or a professional accreditation.', 800, 1010);
    return c.toDataURL('image/png').split(',')[1];
  });

  const buffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync('screenshots/prompt14/step-14-8-certificate-image.png', buffer);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'step-14-8-certificate-image.png'), buffer);
  console.log('Saved certificate image artifact: step-14-8-certificate-image.png');

  await browser.close();
}

run().catch(console.error);
