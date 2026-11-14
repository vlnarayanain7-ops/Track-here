import { test, expect } from '@playwright/test';

test.describe('Step 11.2 Today Page Verification with Calendar & Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      // Only intercept backend API calls, NOT frontend /src/api/*.js files!
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
              today: { studyMinutes: 25 },
              streaks: { currentStreak: 12, longestStreak: 21 },
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
                { _id: 't1', title: 'Solve 5 graph problems', subject: 'Algorithms', status: 'Todo' },
                { _id: 't2', title: 'Revise scheduling algorithms', subject: 'Operating Systems', status: 'Todo' },
                { _id: 't3', title: 'Plan the day', subject: 'Maths', status: 'Completed' },
              ],
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
                { _id: 'r1', topic: 'Binary Search Trees', subject: 'Algorithms', status: 'pending' },
                { _id: 'r2', topic: 'Virtual Memory & Paging', subject: 'Operating Systems', status: 'pending' },
              ],
            },
          }),
        });
      }

      if (url.includes('/api/timetable')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              slots: [
                { _id: 's1', dayOfWeek: new Date().getDay(), subject: 'Maths', startTime: '14:00', endTime: '16:00' },
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

  test('desktop 1440x900 light and dark with calendar & reminders', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // 1. Header greeting & quiet buttons
    await expect(page.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Narayana/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Morning plan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Evening review' })).toBeVisible();

    // 2. Important Details & Reminders: Target Exam & Today's Focus
    await expect(page.getByText('Target Exam')).toBeVisible();
    await expect(page.getByText('JEE Advanced')).toBeVisible();
    await expect(page.getByText("Today's Focus & Alerts")).toBeVisible();
    await expect(page.getByText(/Solve 5 graph problems/i).first()).toBeVisible();

    // 3. Week Calendar Strip
    await expect(page.getByText(/Full week/i)).toBeVisible();

    // 4. Up next card with ONE Start focus button
    await expect(page.getByText('UP NEXT')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Solve 5 graph problems' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start focus' })).toBeVisible();

    // 5. Thin progress line
    await expect(page.getByText(/Today 25m of 4h/i)).toBeVisible();

    // 6. Today merged list
    await expect(page.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible();
    await expect(page.getByText('Revise scheduling algorithms')).toBeVisible();
    await expect(page.getByText('Maths').first()).toBeVisible();

    // 7. Quiet review line (2 reviews due)
    await expect(page.getByText(/2 reviews due/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start review' })).toBeVisible();

    // Take Desktop Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.2-today-1440x900-light.png', fullPage: false });

    // Switch to Dark Theme & take Desktop Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.2-today-1440x900-dark.png', fullPage: false });
  });

  test('mobile 390x844 light and dark with calendar & reminders', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening)/i })).toBeVisible();
    await expect(page.getByText('Target Exam')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start focus' })).toBeVisible();

    // Take Mobile Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.2-today-390x844-light.png', fullPage: false });

    // Switch to Dark Theme & take Mobile Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.2-today-390x844-dark.png', fullPage: false });
  });
});
