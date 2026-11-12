import { test, expect, Page } from '@playwright/test';

const ROUTES = [
  '/',
  '/study',
  '/tasks',
  '/timetable',
  '/subjects',
  '/notes',
  '/practice',
  '/streaks',
  '/revisions',
  '/accountability',
  '/analytics',
  '/settings',
];

async function login(page: Page) {
  await page.goto('/signin');
  await page.getByLabel('Email', { exact: true }).fill(process.env.TEST_EMAIL || 'ravi@nmtl.gov.in');
  await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_PASSWORD || 'password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/signin/);
}

test('every page opens without errors', async ({ page }) => {
  await login(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const r of ROUTES) {
    await page.goto(r);
    await expect(page.getByRole('heading').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('every sidebar link navigates', async ({ page }) => {
  await login(page);
  await page.goto('/');
  const hrefs = await page.locator('aside a[href]').evaluateAll((a) => a.map((x) => x.getAttribute('href')!));
  for (const h of hrefs) {
    await page.click(`aside a[href="${h}"]`);
    await expect(page).toHaveURL(h === '/' ? /\/$/ : new RegExp(h.replace('?', '\\?')));
    await expect(page.getByRole('heading').first()).toBeVisible();
  }
});

test('narrow phone width has no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page);
  for (const r of ROUTES) {
    await page.goto(r);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
