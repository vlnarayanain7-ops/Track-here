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
  const context = await browser.newContext();
  const page = await context.newPage();

  // Setup auth & user
  await page.addInitScript(() => {
    localStorage.setItem('th-token', 'mock-p13-token');
    localStorage.setItem(
      'th-user',
      JSON.stringify({
        _id: 'user-p13',
        name: 'Narayana',
        email: 'scholar@trackhere.app',
        ageBand: '18_plus',
        onboardingCompleted: true,
        dailyStudyGoal: 240,
        timezone: 'Asia/Kolkata',
        preparationType: 'Coding interviews',
        targetExamDate: new Date(Date.now() + 42 * 86400000).toISOString(),
        examName: 'Coding interviews',
        examDate: new Date(Date.now() + 42 * 86400000).toISOString(),
        subjects: [
          { name: 'Algorithms', color: '#2563EB' },
          { name: 'System Design', color: '#16A34A' },
          { name: 'Operating Systems', color: '#D97706' },
        ],
      })
    );
  });

  // Mock API routes
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

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
              email: 'scholar@trackhere.app',
              ageBand: '18_plus',
              onboardingCompleted: true,
              dailyStudyGoal: 240,
              timezone: 'Asia/Kolkata',
              preparationType: 'Coding interviews',
              targetExamDate: new Date(Date.now() + 42 * 86400000).toISOString(),
              examName: 'Coding interviews',
              examDate: new Date(Date.now() + 42 * 86400000).toISOString(),
              subjects: [
                { name: 'Algorithms', color: '#2563EB' },
                { name: 'System Design', color: '#16A34A' },
                { name: 'Operating Systems', color: '#D97706' },
              ],
            },
          },
        }),
      });
    }

    if (url.includes('/api/analytics/streaks')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentStreak: 14,
          longestStreak: 21,
          activeDaysThisYear: 84,
          isActiveToday: true,
          last7Days: [
            { day: 'M', date: '2026-11-09', minutes: 60, hours: 1, isActive: true },
            { day: 'T', date: '2026-11-10', minutes: 45, hours: 0.75, isActive: true },
            { day: 'W', date: '2026-11-11', minutes: 75, hours: 1.25, isActive: true },
            { day: 'T', date: '2026-11-12', minutes: 0, hours: 0, isActive: false },
            { day: 'F', date: '2026-11-13', minutes: 90, hours: 1.5, isActive: true },
            { day: 'S', date: '2026-11-14', minutes: 25, hours: 0.42, isActive: true },
            { day: 'S', date: '2026-11-15', minutes: 30, hours: 0.5, isActive: true },
          ],
          history: [
            { date: '2026-11-15', minutes: 30 },
            { date: '2026-11-14', minutes: 25 },
            { date: '2026-11-13', minutes: 90 },
          ],
        }),
      });
    }

    if (url.includes('/api/analytics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { focusMinutes: 30 },
          summary: { totalMinutes: 1420 },
          bySubject: [
            { subject: 'Algorithms', minutes: 820 },
            { subject: 'System Design', minutes: 600 },
          ],
        }),
      });
    }

    if (url.includes('/api/tasks')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [
            {
              _id: 't1',
              title: 'Design distributed cache system',
              status: 'Todo',
              category: 'System Design',
              priority: 'High',
            },
            {
              _id: 't2',
              title: 'Review Trie & Radix trees',
              status: 'Completed',
              category: 'Algorithms',
              priority: 'Medium',
            },
          ],
        }),
      });
    }

    if (url.includes('/api/revisions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          revisions: [
            {
              _id: 'r1',
              title: 'Consistent Hashing and Virtual Nodes',
              subject: 'System Design',
              stage: 2,
              dueDate: new Date().toISOString(),
              intervalDays: 3,
              easeFactor: 2.5,
            },
            {
              _id: 'r2',
              title: 'Dijkstra Priority Queue Optimization',
              subject: 'Algorithms',
              stage: 1,
              dueDate: new Date(Date.now() + 86400000).toISOString(),
              intervalDays: 1,
              easeFactor: 2.5,
            },
          ],
        }),
      });
    }

    if (url.includes('/api/daily-plans')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dailyPlan: {
            _id: 'dp1',
            targetHours: 4,
            mainFocus: 'Complete rate limiter design',
            plannedTaskIds: ['t1'],
          },
        }),
      });
    }

    if (url.includes('/api/daily-reviews')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dailyReview: null }),
      });
    }

    if (url.includes('/api/study-sessions')) {
      const todayStr = new Date().toISOString().split('T')[0];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              _id: 's1',
              startTime: `${todayStr}T18:00:00.000Z`,
              endTime: `${todayStr}T18:45:00.000Z`,
              duration: 45,
              category: 'Algorithms',
              notes: 'Solved LeetCode 295',
            },
          ],
        }),
      });
    }

    if (url.includes('/api/timetable')) {
      const now = new Date();
      const dow = (now.getDay() + 6) % 7; // Monday = 0
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slots: [
            {
              _id: 'slot-1',
              dayOfWeek: dow,
              startTime: '18:00',
              endTime: '20:00',
              subject: 'Algorithms',
              title: 'Dynamic Programming deep dive',
              color: '#2563EB',
            },
            {
              _id: 'slot-2',
              dayOfWeek: dow,
              startTime: '18:30',
              endTime: '20:30',
              subject: 'System Design',
              title: 'Message Queues (Kafka vs RabbitMQ)',
              color: '#16A34A',
            },
            {
              _id: 'slot-3',
              dayOfWeek: dow,
              startTime: '19:00',
              endTime: '21:00',
              subject: 'Operating Systems',
              title: 'Virtual Memory & Page Replacement',
              color: '#D97706',
            },
            {
              _id: 'slot-4',
              dayOfWeek: dow,
              startTime: '19:30',
              endTime: '21:30',
              subject: 'No subject',
              title: 'Evening Problem Set',
              color: '#6B7280',
            },
            {
              _id: 'slot-5',
              dayOfWeek: dow,
              startTime: '20:00',
              endTime: '22:00',
              subject: 'Algorithms',
              title: 'Graph Traversal & Shortest Paths',
              color: '#8B5CF6',
            },
          ],
        }),
      });
    }

    if (url.includes('/api/users/profile') || url.includes('/api/users/settings')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  console.log('--- STARTING QA TEST AND SCREENSHOT RUN ---');

  // ==========================================
  // STEP 13.1: STREAK CHIP (Lit, Risk, Idle)
  // ==========================================
  console.log('\n[13.1] Verifying Streak Chip states (Lit, Risk, Idle)...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  // Lit state (30 min today >= 25, currentStreak = 14)
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  const chip = await page.$('.chipst');
  console.log('Lit chip visible:', !!chip);
  let p = 'screenshots/13.1-streak-lit-light.png';
  await chip.screenshot({ path: p });
  saveArtifact(p);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.1-streak-lit-dark.png';
  await chip.screenshot({ path: p });
  saveArtifact(p);

  // Risk state (today focus 10 min < 25)
  await page.route('**/api/analytics/streaks', async (r) => {
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ currentStreak: 14, longestStreak: 21, isActiveToday: false }),
    });
  });
  await page.route('**/api/analytics', async (r) => {
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ today: { focusMinutes: 10 } }),
    });
  });
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  const chipRisk = await page.$('.chipst');
  p = 'screenshots/13.1-streak-risk-light.png';
  await chipRisk.screenshot({ path: p });
  saveArtifact(p);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.1-streak-risk-dark.png';
  await chipRisk.screenshot({ path: p });
  saveArtifact(p);

  // Idle state (currentStreak = 0)
  await page.route('**/api/analytics/streaks', async (r) => {
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ currentStreak: 0, longestStreak: 21, isActiveToday: false }),
    });
  });
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  const chipIdle = await page.$('.chipst');
  p = 'screenshots/13.1-streak-idle-light.png';
  await chipIdle.screenshot({ path: p });
  saveArtifact(p);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.1-streak-idle-dark.png';
  await chipIdle.screenshot({ path: p });
  saveArtifact(p);

  // Restore lit state for rest of tests
  await page.route('**/api/analytics/streaks', async (r) => {
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ currentStreak: 14, longestStreak: 21, isActiveToday: true }),
    });
  });
  await page.route('**/api/analytics', async (r) => {
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ today: { focusMinutes: 30 } }),
    });
  });

  // ==========================================
  // STEP 13.2 & 13.4b: TODAY DASHBOARD
  // ==========================================
  console.log('\n[13.2 & 13.4b] Verifying Today Dashboard, Goal Subtitle, Check-in buttons...');
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  // Desktop Light
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  p = 'screenshots/13.2-today-1440x900-light.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  // Desktop Dark
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.2-today-1440x900-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  // Mobile Light
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  p = 'screenshots/13.2-today-390x844-light.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  // Mobile Dark
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.2-today-390x844-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  // Test Review Side Sheet
  console.log('\n[13.6] Verifying Review Side Sheet...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/?sheet=review');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  p = 'screenshots/13.6-review-sheet-1440x900-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  p = 'screenshots/13.6-review-sheet-1440x900-light.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  // ==========================================
  // STEP 13.3: PLAN > SUBJECTS
  // ==========================================
  console.log('\n[13.3] Verifying Plan > Subjects...');
  await page.goto('http://localhost:5173/plan?tab=subjects');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.3-subjects-1440x900-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  p = 'screenshots/13.3-subjects-1440x900-light.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await page.setViewportSize({ width: 390, height: 844 });
  p = 'screenshots/13.3-subjects-390x844-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  // ==========================================
  // STEP 13.4: TIMETABLE WEEK WITH 5 OVERLAPPING SESSIONS
  // ==========================================
  console.log('\n[13.4] Verifying Timetable Week with 5 overlapping sessions...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/plan?tab=week');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);

  const blkCount = await page.$$eval('.blk', els => els.length);
  console.log(`Rendered timetable blocks (.blk): ${blkCount}`);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.4-timetable-5-overlapping-1440x900-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  p = 'screenshots/13.4-timetable-5-overlapping-1440x900-light.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await page.setViewportSize({ width: 390, height: 844 });
  p = 'screenshots/13.4-timetable-390x844-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  // ==========================================
  // STEP 13.5: COMMAND PALETTE (Ctrl+K)
  // ==========================================
  console.log('\n[13.5] Verifying Command Palette (Ctrl+K)...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  // Trigger palette
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(300);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.5-command-palette-1440x900-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  p = 'screenshots/13.5-command-palette-1440x900-light.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  // ==========================================
  // STEP 13.7: SETTINGS (Single calm 640px page)
  // ==========================================
  console.log('\n[13.7] Verifying Settings...');
  await page.goto('http://localhost:5173/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  p = 'screenshots/13.7-settings-calm-1440x900-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  p = 'screenshots/13.7-settings-calm-1440x900-light.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await page.setViewportSize({ width: 390, height: 844 });
  p = 'screenshots/13.7-settings-calm-390x844-dark.png';
  await page.screenshot({ path: p });
  saveArtifact(p);

  await browser.close();
  console.log('\n✅ ALL PHASE 13 QA TESTS & SCREENSHOTS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Fatal error during QA run:', err);
  process.exit(1);
});
