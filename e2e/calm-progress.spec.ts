import { test, expect } from '@playwright/test';

test.describe('Steps 12.4 & 12.5 Progress Stats & LeetCode Heatmap Verification', () => {
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
          subjects: [
            { name: 'Algorithms', color: 'blue' },
            { name: 'Operating Systems', color: 'rose' },
          ],
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
                subjects: [
                  { name: 'Algorithms', color: 'blue' },
                  { name: 'Operating Systems', color: 'rose' },
                ],
              },
            },
          }),
        });
      }

      if (url.includes('/api/analytics/streaks')) {
        const history = [];
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 371);

        for (let i = 0; i < 372; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dateStr = d.toISOString().slice(0, 10);
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
            bySubject: [
              { id: 'Algorithms', name: 'Algorithms', minutes: 320, color: 'blue' },
              { id: 'Operating Systems', name: 'Operating Systems', minutes: 180, color: 'rose' },
            ],
            today: { studyMinutes: 45 },
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
          body: JSON.stringify({ mockTests: [] }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
  });

  test('desktop 1440x900 light and dark - Streak and Stats verification', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/progress');

    // 1. Heading
    await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible();

    // 2. Tabs
    const streakTab = page.getByRole('tab', { name: 'Streak' });
    const statsTab = page.getByRole('tab', { name: 'Stats' });
    await expect(streakTab).toBeVisible();
    await expect(statsTab).toBeVisible();

    // 3. Tab 1 Streak Content: 3 numbers, this week row, LeetCode MonthHeatmap
    await expect(page.getByText('day streak')).toBeVisible();
    await expect(page.getByText('longest streak')).toBeVisible();
    await expect(page.getByText('active days this year')).toBeVisible();
    await expect(page.getByText('This week')).toBeVisible();

    // MonthHeatmap elements
    await expect(page.locator('.mh')).toBeVisible();
    await expect(page.locator('.mh-days')).toBeVisible();
    await expect(page.locator('.mh-scroll')).toBeVisible();
    await expect(page.locator('.leg')).toBeVisible();
    await expect(page.getByText('25+ focused minutes in a day counts toward your streak.')).toBeVisible();

    // Screenshots for Step 12.5 Streak
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.5-streak-1440x900-light.png', fullPage: false });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.5-streak-1440x900-dark.png', fullPage: false });

    // 4. Tab 2 Stats Content: STUDIED total, range switch (week|month|year), single bar chart, by-subject
    await statsTab.click();
    await expect(page.getByText('STUDIED')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Year' })).toBeVisible();

    // Bar chart visible
    await expect(page.locator('.bars')).toBeVisible();

    // By subject bars
    await expect(page.getByRole('heading', { level: 2, name: 'By subject' })).toBeVisible();
    await expect(page.getByText('Algorithms')).toBeVisible();
    await expect(page.getByText('Operating Systems')).toBeVisible();

    // Screenshots for Step 12.4 Stats
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.4-stats-1440x900-light.png', fullPage: false });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.4-stats-1440x900-dark.png', fullPage: false });
  });

  test('mobile 390x844 light and dark - Progress verification', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/progress');

    // Numbers visible on mobile
    await expect(page.getByText('day streak')).toBeVisible();
    await expect(page.locator('.mh')).toBeVisible();

    // Mobile light & dark for 12.5 Streak
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.5-streak-390x844-light.png', fullPage: false });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.5-streak-390x844-dark.png', fullPage: false });

    // Switch to Stats tab on mobile
    await page.getByRole('tab', { name: 'Stats' }).click();
    await expect(page.getByText('STUDIED')).toBeVisible();

    // Mobile light & dark for 12.4 Stats
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.4-stats-390x844-light.png', fullPage: false });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.4-stats-390x844-dark.png', fullPage: false });
  });
});
