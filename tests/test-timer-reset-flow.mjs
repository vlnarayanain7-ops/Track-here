import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Test 1: Phantom timer in localStorage is auto-cleared when server has no session
  await page.addInitScript(() => {
    localStorage.setItem('th-theme', 'dark');
    localStorage.setItem('th-token', 'mock-token');
    localStorage.setItem('trackhere_active_timer_v2', JSON.stringify({
      startedAt: Date.now() - 118000,
      accumulatedDuration: 0,
      localStart: Date.now() - 118000,
      lastTick: Date.now(),
      isRunning: true,
      isPaused: false,
      session: { _id: 'old-stale-sess', isTimerSession: true },
    }));
  });

  const mockUser = {
    _id: 'u-timer-test',
    name: 'Narayana',
    email: 'vlnarayana.in7@gmail.com',
    ageBand: '18_plus',
    termsVersion: '2026-11-20',
    onboardingCompleted: true,
    timezone: 'Asia/Kolkata',
    subjects: [{ name: 'Engineering' }],
  };

  let serverSession = null;

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
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { session: serverSession } }),
      });
    }
    if (url.includes('/api/study-sessions/timer/start')) {
      serverSession = {
        _id: 'sess-new',
        user: 'u-timer-test',
        isTimerSession: true,
        category: 'Engineering',
        timerState: {
          status: 'running',
          startedAt: new Date(Date.now() - 118000).toISOString(), // Clock skew simulation
          accumulatedDuration: 0,
        },
      };
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { session: serverSession } }),
      });
    }
    if (url.includes('/api/study-sessions/timer/cancel')) {
      serverSession = null;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });

  console.log('1. Navigating to /study with stale 01:58 in localStorage...');
  await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const initialTime = await page.locator('.time b').innerText();
  console.log('Timer Display after server confirms null session:', initialTime);
  if (initialTime !== '00:00') {
    throw new Error(`Expected 00:00, got ${initialTime}`);
  }

  console.log('2. Clicking Start button...');
  await page.click('.acts button:has-text("Start")');
  await page.waitForTimeout(2000);

  const runningTime = await page.locator('.time b').innerText();
  console.log('Running Timer Display after 2s:', runningTime);
  if (runningTime.startsWith('01:') || runningTime.startsWith('02:')) {
    throw new Error(`Timer jumped due to clock skew! Time: ${runningTime}`);
  }

  const runningBtns = await page.locator('.acts button').allInnerTexts();
  console.log('Running state buttons:', runningBtns);

  console.log('3. Clicking Reset button...');
  await page.click('.acts button:has-text("Reset")');
  await page.waitForTimeout(500);

  const resetTime = await page.locator('.time b').innerText();
  console.log('Timer Display after Reset:', resetTime);
  if (resetTime !== '00:00') {
    throw new Error(`Expected 00:00 after Reset, got ${resetTime}`);
  }

  const resetBtns = await page.locator('.acts button').allInnerTexts();
  console.log('Reset state buttons:', resetBtns);
  if (!resetBtns.includes('Start')) {
    throw new Error('Expected Start button visible after reset');
  }

  console.log('✅ ALL FULL CYCLE TIMER TESTS PASSED PERFECTLY!');
  await browser.close();
}

run().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
