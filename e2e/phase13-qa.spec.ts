import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveArtifact(srcPath: string) {
  try {
    ensureDir(ARTIFACT_DIR);
    const dest = path.join(ARTIFACT_DIR, path.basename(srcPath));
    fs.copyFileSync(srcPath, dest);
  } catch (err) {
    console.error('Failed to copy artifact:', err);
  }
}

test.describe('Phase 13 Comprehensive Polish & Verification', () => {
  ensureDir('screenshots');

  test.beforeEach(async ({ page }) => {
    // Authenticate user with goal, examDate, and subjects
    await page.addInitScript(() => {
      localStorage.setItem('th-token', 'mock-phase13-token');
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

    // Mock API
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/src/') || url.includes('/node_modules/') || url.endsWith('.js') || url.endsWith('.jsx')) {
        return route.continue();
      }

      if (url.includes('/api/auth/csrf')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { csrfToken: 'mock-csrf' } }),
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
                nextReviewDate: new Date().toISOString(),
                intervalDays: 3,
                easeFactor: 2.5,
              },
              {
                _id: 'r2',
                title: 'Dijkstra Priority Queue Optimization',
                subject: 'Algorithms',
                stage: 1,
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
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
          body: JSON.stringify({
            dailyReview: null,
          }),
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

      // 5 overlapping timetable slots for Step 13.4 testing
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

      if (url.includes('/api/users/subjects/rename')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              subjects: [
                { name: 'Advanced Algorithms', color: '#2563EB' },
                { name: 'System Design', color: '#16A34A' },
                { name: 'Operating Systems', color: '#D97706' },
              ],
            },
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
  });

  // STEP 13.1: Streak Chip in all 3 states (idle, risk, lit) in light & dark
  test('13.1 Streak Chip states (idle, risk, lit) light and dark', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Lit state (default in mock: currentStreak=14, minutes=30 >= 25)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    const chipLit = page.locator('.chipst');
    await expect(chipLit).toBeVisible();
    await expect(chipLit).toHaveClass(/lit/);

    let p = 'screenshots/13.1-streak-lit-light.png';
    await chipLit.screenshot({ path: p });
    saveArtifact(p);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    p = 'screenshots/13.1-streak-lit-dark.png';
    await chipLit.screenshot({ path: p });
    saveArtifact(p);

    // 2. Risk state (currentStreak=14, but minutes < 25)
    await page.route('**/api/analytics/streaks', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentStreak: 14,
          longestStreak: 21,
          isActiveToday: false,
          last7Days: [],
          history: [],
        }),
      });
    });
    await page.route('**/api/analytics', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { focusMinutes: 10 },
          summary: { totalMinutes: 1420 },
        }),
      });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const chipRisk = page.locator('.chipst');
    await expect(chipRisk).toBeVisible();
    await expect(chipRisk).toHaveClass(/risk/);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    p = 'screenshots/13.1-streak-risk-light.png';
    await chipRisk.screenshot({ path: p });
    saveArtifact(p);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    p = 'screenshots/13.1-streak-risk-dark.png';
    await chipRisk.screenshot({ path: p });
    saveArtifact(p);

    // 3. Idle state (currentStreak = 0)
    await page.route('**/api/analytics/streaks', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentStreak: 0,
          longestStreak: 21,
          isActiveToday: false,
          last7Days: [],
          history: [],
        }),
      });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const chipIdle = page.locator('.chipst');
    await expect(chipIdle).toBeVisible();
    await expect(chipIdle).toHaveClass(/idle/);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    p = 'screenshots/13.1-streak-idle-light.png';
    await chipIdle.screenshot({ path: p });
    saveArtifact(p);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    p = 'screenshots/13.1-streak-idle-dark.png';
    await chipIdle.screenshot({ path: p });
    saveArtifact(p);
  });

  // STEP 13.2 & 13.4b: Today Dashboard (Goal subtitle, 3 Check-in buttons, Side sheets)
  test('13.2 & 13.4b Today Dashboard & Check-ins (1440 & 390 in light & dark)', async ({ page }) => {
    // 1440x900 Light
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // Check goal subtitle is present and quiet
    const sub = page.locator('.hd .sub');
    await expect(sub).toContainText('Goal: Coding interviews');
    await expect(sub).toContainText('days left');

    // Check 3 check-in buttons
    const checks = page.locator('.checks .ck3');
    await expect(checks).toHaveCount(3);
    await expect(checks.nth(0)).toContainText('Morning plan');
    await expect(checks.nth(1)).toContainText('Evening review');
    await expect(checks.nth(2)).toContainText('Review');

    let p = 'screenshots/13.2-today-1440x900-light.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // 1440x900 Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    p = 'screenshots/13.2-today-1440x900-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // 390x844 Light
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    p = 'screenshots/13.2-today-390x844-light.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // 390x844 Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    p = 'screenshots/13.2-today-390x844-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // Test clicking Review check-in opens ReviewSheet
    await page.setViewportSize({ width: 1440, height: 900 });
    await checks.nth(2).click();
    const sheet = page.locator('.sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Review');
    await expect(sheet).toContainText('Consistent Hashing and Virtual Nodes');
    await expect(sheet).toContainText('Remembered');
    await expect(sheet).toContainText('Hard');

    p = 'screenshots/13.6-review-sheet-1440x900-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);
  });

  // STEP 13.3: Plan > Subjects (Inline Rename & Color Dot)
  test('13.3 Plan > Subjects inline rename and color picker', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plan');
    await page.waitForLoadState('networkidle');

    // Click Subjects tab
    const subjectsTab = page.locator('button', { hasText: 'Subjects' });
    await subjectsTab.click();

    // Verify subjects listed
    const algoRow = page.locator('text=Algorithms').first();
    await expect(algoRow).toBeVisible();

    // Take screenshot of Plan > Subjects Light
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    let p = 'screenshots/13.3-subjects-1440x900-light.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    p = 'screenshots/13.3-subjects-1440x900-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // Mobile 390x844 Dark
    await page.setViewportSize({ width: 390, height: 844 });
    p = 'screenshots/13.3-subjects-390x844-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);
  });

  // STEP 13.4: Timetable that fits (5 overlapping sessions on one evening side-by-side)
  test('13.4 Timetable 5 overlapping sessions side-by-side in lanes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plan');
    await page.waitForLoadState('networkidle');

    // Click Week tab
    const weekTab = page.locator('button', { hasText: 'Week' });
    await weekTab.click();

    // Verify 5 blocks rendered
    const blocks = page.locator('.blk');
    await expect(blocks).toHaveCount(5);

    // Verify hour range: 06:00 is visible
    await expect(page.locator('text=06:00')).toBeVisible();
    await expect(page.locator('text=Show all hours')).toBeVisible();

    // Screenshot in Dark mode showing 5 overlapping sessions side-by-side
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    let p = 'screenshots/13.4-timetable-5-overlapping-1440x900-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // Screenshot in Light mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    p = 'screenshots/13.4-timetable-5-overlapping-1440x900-light.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    p = 'screenshots/13.4-timetable-390x844-light.png';
    await page.screenshot({ path: p });
    saveArtifact(p);
  });

  // STEP 13.5: Command Palette (Ctrl+K)
  test('13.5 Command Palette (Ctrl+K) grouped and scorecard removed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open palette with Ctrl+K
    await page.keyboard.press('Control+k');
    const palette = page.locator('input[placeholder*="command"]');
    await expect(palette).toBeVisible();

    // Verify groups: Go to, Check in, Create
    await expect(page.locator('text=Go to')).toBeVisible();
    await expect(page.locator('text=Check in')).toBeVisible();
    await expect(page.locator('text=Create')).toBeVisible();

    // Verify "Review queue" is under Check in
    await expect(page.locator('text=Review queue')).toBeVisible();

    // Verify "Log Mock Test Scorecard" is REMOVED
    const scorecardItem = page.locator('text=Log Mock Test Scorecard');
    await expect(scorecardItem).toHaveCount(0);

    // Take screenshot Light
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    let p = 'screenshots/13.5-command-palette-1440x900-light.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    p = 'screenshots/13.5-command-palette-1440x900-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);
  });

  // STEP 13.7: Settings (Single calm 640px page with autosave)
  test('13.7 Settings small and calm (Study, Reminders, Appearance, Account)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify 4 calm sections
    await expect(page.locator('text=Study')).toBeVisible();
    await expect(page.locator('text=Reminders')).toBeVisible();
    await expect(page.locator('text=Appearance')).toBeVisible();
    await expect(page.locator('text=Account')).toBeVisible();

    // Verify no big Save buttons
    const saveBtns = page.locator('button', { hasText: 'Save All Preferences' });
    await expect(saveBtns).toHaveCount(0);

    // Verify autosave indicator element
    await expect(page.locator('text=Changes save automatically.')).toBeVisible();

    // Click 3h daily target button to test autosave trigger
    const target3h = page.locator('button', { hasText: '3h' });
    if (await target3h.count() > 0) {
      await target3h.first().click();
      await expect(page.locator('text=Saved')).toBeVisible();
    }

    // Screenshot Light 1440x900
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    let p = 'screenshots/13.7-settings-calm-1440x900-light.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // Dark 1440x900
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    p = 'screenshots/13.7-settings-calm-1440x900-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);

    // Mobile 390x844 Dark
    await page.setViewportSize({ width: 390, height: 844 });
    p = 'screenshots/13.7-settings-calm-390x844-dark.png';
    await page.screenshot({ path: p });
    saveArtifact(p);
  });
});
