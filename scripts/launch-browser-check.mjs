import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Real browser/UI with deterministic API fixtures; never writes to production.
const root = path.resolve('client/dist');
const server = createServer(async (req, res) => {
  try {
    let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) file = path.join(root, 'index.html');
    try { if (!(await stat(file)).isFile()) file = path.join(root, 'index.html'); }
    catch { file = path.join(root, 'index.html'); }
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
await mkdir('.qa-artifacts', { recursive: true });
try {
  const context = await browser.newContext({ recordVideo: { dir: '.qa-artifacts', size: { width: 390, height: 844 } }, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let slowRead;
  let loggedIn = false;
  let offline = false;
  let resetFails = false;
  let resetBody;
  let passwordBody;
  let user = { _id: 'launch-student', name: 'Launch Student', email: 'student@example.com', ageBand: '18_plus', termsVersion: '2026-11-20', subjects: [], dailyStudyGoal: 120 };
  const sessions = [];
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.startsWith('/socket.io')) return route.abort();
    if (!url.pathname.startsWith('/api/')) {
      if (url.origin !== base) return route.abort();
      return route.continue();
    }
    if (offline) return route.abort();
    let data = {};
    let status = 200;
    const body = () => request.postDataJSON();
    const endpoint = url.pathname.slice(4);
    if (endpoint === '/study-sessions' && request.method() === 'GET') await slowRead;
    if (endpoint === '/auth/session') data = { user: loggedIn ? user : null, canRefresh: false, csrfToken: 'test-csrf' };
    else if (endpoint === '/auth/csrf') data = { csrfToken: 'test-csrf' };
    else if (['/auth/register', '/auth/login'].includes(endpoint)) { loggedIn = true; data = { user }; }
    else if (endpoint === '/auth/logout') loggedIn = false;
    else if (endpoint === '/auth/me') data = { user };
    else if (endpoint === '/auth/forgot-password') { resetBody = body(); status = resetFails ? 503 : 200; }
    else if (endpoint.startsWith('/auth/reset-password/')) passwordBody = body();
    else if (endpoint === '/users/profile' && request.method() === 'PUT') { user = { ...user, ...body() }; data = { user }; }
    else if (endpoint === '/study-sessions') {
      if (request.method() === 'POST') {
        const item = body();
        if (!sessions.some(s => s.clientId === item.clientId)) sessions.push({ ...item, _id: `session-${sessions.length + 1}` });
        data = { session: sessions.at(-1) };
      } else data = { sessions, pagination: { total: sessions.length, pages: 1, page: 1 } };
    } else if (endpoint.includes('analytics')) data = { today: { studyMinutes: sessions.reduce((n, s) => n + s.focusDuration, 0) }, heatmap: [], weeklyData: [], categoryBreakdown: [], currentStreak: 0 };
    else if (endpoint === '/tasks') data = { tasks: [] };
    else if (endpoint === '/revisions') data = [];
    else if (endpoint.includes('daily-plans')) data = { plan: null };
    else if (endpoint.includes('daily-reviews')) data = { review: null };
    else if (endpoint === '/problems') data = { problems: [] };
    else if (endpoint === '/mock-tests') data = { mockTests: [] };
    await route.fulfill({ status, contentType: 'application/json', headers: { 'Set-Cookie': 'csrfToken=test-csrf; Path=/' }, body: JSON.stringify(endpoint === '/revisions' ? data : { success: status === 200, data }) });
  });
  await page.goto(`${base}/forgot-password`);
  await page.getByLabel('Account email').fill('student@example.com');
  resetFails = true;
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('We could not request a reset email right now.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  resetFails = false;
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('Please check your inbox and spam folder.', { exact: false })).toBeVisible();
  expect(resetBody).toEqual({ email: 'student@example.com' });
  await page.goto(`${base}/reset-password/test-token`);
  await page.getByLabel('New password', { exact: true }).fill('LaunchTest123!');
  await page.getByLabel('Confirm new password').fill('LaunchTest123!');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page).toHaveURL(/\/signin$/);
  expect(passwordBody).toEqual({ password: 'LaunchTest123!' });
  console.log('PASS: reset request/replacement payloads and visible service failure');

  await page.goto(`${base}/signup`);
  await page.getByLabel('Full name').fill(user.name);
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel(/^Password/).fill('LaunchTest123!');
  await page.getByLabel('18 or older').check();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account', exact: false }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'End tour' }).click();
  const mobileNav = page.getByRole('navigation', { name: 'Mobile Navigation' });
  let releaseSlowRead;
  slowRead = new Promise(resolve => { releaseSlowRead = resolve; });
  try {
    for (const [name, pathname] of [['Focus', '/study'], ['Notes', '/notes'], ['Plan', '/plan'], ['Progress', '/progress'], ['Today', '/']]) {
      const tab = mobileNav.getByRole('link', { name, exact: true });
      await tab.tap();
      await expect(tab).toHaveAttribute('aria-current', 'page');
      await expect(page).toHaveURL(base + pathname);
      await expect(page.getByRole('status', { name: 'Loading view' })).toHaveCount(0);
      await expect(page.getByText('Something went wrong in this section')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  } finally {
    releaseSlowRead();
    slowRead = undefined;
  }
  await page.getByRole('link', { name: 'Add your first subject' }).click();
  await page.getByRole('button', { name: 'Add subject', exact: true }).click();
  await page.getByPlaceholder('Subject name (e.g. Algorithms)').fill('Physics');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => user.subjects.length).toBe(1);
  await page.goto(base);
  await page.screenshot({ path: '.qa-artifacts/mobile-first-session.png', fullPage: true });
  await page.getByRole('link', { name: 'Start your first study session' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.reload();
  await expect(page.getByTitle('Pause (Press Space)', { exact: true })).toBeVisible();
  await page.clock.install();
  await page.clock.fastForward(65_000);
  offline = true;
  await context.setOffline(true);
  await page.getByTitle('Finish session (Press S)', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sync status: Offline' })).toBeVisible();
  expect(sessions).toHaveLength(0);
  offline = false;
  await context.setOffline(false);
  await page.clock.resume();
  await expect.poll(() => sessions.length).toBe(1);
  await expect(page.getByRole('button', { name: 'Sync status: Synced' })).toBeVisible();
  expect(sessions[0].durationSec).toBeGreaterThanOrEqual(60);
  expect(sessions[0].category).toBe('Physics');
  await page.goto(base);
  await expect(page.getByRole('heading', { name: 'Make a little progress today.' })).toHaveCount(0);
  await expect(page.locator('.today-goal-value')).toContainText(`${sessions[0].focusDuration}m`);
  await page.getByRole('link', { name: 'View activity' }).click();
  await expect(page).toHaveURL(/\/progress/);
  await page.screenshot({ path: '.qa-artifacts/mobile-progress.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto(`${base}/study`);
  await expect(page.getByText(sessions[0].topic, { exact: true }).first()).toBeVisible();
  console.log('PASS: mobile signup, first subject, timer reload, offline save/reconnect, history and progress navigation');
  // A restored server session must retain history on a fresh browser load.
  await page.reload();
  await expect(page.getByText(sessions[0].topic, { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/signin$/);
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.locator('input[autocomplete="current-password"]').fill('LaunchTest123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/signin$/);
  await page.goto(`${base}/study`);
  await expect(page.getByText(sessions[0].topic, { exact: true }).first()).toBeVisible();
  expect(sessions).toHaveLength(1);
  expect(errors).toEqual([]);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://track-here.beta-001.workers.dev/social-preview.png');
  const preview = await context.request.get(`${base}/social-preview.png`);
  expect(preview.headers()['content-type']).toBe('image/png');
  const png = await preview.body();
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  console.log('PASS: session restoration, no duplicate saves, no uncaught browser errors');
  const video = page.video();
  await context.close();
  await video.saveAs('.qa-artifacts/mobile-workflow.webm');
  await video.delete();
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
