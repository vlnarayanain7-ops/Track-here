import { test, expect } from '@playwright/test';

test.describe('Step 12.3 Morning Plan and Evening Review', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/src/api/')) {
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
                _id: 'user_123',
                name: 'Narayana',
                email: 'scholar@example.com',
                ageBand: '18_plus',
                onboardingCompleted: true,
                dailyStudyGoal: 240,
                timezone: 'Asia/Kolkata',
                subjects: [
                  { name: 'Algorithms', color: 'var(--c1)' },
                  { name: 'Operating Systems', color: 'var(--c2)' },
                  { name: 'Maths', color: 'var(--c3)' },
                ],
              },
            },
          }),
        });
      }

      if (url.includes('/api/daily-plans')) {
        if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, plan: { targetHours: 4 } }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, plan: null }),
        });
      }

      if (url.includes('/api/daily-reviews')) {
        if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, review: { mood: 'Great Flow' } }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, review: null }),
        });
      }

      if (url.includes('/api/analytics/streak')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { currentStreak: 12, longestStreak: 21, activeDaysThisYear: 134 },
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
              today: { studyMinutes: 80, focusMinutes: 80 },
              todayReviewDone: false,
            },
          }),
        });
      }

      if (url.includes('/api/tasks')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tasks: [
                {
                  _id: 't_1',
                  title: 'Solve 5 graph problems',
                  subject: 'Algorithms',
                  status: 'Todo',
                },
                {
                  _id: 't_2',
                  title: 'Revise scheduling algorithms',
                  subject: 'Operating Systems',
                  status: 'Completed',
                },
              ],
            },
          }),
        });
      }

      if (url.includes('/api/revisions')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, revisions: [] }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
  });

  test('desktop 1440x900 morning plan side sheet', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?journal=morning');

    // Dialog should be visible
    const sheet = page.getByRole('dialog', { name: 'Morning plan' });
    await expect(sheet).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Morning plan' })).toBeVisible();

    // How long today? chips
    await expect(page.getByText('How long today?')).toBeVisible();
    await expect(page.getByRole('button', { name: '2h' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3h' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4h' })).toBeVisible();
    await expect(page.getByRole('button', { name: '6h' })).toBeVisible();

    // Top 3 inputs
    await expect(page.getByText('Top 3 for today')).toBeVisible();
    await expect(page.getByLabel('Priority 1')).toBeVisible();
    await expect(page.getByLabel('Priority 2')).toBeVisible();
    await expect(page.getByLabel('Priority 3')).toBeVisible();

    // Save button
    await expect(page.getByRole('button', { name: 'Save plan' })).toBeVisible();

    // Light screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.3-morning-1440x900-light.png', fullPage: false });

    // Dark screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.3-morning-1440x900-dark.png', fullPage: false });
  });

  test('mobile 390x844 evening review side sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?journal=evening');

    const sheet = page.getByRole('dialog', { name: 'Evening review' });
    await expect(sheet).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Evening review' })).toBeVisible();

    // Auto-written summary line
    await expect(page.getByText(/You focused 1h 20m and finished 1 task\./i)).toBeVisible();

    // Mood chips
    await expect(page.getByRole('button', { name: 'Great' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Good' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Okay' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tough' })).toBeVisible();

    // Inputs
    await expect(page.getByLabel(/Anything to remember\?/i)).toBeVisible();
    await expect(page.getByLabel(/Tomorrow’s first task/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save review' })).toBeVisible();

    // Light screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.3-evening-390x844-light.png', fullPage: false });

    // Dark screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshots/12.3-evening-390x844-dark.png', fullPage: false });
  });
});
