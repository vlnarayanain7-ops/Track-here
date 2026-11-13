import { test, expect } from '@playwright/test';

test.describe('Step 11.4 Plan Verification', () => {
  test.beforeEach(async ({ page }) => {
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
                _id: 'user_123',
                name: 'Narayana',
                email: 'scholar@example.com',
                ageBand: '18_plus',
                onboardingCompleted: true,
                timezone: 'Asia/Kolkata',
                subjects: [
                  {
                    name: 'Algorithms',
                    color: '#2563EB',
                    chapters: [
                      { name: 'Graphs', status: 'Completed' },
                      { name: 'Dynamic Programming', status: 'Not started' },
                      { name: 'Greedy', status: 'Not started' },
                    ],
                  },
                  {
                    name: 'Operating Systems',
                    color: '#BE185D',
                    chapters: [
                      { name: 'Processes', status: 'Completed' },
                      { name: 'Virtual Memory', status: 'Not started' },
                    ],
                  },
                  {
                    name: 'Maths',
                    color: '#A15207',
                    chapters: [
                      { name: 'Linear Algebra', status: 'Completed' },
                      { name: 'Calculus', status: 'Completed' },
                    ],
                  },
                ],
              },
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

      if (url.includes('/api/timetable')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              slots: [
                { _id: 's1', subject: 'Algorithms', dayOfWeek: 1, startTime: '09:00', endTime: '10:30' },
                { _id: 's2', subject: 'Maths', dayOfWeek: 5, startTime: '14:00', endTime: '16:00' },
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

  test('desktop 1440x900 light and dark', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plan');

    // 1. Plan Title & Tabs
    await expect(page.getByRole('heading', { level: 1, name: 'Plan' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Week' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Subjects' })).toBeVisible();

    // 2. Tasks tab elements: inline add input & groups
    await expect(page.getByPlaceholder('Add a task and press Enter')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible();
    await expect(page.getByText('Solve 5 graph problems')).toBeVisible();

    // 3. Week tab verification
    await page.getByRole('tab', { name: 'Week' }).click();
    await expect(page.locator('.wk')).toBeVisible();
    await expect(page.locator('.col.td')).toBeVisible(); // Today tinted
    await expect(page.getByText('Algorithms').first()).toBeVisible();

    // 4. Subjects tab verification
    await page.getByRole('tab', { name: 'Subjects' }).click();
    await expect(page.getByText(/Subjects you create appear everywhere else/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add subject' })).toBeVisible();
    await expect(page.getByText(/1 of 3 chapters/i)).toBeVisible(); // Plural helper verified!

    // Return to Tasks for clean screenshots
    await page.getByRole('tab', { name: 'Tasks' }).click();

    // Take Desktop Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.4-plan-1440x900-light.png', fullPage: false });

    // Switch to Dark Theme & take Desktop Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.4-plan-1440x900-dark.png', fullPage: false });
  });

  test('mobile 390x844 light and dark', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plan');

    await expect(page.getByRole('heading', { level: 1, name: 'Plan' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByPlaceholder('Add a task and press Enter')).toBeVisible();

    // Take Mobile Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.4-plan-390x844-light.png', fullPage: false });

    // Switch to Dark Theme & take Mobile Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.4-plan-390x844-dark.png', fullPage: false });
  });
});

