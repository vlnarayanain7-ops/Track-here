import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Step 11.1 Shell Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Single consolidated route handler to eliminate any Playwright route ordering issues
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/auth/csrf')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { csrfToken: 'mock-csrf-token' } }),
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

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
  });

  test('desktop 1440x900 light and dark', async ({ page }) => {
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('request', (req) => console.log('REQ:', req.method(), req.url()));
    page.on('response', (res) => console.log('RES:', res.status(), res.url()));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    console.log('FINAL URL:', page.url());

    // Ensure page shell has loaded
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(page.getByText('Track Here').first()).toBeVisible();

    // Verify 5 navigation items in sidebar
    await expect(sidebar.getByRole('link', { name: 'Today', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Focus', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Plan', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Notes', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Progress', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();

    // Ensure NO streak card, NO user card, NO feedback in sidebar
    await expect(sidebar.getByText('day streak')).toHaveCount(0);
    await expect(sidebar.getByText('Send Feedback')).toHaveCount(0);

    // Verify Header right-aligned elements
    const header = page.locator('header');
    await expect(header.locator('button[aria-label*="Search"]')).toBeVisible();
    await expect(header.locator('.chipst, a[title*="streak"]')).toBeVisible();
    await expect(header.locator('.btn-add')).toBeVisible();
    await expect(header.locator('.av, button[aria-label*="Account"]')).toBeVisible();

    // Take Desktop Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.1-shell-1440x900-light.png', fullPage: false });

    // Switch to Dark Theme & take Desktop Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.1-shell-1440x900-dark.png', fullPage: false });
  });

  test('mobile 390x844 light and dark', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // In mobile, sidebar must be hidden, bottom tab bar must be visible
    await expect(page.locator('aside.sidebar')).toBeHidden();
    const tabbar = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(tabbar).toBeVisible();

    // Verify the same 5 tabs on mobile
    await expect(tabbar.getByRole('link', { name: 'Today' })).toBeVisible();
    await expect(tabbar.getByRole('link', { name: 'Focus' })).toBeVisible();
    await expect(tabbar.getByRole('link', { name: 'Plan' })).toBeVisible();
    await expect(tabbar.getByRole('link', { name: 'Notes' })).toBeVisible();
    await expect(tabbar.getByRole('link', { name: 'Progress' })).toBeVisible();

    // Take Mobile Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.1-shell-390x844-light.png', fullPage: false });

    // Switch to Dark Theme & take Mobile Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.1-shell-390x844-dark.png', fullPage: false });
  });
});
