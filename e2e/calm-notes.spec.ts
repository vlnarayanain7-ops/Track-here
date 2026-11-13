import { test, expect } from '@playwright/test';

test.describe('Step 11.5 Notes Verification', () => {
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
                  { name: 'Algorithms', color: '#2563EB' },
                  { name: 'Operating Systems', color: '#BE185D' },
                ],
              },
            },
          }),
        });
      }

      if (url.includes('/api/notes')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notes: [
                {
                  _id: 'n1',
                  title: "Dijkstra's algorithm",
                  contentMarkdown: 'Always expand the closest unvisited node, then relax its edges.\n\n- Non-negative weights only\n- Binary heap: O((V + E) log V)',
                  folder: 'Algorithms',
                  pinned: true,
                  updatedAt: new Date().toISOString(),
                },
                {
                  _id: 'n2',
                  title: 'Paging and TLB',
                  contentMarkdown: 'Translation Lookaside Buffer caches virtual to physical page translations.',
                  folder: 'Operating Systems',
                  pinned: false,
                  updatedAt: new Date(Date.now() - 864e5).toISOString(),
                },
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
    await page.goto('/notes');

    // 1. Header: Title + single primary button
    await expect(page.getByRole('heading', { level: 1, name: 'Notes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New note' })).toBeVisible();

    // 2. Two columns: 220px list + editor
    await expect(page.locator('.notes')).toBeVisible();
    await expect(page.locator('.nl')).toBeVisible();
    await expect(page.getByText("Dijkstra's algorithm").first()).toBeVisible();
    await expect(page.getByText('Paging and TLB')).toBeVisible();

    // 3. Subject filter dropdown in list header
    await expect(page.locator('select')).toBeVisible();

    // 4. Editor title and body
    const titleInput = page.getByPlaceholder('Note title');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue("Dijkstra's algorithm");

    const bodyTextarea = page.getByPlaceholder(/Write your note here/i);
    await expect(bodyTextarea).toBeVisible();

    // 5. Tools appear on focus
    await bodyTextarea.focus();
    await expect(page.locator('.tools')).toBeVisible();

    // 6. Saved text indicator
    await expect(page.getByTestId('desktop-saved-indicator')).toBeVisible();

    // Take Desktop Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.5-notes-1440x900-light.png', fullPage: false });

    // Switch to Dark Theme & take Desktop Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.5-notes-1440x900-dark.png', fullPage: false });
  });

  test('mobile 390x844 light and dark', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/notes');

    // On mobile: list first
    await expect(page.getByText("Dijkstra's algorithm").first()).toBeVisible();

    // Take Mobile Light Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('th-theme', 'light');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.5-notes-390x844-light.png', fullPage: false });

    // Switch to Dark Theme & take Mobile Dark Screenshot
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('th-theme', 'dark');
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/11.5-notes-390x844-dark.png', fullPage: false });
  });
});
