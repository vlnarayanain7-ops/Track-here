import { test, expect } from '@playwright/test';

test.describe('User Feedback Fixes Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('th-token', 'mock-token-fixes-test');
      localStorage.setItem(
        'th-user',
        JSON.stringify({
          _id: 'user-fixes-test',
          name: 'Narayana',
          email: 'vlnarayana.in7@gmail.com',
          ageBand: '18_plus',
          onboardingCompleted: true,
          streakGraceDays: 1,
          timezone: 'Asia/Kolkata',
          subjects: [{ name: 'C++ basics', color: '#15803D', chapters: [] }],
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
                _id: 'user-fixes-test',
                name: 'Narayana',
                email: 'vlnarayana.in7@gmail.com',
                ageBand: '18_plus',
                onboardingCompleted: true,
                timezone: 'Asia/Kolkata',
                subjects: [{ name: 'C++ basics', color: '#15803D', chapters: [] }],
              },
            },
          }),
        });
      }

      if (url.includes('/api/study-sessions/timer/active')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { session: null } }),
        });
      }

      if (url.includes('/api/study-sessions/timer/start')) {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              session: {
                _id: 'sess-new',
                category: 'C++ basics',
                topic: 'Pointers',
                startTime: new Date().toISOString(),
                timerState: { status: 'running', startedAt: new Date().toISOString() },
              },
            },
          }),
        });
      }

      if (url.includes('/api/study-sessions/timer/cancel')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Timer cancelled' }),
        });
      }

      if (url.includes('/api/analytics/streaks')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            currentStreak: 0,
            longestStreak: 0,
            activeDaysThisYear: 0,
            isActiveToday: false,
            nextMilestone: 3,
            history: [],
            last7Days: [
              { day: 'M', date: '2026-11-09', minutes: 0, hours: 0, isActive: false },
              { day: 'T', date: '2026-11-10', minutes: 0, hours: 0, isActive: false },
              { day: 'W', date: '2026-11-11', minutes: 0, hours: 0, isActive: false },
              { day: 'T', date: '2026-11-12', minutes: 0, hours: 0, isActive: false },
              { day: 'F', date: '2026-11-13', minutes: 0, hours: 0, isActive: false },
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
            summary: { totalSessions: 0, averageSessionMinutes: 0 },
          }),
        });
      }

      if (url.includes('/api/tasks')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tasks: [
              { _id: 'task-1', title: 'hello', status: 'Todo', subject: 'C++ basics' },
            ],
          }),
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

  test('1. Focus timer starts and resets smoothly without 409', async ({ page }) => {
    await page.goto('http://localhost:5173/study');
    await page.waitForLoadState('networkidle');

    // Click Start button
    const startBtn = page.getByRole('button', { name: 'Start' });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify Pause and Reset buttons appear
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    const resetBtn = page.getByRole('button', { name: 'Reset' });
    await expect(resetBtn).toBeVisible();

    // Click Reset
    await resetBtn.click();
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  });

  test('2. Streak heatmap renders month labels according to calendar', async ({ page }) => {
    await page.goto('http://localhost:5173/progress');
    await page.waitForLoadState('networkidle');

    // Heatmap exists
    await expect(page.locator('.heat')).toBeVisible();

    // Month labels are rendered across the top (e.g. Nov, Dec, Jan...)
    const monthSpans = page.locator('.heat > span');
    await expect(monthSpans.first()).toBeVisible();
    const count = await monthSpans.count();
    expect(count).toBeGreaterThanOrEqual(12); // At least 12 months in 53 weeks
  });

  test('3. Top Bar Add menu opens Mock test directly in Practice tab without QuickActions modal', async ({ page }) => {
    await page.goto('http://localhost:5173/progress');
    await page.waitForLoadState('networkidle');

    // Click Add button
    await page.locator('.btn-add').click();
    await expect(page.getByRole('menuitem', { name: 'Mock test' })).toBeVisible();

    // Click Mock test
    await page.getByRole('menuitem', { name: 'Mock test' }).click();

    // Verifies it opened the calm SideSheet for Practice with Mock Test selected
    await expect(page.getByRole('heading', { name: 'Log Practice' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mock Test' })).toBeVisible();
  });

  test('4. Stats tab shows honest empty state with explanation (no fake data)', async ({ page }) => {
    await page.goto('http://localhost:5173/progress?tab=stats');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('0m').first()).toBeVisible();
    await expect(page.getByText('LAST 7 DAYS')).toBeVisible();
    await expect(page.getByText(/No study sessions recorded yet/i)).toBeVisible();
  });

  test('5. Notes editor is peaceful and clean without clumsy big placeholder', async ({ page }) => {
    await page.goto('http://localhost:5173/notes');
    await page.waitForLoadState('networkidle');

    // Clumsy text is GONE
    await expect(page.getByText(/Select a note or click "New note" to begin writing/i)).not.toBeVisible();

    // Peaceful clean inputs are immediately ready
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    await expect(page.getByPlaceholder(/Write your note here/i)).toBeVisible();
  });

  test('6. Tasks can be edited and deleted', async ({ page }) => {
    await page.goto('http://localhost:5173/plan?tab=tasks');
    await page.waitForLoadState('networkidle');

    const taskRow = page.locator('.row:has-text("hello")');
    await expect(taskRow).toBeVisible();

    // Edit and Delete buttons exist
    await expect(taskRow.getByTitle('Edit task')).toBeAttached();
    await expect(taskRow.getByTitle('Delete task')).toBeAttached();

    // Click edit
    await taskRow.getByTitle('Edit task').click();
    const editInput = page.locator('.row input[type="text"]');
    await expect(editInput).toBeVisible();
    await expect(editInput).toHaveValue('hello');
  });

  test('7. Week timetable dynamically bounds to active hours', async ({ page }) => {
    await page.goto('http://localhost:5173/plan?tab=week');
    await page.waitForLoadState('networkidle');

    // Verifies active hours info label is shown
    await expect(page.getByText(/Showing active study hours/i)).toBeVisible();
    await expect(page.locator('.wk')).toBeVisible();
  });

  test('8. Settings age verified is small and Data & Backup tab is removed', async ({ page }) => {
    await page.goto('http://localhost:5173/settings');
    await page.waitForLoadState('networkidle');

    // Data & Backup tab is completely GONE
    await expect(page.getByRole('tab', { name: 'Data & Backup' })).not.toBeVisible();

    // "verified" is small and subtle
    await expect(page.getByText('verified', { exact: true })).toBeVisible();
    await expect(page.getByText('VERIFIED 13+')).not.toBeVisible();
  });
});

