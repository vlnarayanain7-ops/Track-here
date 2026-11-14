import { test, expect } from '@playwright/test';

async function login(page) {
  const email = process.env.TEST_EMAIL || 'test_action_user@trackhere.dev';
  const password = process.env.TEST_PASSWORD || 'Password123!';

  await page.goto('/signin');
  await page.waitForLoadState('networkidle');
  if (!page.url().includes('/signin')) return;
  await page.getByLabel('Email').fill(email);
  await page.locator('input#signin-password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/signin'), { timeout: 15000 });
}

const ACTIONS = [
  {
    name: 'note',
    url: /\/api\/notes$/,
    run: async (p) => {
      await p.goto('/notes');
      await p.getByRole('button', { name: /new note/i }).click();
    },
  },
  {
    name: 'task',
    url: /\/api\/tasks$/,
    run: async (p) => {
      await p.goto('/plan');
      await p.getByPlaceholder(/add a task/i).fill(`Action task ${Date.now()}`);
      await p.keyboard.press('Enter');
    },
  },
  {
    name: 'subject',
    url: /\/api\/users\/.*|\/api\/subjects/,
    run: async (p) => {
      await p.goto('/plan?tab=subjects');
      await p.getByRole('button', { name: /add subject/i }).click();
      await p.getByPlaceholder(/subject name/i).fill(`Subject ${Date.now()}`);
      await p.getByRole('button', { name: 'Save', exact: true }).click();
    },
  },
  {
    name: 'session',
    url: /\/api\/study-sessions/,
    run: async (p) => {
      await p.goto('/study');
      await p.getByRole('button', { name: 'Start', exact: true }).click();
      await p.waitForTimeout(1000);
      await p.getByRole('button', { name: 'Finish', exact: true }).click();
    },
  },
  {
    name: 'block',
    url: /\/api\/timetable$/,
    run: async (p) => {
      await p.goto('/plan?tab=week');
      await p.locator('.col').nth(2).click({ position: { x: 20, y: 150 } });
      await p.getByRole('button', { name: 'Save block' }).click();
    },
  },
  {
    name: 'practice',
    url: /\/api\/(problems|mock-tests)$/,
    run: async (p) => {
      await p.goto('/progress?tab=practice');
      await p.getByRole('button', { name: /log practice/i }).click();
      await p.getByPlaceholder(/shortest path in graph/i).fill(`Practice ${Date.now()}`);
      await p.getByRole('button', { name: 'Save Practice' }).click();
    },
  },
  {
    name: 'plan',
    url: /\/api\/daily-plans/,
    run: async (p) => {
      await p.goto('/?journal=morning');
      await p.getByRole('button', { name: 'Save plan' }).click();
    },
  },
  {
    name: 'review',
    url: /\/api\/daily-reviews/,
    run: async (p) => {
      await p.goto('/?journal=evening');
      await p.getByRole('button', { name: 'Save review' }).click();
    },
  },
];

for (const a of ACTIONS) {
  test(`create ${a.name} succeeds`, async ({ page }) => {
    await login(page);
    const wait = page.waitForResponse(
      (r) =>
        a.url.test(r.url()) &&
        ['POST', 'PUT', 'PATCH'].includes(r.request().method())
    );
    await a.run(page);
    const res = await wait;
    expect(res.status(), await res.text()).toBeLessThan(300);
  });
}
