import { test, expect, Page } from '@playwright/test';

const ROUTES = [
  '/',
  '/study',
  '/plan',
  '/plan?tab=week',
  '/plan?tab=subjects',
  '/notes',
  '/progress',
  '/progress?tab=stats',
  '/progress?tab=practice',
  '/settings',
];

const OLD = [
  '/timetable',
  '/subjects',
  '/streaks',
  '/analytics',
  '/practice',
  '/revisions',
  '/accountability',
];

test.describe('Route Crawl & Redirect Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user with valid profile
    await page.addInitScript(() => {
      localStorage.setItem('th-token', 'mock-token-crawl-test');
      localStorage.setItem(
        'th-user',
        JSON.stringify({
          _id: 'user-crawl-123',
          name: 'Calm Scholar',
          email: 'scholar@trackhere.app',
          ageBand: '18_plus',
          onboardingCompleted: true,
          streakGraceDays: 1,
          timezone: 'Asia/Kolkata',
          subjects: [
            { name: 'Algorithms', color: '#2563EB', chapters: [{ name: 'Graphs', status: 'Completed' }] },
          ],
        })
      );
    });

    // Mock backend responses
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
                _id: 'user-crawl-123',
                name: 'Calm Scholar',
                email: 'scholar@trackhere.app',
                ageBand: '18_plus',
                onboardingCompleted: true,
                timezone: 'Asia/Kolkata',
                subjects: [
                  { name: 'Algorithms', color: '#2563EB', chapters: [{ name: 'Graphs', status: 'Completed' }] },
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
            currentStreak: 12,
            longestStreak: 21,
            activeDaysThisYear: 134,
            isActiveToday: true,
            nextMilestone: 14,
            history: [],
            last7Days: [
              { day: 'M', date: '2026-11-09', minutes: 60, hours: 1, isActive: true },
              { day: 'T', date: '2026-11-10', minutes: 60, hours: 1, isActive: true },
              { day: 'W', date: '2026-11-11', minutes: 60, hours: 1, isActive: true },
              { day: 'T', date: '2026-11-12', minutes: 0, hours: 0, isActive: false },
              { day: 'F', date: '2026-11-13', minutes: 45, hours: 0.75, isActive: true },
              { day: 'S', date: '2026-11-14', minutes: 0, hours: 0, isActive: false },
              { day: 'S', date: '2026-11-15', minutes: 0, hours: 0, isActive: false },
            ],
          }),
        });
      }

      if (url.includes('/api/analytics')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            today: { focusMinutes: 45 },
            summary: { totalSessions: 41, averageSessionMinutes: 60 },
          }),
        });
      }

      if (url.includes('/api/tasks')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tasks: [] }),
        });
      }

      if (url.includes('/api/notes')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ notes: [] }),
        });
      }

      if (url.includes('/api/problems')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ problems: [] }),
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
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
  });

  test('all new calm routes open without errors and render heading', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    for (const r of ROUTES) {
      await page.goto(r);
      await page.waitForLoadState('networkidle');
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('all legacy routes redirect and render a visible heading', async ({ page }) => {
    for (const oldRoute of OLD) {
      await page.goto(oldRoute);
      await page.waitForLoadState('networkidle');

      // Verify the URL changed from the old route
      expect(page.url()).not.toContain(oldRoute);

      // Verify a heading rendered
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible();
    }
  });

  test('every desktop sidebar link navigates properly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const expectedDestinations = [
      { name: 'Today', pathRegex: /\/$/ },
      { name: 'Focus', pathRegex: /\/study/ },
      { name: 'Plan', pathRegex: /\/plan/ },
      { name: 'Notes', pathRegex: /\/notes/ },
      { name: 'Progress', pathRegex: /\/progress/ },
      { name: 'Settings', pathRegex: /\/settings/ },
    ];

    for (const item of expectedDestinations) {
      const link = page.locator('aside').getByRole('link', { name: item.name });
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(item.pathRegex);
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('narrow phone width (360px) has no horizontal scroll across all routes', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });

    for (const r of ROUTES) {
      await page.goto(r);
      await page.waitForLoadState('networkidle');
      const hasNoHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1
      );
      expect(hasNoHScroll).toBe(true);
    }
  });
});
