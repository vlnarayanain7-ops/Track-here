import { test, expect } from '@playwright/test';

test.describe('Step 11.6 Progress Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock auth token to authenticate test user
    await page.addInitScript(() => {
      localStorage.setItem('th-token', 'mock-token-progress-test');
      localStorage.setItem(
        'th-user',
        JSON.stringify({
          _id: 'user-calm-progress',
          name: 'Calm Tester',
          email: 'tester@trackhere.app',
          ageBand: '18_plus',
          onboardingCompleted: true,
          streakGraceDays: 1,
          timezone: 'Asia/Kolkata',
        })
      );
    });

    // Intercept API routes for consistent calm test data
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
                _id: 'user-calm-progress',
                name: 'Calm Tester',
                email: 'tester@trackhere.app',
                ageBand: '18_plus',
                onboardingCompleted: true,
                streakGraceDays: 1,
                timezone: 'Asia/Kolkata',
              },
            },
          }),
        });
      }

      if (url.includes('/api/analytics/streaks')) {
        // Return single unified history list of 53 weeks (371 days)
        const history = [];
        const today = new Date('2026-11-13T12:00:00Z');
        const start = new Date(today);
        start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 52 * 7);

        for (let i = 0; i < 371; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dateStr = d.toISOString().slice(0, 10);
          // Light up specific days (e.g. today has 45 mins, recent days have 30-120 mins)
          const daysFromToday = Math.round((today.getTime() - d.getTime()) / 86400000);
          let minutes = 0;
          if (daysFromToday >= 0 && daysFromToday <= 12) {
            minutes = 30 + (daysFromToday * 25) % 150;
          } else if (daysFromToday > 12 && daysFromToday % 3 === 0) {
            minutes = 45;
          }
          history.push({ date: dateStr, minutes });
        }

        const streakInfo = {
          currentStreak: 12,
          longestStreak: 21,
          activeDaysThisYear: 134,
          isActiveToday: true,
          nextMilestone: 14,
          history,
          last7Days: [
            { day: 'M', date: '2026-11-09', minutes: 210, hours: 3.5, isActive: true },
            { day: 'T', date: '2026-11-10', minutes: 252, hours: 4.2, isActive: true },
            { day: 'W', date: '2026-11-11', minutes: 156, hours: 2.6, isActive: true },
            { day: 'T', date: '2026-11-12', minutes: 0, hours: 0, isActive: false },
            { day: 'F', date: '2026-11-13', minutes: 45, hours: 0.8, isActive: true },
            { day: 'S', date: '2026-11-14', minutes: 0, hours: 0, isActive: false },
            { day: 'S', date: '2026-11-15', minutes: 0, hours: 0, isActive: false },
          ],
        };

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(streakInfo),
        });
      }

      if (url.includes('/api/analytics')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            summary: {
              totalSessions: 41,
              averageSessionMinutes: 71,
            },
          }),
        });
      }

      if (url.includes('/api/problems')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            problems: [
              { _id: 'prob-1', title: 'Shortest path in a weighted graph', status: 'Solved' },
              { _id: 'prob-2', title: "Banker's algorithm safety check", status: 'Review' },
            ],
          }),
        });
      }

      if (url.includes('/api/mock-tests')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            mockTests: [],
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
  });

  test('desktop 1440x900 light and dark - Progress verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/progress');
    await page.waitForLoadState('networkidle');

    // 1. Heading
    await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible();

    // 2. Tabs: Streak | Stats | Practice
    const streakTab = page.getByRole('tab', { name: 'Streak' });
    const statsTab = page.getByRole('tab', { name: 'Stats' });
    const practiceTab = page.getByRole('tab', { name: 'Practice' });
    await expect(streakTab).toBeVisible();
    await expect(statsTab).toBeVisible();
    await expect(practiceTab).toBeVisible();

    // 3. Tab 1 Streak Content: 3 numbers, this week row, milestone, heatmap, rule note
    await expect(page.getByText('day streak')).toBeVisible();
    await expect(page.getByText('longest streak')).toBeVisible();
    await expect(page.getByText('active days this year')).toBeVisible();
    await expect(page.getByText(/Next milestone: 14 days/i)).toBeVisible();
    await expect(page.getByText('This week')).toBeVisible();

    // Heatmap labels & rules
    await expect(page.locator('.heat')).toBeVisible();
    await expect(page.locator('.heat').getByText('Mon')).toBeVisible();
    await expect(page.locator('.heat').getByText('Wed')).toBeVisible();
    await expect(page.locator('.heat').getByText('Fri')).toBeVisible();
    await expect(page.getByText('Less')).toBeVisible();
    await expect(page.getByText('More')).toBeVisible();
    await expect(page.getByText('25+ focused minutes in a day counts toward your streak.')).toBeVisible();

    // Take Desktop Light Screenshot (Streak tab)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.6-progress-1440x900-light.png', fullPage: false });

    // Switch to Dark Theme & take Desktop Dark Screenshot (Streak tab)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.6-progress-1440x900-dark.png', fullPage: false });

    // 4. Test Tab 2: Stats
    await statsTab.click();
    await expect(page.getByText('this week')).toBeVisible();
    await expect(page.getByText('sessions in 30 days')).toBeVisible();
    await expect(page.getByText('average session')).toBeVisible();
    await expect(page.getByText('LAST 7 DAYS')).toBeVisible();

    // 5. Test Tab 3: Practice
    await practiceTab.click();
    await expect(page.getByText('Mock tests and problems you log')).toBeVisible();
    await expect(page.getByRole('button', { name: /Log practice/i })).toBeVisible();
    await expect(page.getByText('Shortest path in a weighted graph')).toBeVisible();
    await expect(page.getByText("Banker's algorithm safety check")).toBeVisible();
    await expect(page.getByText('Solved')).toBeVisible();
    await expect(page.getByText('Review')).toBeVisible();
  });

  test('mobile 390x844 light and dark - Progress verification', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/progress');
    await page.waitForLoadState('networkidle');

    // Heading
    await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible();

    // Numbers visible on mobile
    await expect(page.getByText('day streak')).toBeVisible();

    // Take Mobile Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.6-progress-390x844-light.png', fullPage: false });

    // Switch to Dark Theme & take Mobile Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.6-progress-390x844-dark.png', fullPage: false });
  });
});
