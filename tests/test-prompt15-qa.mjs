import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

const mockUser = {
  _id: 'u-prompt15-test',
  name: 'Narayana',
  email: 'vlnarayana.in7@gmail.com',
  ageBand: '18_plus',
  termsVersion: '2026-11-20',
  onboardingCompleted: true,
  timezone: 'Asia/Kolkata',
  subjects: [
    { id: 'sub-algo', name: 'Algorithms', color: 'c1' },
    { id: 'sub-os', name: 'Operating Systems', color: 'c2' },
    { id: 'sub-math', name: 'Maths', color: 'c3' },
  ],
};

const now = new Date();
const todayISO = now.toISOString();
const yesterdayISO = new Date(now.getTime() - 864e5).toISOString();
const twoDaysAgoISO = new Date(now.getTime() - 2 * 864e5).toISOString();

const mockSessions = [
  {
    _id: 'sess-1',
    topic: 'Dijkstra Shortest Path',
    category: 'Algorithms',
    subject: 'Algorithms',
    activityType: 'Problem Solving',
    durationSec: 1500,
    duration: 25,
    startedAt: todayISO,
    date: todayISO,
  },
  {
    _id: 'sess-2',
    topic: 'Virtual Memory & Paging',
    category: 'Operating Systems',
    subject: 'Operating Systems',
    activityType: 'Deep Work',
    durationSec: 2400,
    duration: 40,
    startedAt: todayISO,
    date: todayISO,
  },
  {
    _id: 'sess-3',
    topic: 'Relational Algebra & Joins',
    category: 'Maths',
    subject: 'Maths',
    activityType: 'Problem Solving',
    durationSec: 3000,
    duration: 50,
    startedAt: yesterdayISO,
    date: yesterdayISO,
  },
  {
    _id: 'sess-4',
    topic: 'Graph Bipartition & Flow',
    category: 'Algorithms',
    subject: 'Algorithms',
    activityType: 'Problem Solving',
    durationSec: 4200,
    duration: 70,
    startedAt: twoDaysAgoISO,
    date: twoDaysAgoISO,
  },
];

async function setupPage(context, { theme = 'dark', viewport = { width: 1440, height: 900 }, sessions = mockSessions, resetPomo = true } = {}) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);

  await page.addInitScript(({ thTheme, shouldReset }) => {
    localStorage.setItem('th-theme', thTheme);
    localStorage.setItem('th-token', 'test-jwt-token');
    if (shouldReset && !sessionStorage.getItem('th_init_reset')) {
      sessionStorage.setItem('th_init_reset', '1');
      localStorage.removeItem('th-pomo');
    }
    document.documentElement.dataset.theme = thTheme;
  }, { thTheme: theme, shouldReset: resetPomo });

  let currentSessions = [...sessions];

  await page.route((url) => {
    try {
      const u = new URL(url);
      return u.pathname.startsWith('/api/');
    } catch {
      return false;
    }
  }, async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes('/api/auth/csrf')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { csrfToken: 'token' } }) });
    }
    if (url.includes('/api/auth/me') || url.includes('/api/users/profile') || url.includes('/api/users/me')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { user: mockUser }, user: mockUser }) });
    }
    if (url.includes('/api/study-sessions/timer/active')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { session: null } }) });
    }
    if (url.includes('/api/study-sessions/timer/heartbeat')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }
    if (url.includes('/api/study-sessions') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { sessions: currentSessions, pagination: { total: currentSessions.length } } }) });
    }
    if (url.includes('/api/study-sessions') && method === 'POST') {
      const body = req.postDataJSON() || {};
      const newS = { _id: 'sess-' + Date.now(), ...body };
      currentSessions.unshift(newS);
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { session: newS }, session: newS }) });
    }
    if (url.includes('/api/study-sessions/') && method === 'PUT') {
      const body = req.postDataJSON() || {};
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: body }) });
    }
    if (url.includes('/api/study-sessions/') && method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });

  return { page, getCurrentSessions: () => currentSessions };
}

async function run() {
  console.log('--- Starting PROMPT 15 Playwright Verification & Screenshots ---');
  const browser = await chromium.launch();
  const context = await browser.newContext();

  const results = [];

  // ==========================================
  // TEST 1: Presets, phase change and history
  // ==========================================
  console.log('\nRunning Test 1: Presets, phase change and history...');
  {
    const { page } = await setupPage(context);
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    // Click 50 / 10 preset
    await page.getByRole('button', { name: '50 / 10' }).click();
    await page.waitForTimeout(100);
    const clockText = await page.locator('.time b').textContent();
    console.log('Preset 50/10 time displayed:', clockText);
    const has50 = clockText.includes('50:00');

    // Start timer
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(300);
    const hasPause = await page.getByRole('button', { name: 'Pause' }).isVisible();

    // Fast forward phase transition or click Finish
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.waitForTimeout(300);

    // Verify Short break transition
    const shortBreakPressed = await page.getByRole('button', { name: /Short break/i }).getAttribute('aria-pressed');
    console.log('Short break aria-pressed after finish:', shortBreakPressed);

    // Open History Drawer
    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForSelector('.hday');
    const hasToday = await page.locator('.hday').first().textContent();
    console.log('History drawer opened, day label:', hasToday);

    results.push({
      test: 'Presets, phase change and history',
      passed: has50 && hasPause && shortBreakPressed === 'true' && hasToday.includes('Today'),
    });
    await page.close();
  }

  // ==========================================
  // TEST 2: Refresh keeps a running timer
  // ==========================================
  console.log('\nRunning Test 2: Refresh keeps a running timer...');
  {
    const { page } = await setupPage(context);
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    // Start timer
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    const pauseVisible = await page.getByRole('button', { name: 'Pause' }).isVisible();
    console.log('After reload, Pause button visible:', pauseVisible);

    results.push({
      test: 'Refresh keeps a running timer',
      passed: pauseVisible,
    });
    await page.close();
  }

  // ==========================================
  // TEST 3: History has no horizontal scroll on phone
  // ==========================================
  console.log('\nRunning Test 3: History has no horizontal scroll on a phone (360x800)...');
  {
    const { page } = await setupPage(context, { viewport: { width: 360, height: 800 } });
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForSelector('.hday');

    const noHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    console.log('No horizontal scroll on phone:', noHorizontalScroll);

    results.push({
      test: 'History has no horizontal scroll on a phone',
      passed: noHorizontalScroll,
    });
    await page.close();
  }

  // ==========================================
  // CAPTURE ALL REQUIRED PROMPT 15 SCREENSHOTS
  // ==========================================
  console.log('\nCapturing screenshots required by Prompt 15...');

  // 1. Presets screenshots (Desktop 1440x900 Dark)
  for (const presetName of ['25 / 5', '50 / 10', '90 / 20', 'Custom', 'Stopwatch']) {
    const { page } = await setupPage(context, { theme: 'dark' });
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    await page.getByRole('button', { name: presetName, exact: true }).click();
    await page.waitForTimeout(200);

    const safeName = presetName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const shotPath = path.join(ARTIFACT_DIR, `step-15-preset-${safeName}-desktop-dark.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Captured preset: ${presetName} -> ${shotPath}`);
    await page.close();
  }

  // 2. Focus mode and both Break modes (Desktop 1440x900 Dark & Light)
  for (const th of ['dark', 'light']) {
    const { page } = await setupPage(context, { theme: th });
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    // Focus mode screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `step-15-mode-focus-desktop-${th}.png`) });

    // Short break mode screenshot
    await page.getByRole('button', { name: 'Short break' }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `step-15-mode-short-break-desktop-${th}.png`) });

    // Long break mode screenshot
    await page.getByRole('button', { name: 'Long break' }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `step-15-mode-long-break-desktop-${th}.png`) });

    console.log(`Captured Focus, Short break, and Long break modes in ${th}`);
    await page.close();
  }

  // 3. Settings popover (Desktop Dark & Light)
  for (const th of ['dark', 'light']) {
    const { page } = await setupPage(context, { theme: th });
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    await page.getByRole('button', { name: 'Timer settings' }).click();
    await page.waitForSelector('[aria-label="Timer settings"]');
    await page.waitForTimeout(200);

    const shotPath = path.join(ARTIFACT_DIR, `step-15-settings-popover-desktop-${th}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Captured Settings popover (${th}) -> ${shotPath}`);
    await page.close();
  }

  // 4. Finished block with "Session saved" panel (Desktop Dark & Light)
  for (const th of ['dark', 'light']) {
    const { page } = await setupPage(context, { theme: th, resetPomo: false });

    // Set stored timer before navigation so initial load mounts it
    await page.addInitScript(() => {
      localStorage.setItem('th-pomo', JSON.stringify({
        presetId: 'classic',
        custom: null,
        cfg: { label: '25 / 5', focus: 25, short: 5, long: 15, every: 4 },
        phase: 'focus',
        running: true,
        startedAt: Date.now() - 65000,
        accMs: 0,
        completedFocus: 0,
        firstStartedAt: Date.now() - 65000,
        clientId: 'test-block-finished',
        subjectId: 'sub-algo',
      }));
    });

    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    // Click Finish
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.waitForSelector('.saved');
    await page.waitForTimeout(200);

    const shotPath = path.join(ARTIFACT_DIR, `step-15-saved-panel-desktop-${th}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Captured Finished block with saved panel (${th}) -> ${shotPath}`);

    // Clean up
    await page.evaluate(() => localStorage.removeItem('th-pomo'));
    await page.close();
  }

  // 5. History list with 3 days of data (Desktop Dark & Light)
  for (const th of ['dark', 'light']) {
    const { page } = await setupPage(context, { theme: th });
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForSelector('.hday');
    await page.waitForTimeout(200);

    const shotPath = path.join(ARTIFACT_DIR, `step-15-history-list-3days-desktop-${th}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Captured History list with 3 days of data (${th}) -> ${shotPath}`);
    await page.close();
  }

  // 6. History calendar view (Desktop Dark & Light)
  for (const th of ['dark', 'light']) {
    const { page } = await setupPage(context, { theme: th });
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForSelector('.seg');
    await page.getByRole('button', { name: 'Calendar' }).click();
    await page.waitForSelector('.cal7');
    await page.waitForTimeout(200);

    const shotPath = path.join(ARTIFACT_DIR, `step-15-history-calendar-desktop-${th}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Captured History calendar (${th}) -> ${shotPath}`);
    await page.close();
  }

  // 7. History empty state (Desktop Dark & Light)
  for (const th of ['dark', 'light']) {
    const { page } = await setupPage(context, { theme: th, sessions: [] });
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForSelector('.sheet.wide');
    await page.waitForTimeout(200);

    const shotPath = path.join(ARTIFACT_DIR, `step-15-history-empty-desktop-${th}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Captured History empty state (${th}) -> ${shotPath}`);
    await page.close();
  }

  // 8. Mobile screenshots on 390x844 (Dark & Light)
  for (const th of ['dark', 'light']) {
    const { page } = await setupPage(context, { theme: th, viewport: { width: 390, height: 844 } });
    await page.goto('http://localhost:5173/study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.time b');

    // Mobile Focus Timer
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `step-15-mobile-focus-390x844-${th}.png`) });

    // Mobile Settings Popover
    await page.getByRole('button', { name: 'Timer settings' }).click();
    await page.waitForSelector('[aria-label="Timer settings"]');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `step-15-mobile-settings-390x844-${th}.png`) });

    // Close Settings & Open Mobile History Drawer
    await page.getByRole('button', { name: 'Close settings' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'History' }).click();
    await page.waitForSelector('.hday');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `step-15-mobile-history-390x844-${th}.png`) });

    console.log(`Captured Mobile (390x844) Focus, Settings, and History in ${th}`);
    await page.close();
  }

  await browser.close();

  console.log('\n--- Test Summary ---');
  let allPassed = true;
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'}: ${r.test}`);
    if (!r.passed) allPassed = false;
  }

  if (!allPassed) {
    console.error('Some Playwright tests failed!');
    process.exit(1);
  }
  console.log('All Playwright tests and screenshots completed successfully!');
}

run().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
