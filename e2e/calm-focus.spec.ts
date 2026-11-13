import { test, expect } from '@playwright/test';

test.describe('Step 11.3 Focus Verification', () => {
  test.beforeEach(async ({ page }) => {
    const today = new Date().toISOString();

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      // Never intercept Vite frontend source modules under /src/
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
                  { name: 'Algorithms', color: '#2563EB' },
                  { name: 'Operating Systems', color: '#BE185D' },
                  { name: 'Maths', color: '#A15207' },
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
            data: { currentStreak: 12, longestStreak: 21, activeDaysThisYear: 134 },
          }),
        });
      }

      if (url.includes('/api/study-sessions/timer/active')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, session: null }),
        });
      }

      if (url.includes('/api/study-sessions') || url.includes('/api/study')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessions: [
                {
                  _id: 'sess_1',
                  topic: 'Dijkstra',
                  category: 'Algorithms',
                  duration: 25,
                  date: today,
                  startTime: today,
                  activityType: 'Problem Solving',
                },
                {
                  _id: 'sess_2',
                  topic: 'Linear algebra',
                  category: 'Maths',
                  duration: 40,
                  date: today,
                  startTime: today,
                  activityType: 'Reading',
                },
              ],
              pagination: { total: 2, page: 1, pages: 1 },
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
    await page.goto('/study');

    // 1. Subject chips: user's own subjects only
    await expect(page.getByRole('button', { name: 'Algorithms' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Operating Systems' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Maths' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Algorithms' })).toHaveClass(/on/);

    // 2. Ring timer with 6px stroke and centered time display
    const ringSvg = page.locator('.timer-ring svg');
    await expect(ringSvg).toBeVisible();
    const circles = ringSvg.locator('circle');
    await expect(circles).toHaveCount(2);
    await expect(circles.first()).toHaveAttribute('stroke-width', '6');
    await expect(page.getByText('00:00')).toBeVisible();
    await expect(page.getByText('of 25 min')).toBeVisible();

    // 3. Action buttons: 1 primary button (Start)
    const startBtn = page.getByRole('button', { name: 'Start', exact: true });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveClass(/btn p lg/);

    // 4. Quiet note line
    await expect(page.getByText(/25 minutes keeps your streak/i)).toBeVisible();
    const addDetailsBtn = page.getByRole('button', { name: 'Add details' });
    await expect(addDetailsBtn).toBeVisible();

    // Expand inline details to verify, then collapse
    await addDetailsBtn.click();
    await expect(page.getByPlaceholder(/e\.g\. Graph Algorithms/i)).toBeVisible();
    await page.getByRole('button', { name: 'Hide details' }).click();

    // 5. Today's sessions list
    await expect(page.getByRole('heading', { level: 2, name: "Today's sessions" })).toBeVisible();
    await expect(page.getByText('Dijkstra')).toBeVisible();
    await expect(page.getByText('Linear algebra')).toBeVisible();
    await expect(page.getByText('25m')).toBeVisible();
    await expect(page.getByText('40m')).toBeVisible();

    // 6. Quiet History link/button opening side sheet
    const historyBtn = page.getByRole('button', { name: 'History' });
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();
    await expect(page.getByText('Focus History')).toBeVisible();
    // Close side sheet
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    // Take Desktop Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.3-focus-1440x900-light.png', fullPage: false });

    // Switch to Dark Theme & take Desktop Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.3-focus-1440x900-dark.png', fullPage: false });
  });

  test('mobile 390x844 light and dark', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/study');

    await expect(page.getByRole('button', { name: 'Algorithms' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    await expect(page.getByText('00:00')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: "Today's sessions" })).toBeVisible();

    // Take Mobile Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.3-focus-390x844-light.png', fullPage: false });

    // Switch to Dark Theme & take Mobile Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.3-focus-390x844-dark.png', fullPage: false });
  });
});
