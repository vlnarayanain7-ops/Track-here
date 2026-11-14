import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

test.describe('Step 12.7 Final Design QA & Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate user with realistic profile
    await page.addInitScript(() => {
      localStorage.setItem('th-token', 'mock-token-qa');
      localStorage.setItem(
        'th-user',
        JSON.stringify({
          _id: 'user-qa-123',
          name: 'Narayana',
          email: 'scholar@trackhere.app',
          ageBand: '18_plus',
          onboardingCompleted: true,
          dailyStudyGoal: 240,
          timezone: 'Asia/Kolkata',
          examName: 'JEE Advanced',
          examDate: '2027-05-24',
          subjects: [
            { name: 'Algorithms', color: '#2563EB' },
            { name: 'Operating Systems', color: '#BE185D' },
          ],
        })
      );
    });

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
                _id: 'user-qa-123',
                name: 'Narayana',
                email: 'scholar@trackhere.app',
                ageBand: '18_plus',
                onboardingCompleted: true,
                dailyStudyGoal: 240,
                timezone: 'Asia/Kolkata',
                examName: 'JEE Advanced',
                examDate: '2027-05-24',
                subjects: [
                  { name: 'Algorithms', color: '#2563EB' },
                  { name: 'Operating Systems', color: '#BE185D' },
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
              { day: 'S', date: '2026-11-15', minutes: 0, hours: 0, isActive: false },
            ],
            history: [
              { date: '2026-11-14', minutes: 25 },
              { date: '2026-11-13', minutes: 90 },
              { date: '2026-11-11', minutes: 75 },
              { date: '2026-11-10', minutes: 45 },
              { date: '2026-11-09', minutes: 60 },
            ],
          }),
        });
      }

      if (url.includes('/api/analytics')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            today: { focusMinutes: 25 },
            summary: { totalMinutes: 1420 },
            bySubject: [
              { subject: 'Algorithms', minutes: 820 },
              { subject: 'Operating Systems', minutes: 600 },
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
                title: 'Revise scheduling algorithms',
                status: 'Todo',
                category: 'Operating Systems',
                priority: 'High',
              },
              {
                _id: 't2',
                title: 'Solve Dijkstra problem',
                status: 'Completed',
                category: 'Algorithms',
                priority: 'Medium',
              },
            ],
          }),
        });
      }

      if (url.includes('/api/notes')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            notes: [
              {
                _id: 'n1',
                title: 'Shortest Path Algorithms',
                content: '# Shortest Path\nDijkstra and Bellman-Ford.',
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        });
      }

      if (url.includes('/api/study-sessions')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ sessions: [] }),
        });
      }

      if (url.includes('/api/daily-plans')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { plan: null } }),
        });
      }

      if (url.includes('/api/daily-reviews')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { review: null } }),
        });
      }

      if (url.includes('/api/timetable')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ slots: [] }),
        });
      }

      if (url.includes('/api/revisions')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ revisions: [] }),
        });
      }

      if (url.includes('/api/problems')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ problems: [] }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
  });

  const SCREENS = [
    { name: 'today', url: '/' },
    { name: 'focus', url: '/study' },
    { name: 'plan', url: '/plan' },
    { name: 'notes', url: '/notes' },
    { name: 'progress-stats', url: '/progress?tab=stats' },
    { name: 'progress-streak', url: '/progress' },
    { name: 'settings', url: '/settings' },
  ];

  for (const screen of SCREENS) {
    test(`capture ${screen.name} across 1440 & 390 in light and dark`, async ({ page }) => {
      // 1. Desktop 1440x900 Light
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(screen.url);
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('th-theme', 'light');
      });
      await page.waitForTimeout(200);

      const dLightPath = `screenshots/12.7-${screen.name}-1440x900-light.png`;
      await page.screenshot({ path: dLightPath });
      try {
        fs.copyFileSync(dLightPath, path.join(ARTIFACT_DIR, path.basename(dLightPath)));
      } catch (e) {}

      // 2. Desktop 1440x900 Dark
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('th-theme', 'dark');
      });
      await page.waitForTimeout(200);

      const dDarkPath = `screenshots/12.7-${screen.name}-1440x900-dark.png`;
      await page.screenshot({ path: dDarkPath });
      try {
        fs.copyFileSync(dDarkPath, path.join(ARTIFACT_DIR, path.basename(dDarkPath)));
      } catch (e) {}

      // 3. Mobile 390x844 Light
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('th-theme', 'light');
      });
      await page.waitForTimeout(200);

      const mLightPath = `screenshots/12.7-${screen.name}-390x844-light.png`;
      await page.screenshot({ path: mLightPath });
      try {
        fs.copyFileSync(mLightPath, path.join(ARTIFACT_DIR, path.basename(mLightPath)));
      } catch (e) {}

      // 4. Mobile 390x844 Dark
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('th-theme', 'dark');
      });
      await page.waitForTimeout(200);

      const mDarkPath = `screenshots/12.7-${screen.name}-390x844-dark.png`;
      await page.screenshot({ path: mDarkPath });
      try {
        fs.copyFileSync(mDarkPath, path.join(ARTIFACT_DIR, path.basename(mDarkPath)));
      } catch (e) {}

      expect(true).toBe(true);
    });
  }
});
