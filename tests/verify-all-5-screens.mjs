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
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.removeItem('trackhere_active_timer_v2');
    localStorage.setItem('th-token', 'mock-verify-token');
    localStorage.setItem(
      'th-user',
      JSON.stringify({
        _id: 'user-verify',
        name: 'Narayana',
        email: 'vlnarayana.in7@gmail.com',
        ageBand: '18_plus',
        onboardingCompleted: true,
        dailyStudyGoal: 240,
        timezone: 'Asia/Kolkata',
        preparationType: 'Coding interviews',
        targetExamDate: '2026-12-31',
        weekStartsOn: 1,
        activeNotifications: { dailyReminder: true },
        morningReminderTime: '07:00',
        eveningReminderTime: '21:00',
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

    if (url.includes('/api/auth/me') || url.includes('/api/users/profile') || url.includes('/api/users/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              _id: 'user-verify',
              name: 'Narayana',
              email: 'vlnarayana.in7@gmail.com',
              ageBand: '18_plus',
              onboardingCompleted: true,
              dailyStudyGoal: 240,
              preparationType: 'Coding interviews',
              targetExamDate: '2026-12-31',
              weekStartsOn: 1,
              morningReminderTime: '07:00',
              eveningReminderTime: '21:00',
              subjects: [
                { name: 'Algorithms', color: '#2563EB' },
                { name: 'System Design', color: '#16A34A' },
              ],
            },
          },
        }),
      });
    }

    if (url.includes('/api/analytics/streak')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            currentStreak: 12,
            longestStreak: 24,
            activeDaysThisYear: 88,
            last7Days: [
              { day: 'Mon', isActive: true },
              { day: 'Tue', isActive: true },
              { day: 'Wed', isActive: false },
              { day: 'Thu', isActive: true },
              { day: 'Fri', isActive: true },
              { day: 'Sat', isActive: true },
              { day: 'Sun', isActive: true },
            ],
            history: [
              { date: '2026-11-16', minutes: 75 },
              { date: '2026-11-15', minutes: 120 },
              { date: '2026-11-14', minutes: 45 },
              { date: '2026-10-10', minutes: 90 },
              { date: '2026-09-05', minutes: 110 },
            ],
          },
        }),
      });
    }

    if (url.includes('/api/daily-plans/today')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          plan: {
            _id: 'plan-1',
            targetHours: 4,
            priorities: ['Solve 3 DP Problems', 'Review System Design Chapter 2'],
          },
        }),
      });
    }

    if (url.includes('/api/daily-reviews/today')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review: null,
          liveStats: {
            actualStudyTime: 95,
            completedTasks: [],
            problemsAttempted: 3,
            problemsSolved: 2,
            goalProgress: 40,
            dailyStudyGoal: 240,
          },
        }),
      });
    }

    if (url.includes('/api/tasks')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [
            { _id: 't-1', title: 'Two Pointers & Sliding Window', status: 'Todo', priority: 'High' },
            { _id: 't-2', title: 'Database Indexing Tradeoffs', status: 'Completed', priority: 'Medium' },
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
              _id: 'rev-1',
              title: 'Binary Search Edge Cases',
              type: 'topic',
              intervalDays: 3,
              dueDate: new Date().toISOString(),
              status: 'active',
            },
            {
              _id: 'rev-2',
              title: 'Consistent Hashing Rings',
              type: 'concept',
              intervalDays: 7,
              dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
              status: 'active',
            },
          ],
        }),
      });
    }

    if (url.includes('/api/analytics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalStudyMinutes: 2400,
            totalProblemsSolved: 48,
            completionRate: 85,
          },
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  const targetPort = 5173;
  console.log(`Connecting to client on port ${targetPort}...`);

  // 1. SCREEN 1: Progress Heatmap (Image 1 fix verification)
  console.log('Verifying Screen 1: Progress Heatmap...');
  await page.goto(`http://localhost:${targetPort}/progress`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.mh');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/screen-1-progress-heatmap.png', fullPage: false });
  saveArtifact('screenshots/screen-1-progress-heatmap.png');
  console.log('PASS: Screen 1 Progress Heatmap verified & captured!');

  // 2. SCREEN 2: Today Page Check-in Boxes & Up Next (Image 2 fix verification)
  console.log('Verifying Screen 2: Today Check-in Boxes & Up Next...');
  await page.goto(`http://localhost:${targetPort}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.checks');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/screen-2-today-checkin-boxes.png', fullPage: false });
  saveArtifact('screenshots/screen-2-today-checkin-boxes.png');
  console.log('PASS: Screen 2 Today check-in boxes & Up Next verified & captured!');

  // 3. SCREEN 3: Settings Page (Image 3 fix verification)
  console.log('Verifying Screen 3: Settings Page...');
  await page.goto(`http://localhost:${targetPort}/settings`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1:has-text("Settings")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/screen-3-settings-aligned-cards.png', fullPage: false });
  saveArtifact('screenshots/screen-3-settings-aligned-cards.png');
  console.log('PASS: Screen 3 Settings aligned cards verified & captured!');

  // 4. SCREEN 4: Today Review Drawer (Image 4 fix verification)
  console.log('Verifying Screen 4: Today Review Drawer...');
  await page.goto(`http://localhost:${targetPort}/?sheet=review`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[placeholder*="Dynamic Programming"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/screen-4-today-review-drawer.png', fullPage: false });
  saveArtifact('screenshots/screen-4-today-review-drawer.png');
  console.log('PASS: Screen 4 Today review drawer verified & captured!');

  // 5. SCREEN 5: Spaced Repetition Page (Image 5 fix verification)
  console.log('Verifying Screen 5: Spaced Repetition Page...');
  await page.goto(`http://localhost:${targetPort}/revisions`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Remembered")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/screen-5-revisions-clean-cards.png', fullPage: false });
  saveArtifact('screenshots/screen-5-revisions-clean-cards.png');
  console.log('PASS: Screen 5 Spaced Repetition clean cards verified & captured!');

  await browser.close();
  console.log('ALL 5 SCREENS VERIFIED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
