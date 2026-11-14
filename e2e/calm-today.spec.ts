import { test, expect } from '@playwright/test';

test.describe('Step 12.1 Today Foundations Verification', () => {
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
                examName: 'JEE Advanced',
                examDate: '2027-05-24',
                subjects: [
                  { name: 'Algorithms', color: '#2563EB' },
                  { name: 'Operating Systems', color: '#BE185D' },
                  { name: 'Maths', color: '#A15207' },
                ],
              },
            },
          }),
        });
      }

      if (url.includes('/api/daily-plans')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            plan: {
              intentions: 'Solve 5 graph problems & complete daily review',
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
              today: { studyMinutes: 25, focusMinutes: 25, tasksCompleted: 2 },
              streak: { currentStreak: 12, longestStreak: 21 },
            },
          }),
        });
      }

      if (url.includes('/api/revisions')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              revisions: [
                { _id: 'rev_1', topic: 'Dijkstra', status: 'pending' },
                { _id: 'rev_2', topic: 'Paging & TLB', status: 'pending' },
              ],
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
                { _id: 't_1', title: 'Solve 5 graph problems', subject: 'Algorithms', status: 'Todo' },
                { _id: 't_2', title: 'Revise scheduling algorithms', subject: 'Operating Systems', status: 'Todo' },
                { _id: 't_3', title: 'Plan the day', subject: 'Maths', status: 'Completed' },
              ],
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
  });

  test('desktop 1440x900 light and dark: strictly calm foundations', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // 1. Greeting
    await expect(page.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening)/i })).toBeVisible();

    // 2. ONE quiet journal button
    const journalBtn = page.getByRole('button', { name: /Morning plan|Evening review|Journal/i });
    await expect(journalBtn).toBeVisible();

    // 3. REMOVAL ASSERTIONS: "Target exam" card, "Today's focus & alerts" card, and week strip must NOT be visible
    await expect(page.getByText('Target Exam')).not.toBeVisible();
    await expect(page.getByText(/Today's Focus & Alerts/i)).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous week' })).not.toBeVisible();

    // 4. "UP NEXT" card with ONE primary Start focus button
    await expect(page.getByText('UP NEXT')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Solve 5 graph problems' })).toBeVisible();
    const startFocusBtn = page.getByRole('button', { name: 'Start focus' });
    await expect(startFocusBtn).toBeVisible();

    // 5. One thin progress line
    await expect(page.getByText(/Today 25m of 4h/i)).toBeVisible();

    // 6. Today list with inline add
    await expect(page.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible();
    await expect(page.getByText('Revise scheduling algorithms')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add task' })).toBeVisible();

    // 7. Quiet review line (2 reviews due)
    await expect(page.getByText(/2 reviews due/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start review' })).toBeVisible();

    // 8. Enforce 960px width
    const mainEl = page.locator('main.page');
    await expect(mainEl).toHaveCSS('max-width', '960px');

    // Take Desktop Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/12.1-today-1440x900-light.png', fullPage: false });

    // Switch to Dark Theme & take Desktop Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/12.1-today-1440x900-dark.png', fullPage: false });
  });

  test('mobile 390x844 light and dark: strictly calm foundations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening)/i })).toBeVisible();
    await expect(page.getByText('Target Exam')).not.toBeVisible();
    await expect(page.getByText(/Today's Focus & Alerts/i)).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Start focus' })).toBeVisible();

    // Take Mobile Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/12.1-today-390x844-light.png', fullPage: false });

    // Switch to Dark Theme & take Mobile Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/12.1-today-390x844-dark.png', fullPage: false });
  });
});
