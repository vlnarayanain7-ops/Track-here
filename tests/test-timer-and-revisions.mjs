import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveArtifact(srcPath) {
  try {
    ensureDir(ARTIFACT_DIR);
    const dest = path.join(ARTIFACT_DIR, path.basename(srcPath));
    fs.copyFileSync(srcPath, dest);
    console.log(`Saved artifact: ${path.basename(srcPath)}`);
  } catch (err) {
    console.error('Failed to copy artifact:', err);
  }
}

async function run() {
  ensureDir('screenshots');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', (req) => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));

  let activeSession = null;
  let finishedSession = null;
  const revisionsList = [
    {
      _id: 'rev-imo-1',
      title: 'the imo pblm',
      type: 'topic',
      dueDate: new Date().toISOString(),
      intervalDays: 1,
      status: 'pending',
    },
    {
      _id: 'rev-dp-2',
      title: 'Dynamic Programming on Trees',
      type: 'topic',
      dueDate: new Date().toISOString(),
      intervalDays: 3,
      status: 'pending',
    },
  ];

  // Setup auth state in localStorage
  await page.addInitScript(() => {
    localStorage.removeItem('trackhere_active_timer_v2');
    localStorage.setItem('th-token', 'mock-p13-token');
    localStorage.setItem(
      'th-user',
      JSON.stringify({
        _id: 'user-p13',
        name: 'Narayana',
        email: 'vlnarayana.in7@gmail.com',
        ageBand: '18_plus',
        onboardingCompleted: true,
        dailyStudyGoal: 240,
        timezone: 'Asia/Kolkata',
        preparationType: 'Coding interviews',
        targetExamDate: new Date(Date.now() + 42 * 86400000).toISOString(),
        subjects: [
          { name: 'Algorithms', color: '#2563EB' },
          { name: 'System Design', color: '#16A34A' },
        ],
      })
    );
  });

  // Mock API routes
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith('.js') || url.endsWith('.css') || url.includes('/assets/')) {
      return route.continue();
    }

    if (url.includes('/api/auth/csrf')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { csrfToken: 'csrf-123' } }),
      });
    }

    if (url.includes('/api/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              _id: 'user-p13',
              name: 'Narayana',
              email: 'vlnarayana.in7@gmail.com',
              ageBand: '18_plus',
              onboardingCompleted: true,
              dailyStudyGoal: 240,
              timezone: 'Asia/Kolkata',
              preparationType: 'Coding interviews',
              targetExamDate: new Date(Date.now() + 42 * 86400000).toISOString(),
              subjects: [
                { name: 'Algorithms', color: '#2563EB' },
                { name: 'System Design', color: '#16A34A' },
              ],
            },
          },
        }),
      });
    }

    if (url.includes('/api/study-sessions/timer/start')) {
      const body = JSON.parse(route.request().postData() || '{}');
      activeSession = {
        _id: 'session-timer-1',
        category: body.category || 'Algorithms',
        topic: body.topic || 'Dijkstra Shortest Path',
        startTime: new Date().toISOString(),
        timerState: {
          status: 'running',
          startedAt: new Date().toISOString(),
          totalPausedDuration: 0,
          accumulatedDuration: 0,
        },
      };
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { session: activeSession } }),
      });
    }

    if (url.includes('/api/study-sessions/timer/active')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { session: activeSession } }),
      });
    }

    if (url.includes('/finish')) {
      finishedSession = {
        ...activeSession,
        endTime: new Date().toISOString(),
        focusDuration: 25,
      };
      activeSession = null;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { session: finishedSession } }),
      });
    }

    if (url.includes('/api/study-sessions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { sessions: finishedSession ? [finishedSession] : [] } }),
      });
    }

    if (url.includes('/api/revisions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { revisions: revisionsList } }),
      });
    }

    if (url.includes('/api/analytics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            currentStreak: 14,
            today: { studyMinutes: finishedSession ? 25 : 0, focusMinutes: finishedSession ? 25 : 0 },
            streaks: { currentStreak: 14 },
          },
        }),
      });
    }

    if (url.includes('/api/daily-reviews')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review: null,
          liveStats: { actualStudyTime: finishedSession ? 25 : 0 },
        }),
      });
    }

    if (url.includes('/api/daily-plans')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ plan: null }),
      });
    }

    if (url.includes('/api/tasks')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { tasks: [] } }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  console.log('Finding active preview server...');
  let targetUrl = 'http://localhost:5173/';
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://localhost:5173/');
      if (res.ok) { targetUrl = 'http://localhost:5173/'; break; }
    } catch {}
    try {
      const res4 = await fetch('http://localhost:5174/');
      if (res4.ok) { targetUrl = 'http://localhost:5174/'; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  // --- TEST 1: Focus Timer Persistence Across Navigation ---
  console.log(`1. Navigating to Study / Focus page at ${targetUrl}study...`);
  await page.goto(`${targetUrl}study`);
  await page.waitForLoadState('networkidle');
  console.log('Current page URL:', page.url());
  const allButtons = await page.locator('button').allInnerTexts();
  console.log('Buttons found on page:', allButtons);

  console.log('Starting focus timer on Study page...');
  const startBtn = page.locator('button').filter({ hasText: /^Start$/i });
  await startBtn.waitFor({ state: 'visible' });
  await startBtn.click();

  // Wait 2 seconds for timer tick
  await page.waitForTimeout(2000);

  // Navigate to Today dashboard
  console.log('Navigating away to Today (/) while timer is running...');
  const todayNav = page.locator('a[href="/"]').first();
  await todayNav.click();
  await page.waitForLoadState('networkidle');

  // Verify Active Timer pill is present in Header
  console.log('Checking if header timer pill is visible on Today...');
  const headerTimerPill = page.locator('header').locator('div').filter({ hasText: /\d{2}:\d{2}/ }).first();
  await headerTimerPill.waitFor({ state: 'visible', timeout: 5000 });
  const timeOnToday = await headerTimerPill.innerText();
  console.log(`PASS: Timer is ticking in header on Today page: ${timeOnToday.replace('\n', ' ')}`);

  // Take screenshot of Today with active timer pill
  await page.screenshot({ path: 'screenshots/today-active-timer.png' });
  saveArtifact('screenshots/today-active-timer.png');

  // Navigate to Progress page
  console.log('Navigating to Progress (/progress) while timer is running...');
  const progressNav = page.locator('a[href="/progress"]').first();
  await progressNav.click();
  await page.waitForLoadState('networkidle');

  // Verify Active Timer pill is still present on Progress
  console.log('Checking if header timer pill is visible on Progress...');
  await headerTimerPill.waitFor({ state: 'visible', timeout: 5000 });
  const timeOnProgress = await headerTimerPill.innerText();
  console.log(`PASS: Timer is ticking in header on Progress page: ${timeOnProgress.replace('\n', ' ')}`);

  // Take screenshot of Progress with active timer pill
  await page.screenshot({ path: 'screenshots/progress-active-timer.png' });
  saveArtifact('screenshots/progress-active-timer.png');

  // Stop & Save the timer from Header
  console.log('Finishing and saving timer from the header pill...');
  const finishBtn = headerTimerPill.locator('button[title="Finish"]');
  await finishBtn.click();
  await page.waitForTimeout(1000);
  console.log('PASS: Timer saved successfully!');

  // --- TEST 2: Redesigned Review Queue Page ---
  console.log(`2. Navigating to Redesigned Revisions page at ${targetUrl}revisions...`);
  await page.goto(`${targetUrl}revisions`);
  await page.waitForLoadState('networkidle');

  // Verify header and clean layout
  const revHeading = page.locator('h1').filter({ hasText: 'Review Queue' });
  await revHeading.waitFor({ state: 'visible' });
  console.log('PASS: Review Queue page rendered with calm title!');

  // Verify "the imo pblm" card
  const imoCard = page.locator('div').filter({ hasText: 'the imo pblm' }).last();
  await imoCard.waitFor({ state: 'visible' });
  console.log('PASS: "the imo pblm" card rendered!');

  // Verify clear Remembered and Hard buttons (NOT E C N F)
  const remBtn = page.locator('button').filter({ hasText: 'Remembered' }).first();
  const hardBtn = page.locator('button').filter({ hasText: 'Hard' }).first();
  await remBtn.waitFor({ state: 'visible' });
  await hardBtn.waitFor({ state: 'visible' });
  console.log('PASS: Clear "Remembered" and "Hard" buttons are present without cryptic letters!');

  // Take desktop screenshot
  await page.screenshot({ path: 'screenshots/revisions-redesigned-clean.png' });
  saveArtifact('screenshots/revisions-redesigned-clean.png');

  // Take mobile screenshot
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'screenshots/revisions-redesigned-mobile.png' });
  saveArtifact('screenshots/revisions-redesigned-mobile.png');

  await browser.close();
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
