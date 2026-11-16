import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('th-theme', 'dark');
    localStorage.setItem('th-token', 'mock-token');
  });

  const mockUser = {
    _id: 'u-timer-clean',
    name: 'Narayana',
    email: 'vlnarayana.in7@gmail.com',
    ageBand: '18_plus',
    termsVersion: '2026-11-20',
    onboardingCompleted: true,
    timezone: 'Asia/Kolkata',
    subjects: [{ name: 'Engineering' }],
  };

  await page.route((url) => {
    try {
      const u = new URL(url);
      return u.pathname.startsWith('/api/');
    } catch {
      return false;
    }
  }, async (route) => {
    const url = route.request().url();
    if (url.includes('/api/auth/csrf')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { csrfToken: 'csrf-1' } }) });
    }
    if (url.includes('/api/auth/me') || url.includes('/api/users/profile') || url.includes('/api/users/me')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { user: mockUser } }) });
    }
    if (url.includes('/api/study-sessions/timer/active')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { session: null } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });

  await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.time b');
  await page.waitForTimeout(500);

  const shotPath = path.join(ARTIFACT_DIR, 'step-14-8-timer-fixed-00-00.png');
  await page.screenshot({ path: shotPath });
  console.log('Saved screenshot:', shotPath);

  await browser.close();
}

run().catch(console.error);
