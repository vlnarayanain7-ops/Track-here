import { chromium, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { preview } from '../client/node_modules/vite/dist/node/index.js';

const requireServer = createRequire(new URL('../server/package.json', import.meta.url));
const { MongoMemoryServer } = requireServer('mongodb-memory-server');
const artifacts = '.qa-artifacts';
await mkdir(artifacts, { recursive: true });
const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
let previewServer, api, browser, context, page;
const results = [];
const errors = [];
let failure;
try {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const target = 'http://127.0.0.1:' + port;
  previewServer = await preview({ configFile: false, root: 'client', preview: { host: '127.0.0.1', port: 0,
    proxy: { '/api': { target }, '/socket.io': { target, ws: true } } } });
  const base = 'http://127.0.0.1:' + previewServer.httpServer.address().port;
  const uri = mongo.getUri('trackhere_qa');
  const { MongoClient, ObjectId } = requireServer('mongodb');
  const adminId = new ObjectId();
  const adminPassword = randomBytes(20).toString('hex');
  const proofImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jq7sAAAAASUVORK5CYII=', 'base64');
  const seed = new MongoClient(uri);
  try {
    const db = seed.db();
    await db.collection('users').insertOne({ _id: adminId, name: 'Fixture Admin', email: 'admin@example.test',
      ageBand: '18_plus', termsVersion: '2026-11-20', onboardingCompleted: true,
      password: await requireServer('bcryptjs').hash(adminPassword, 10) });
    await db.collection('proofs').insertMany([1,2].map(month => ({user:adminId, month, status:'pending', files: [{ type: 'image/png', data: proofImage }], submittedAt:new Date()})));
    await db.collection('claims').insertOne({user:adminId, status:'pending', createdAt:new Date()});
  } finally { await seed.close(); }
  api = spawn(process.execPath, ['server/index.js'], { windowsHide: true, env: {
    ...process.env, NODE_ENV: 'test', ADMIN_USER_IDS: adminId.toHexString(), HOST: '127.0.0.1', PORT: String(port), CLIENT_URL: base,
    MONGODB_URI: uri, MONGODB_URI_TEST: uri, DISABLE_RATE_LIMIT: 'true',
    COOKIE_DOMAIN: '', COOKIE_SAME_SITE: 'lax', BREVO_API_KEY: '', VAPID_PRIVATE_KEY: '', VAPID_PUBLIC_KEY: '',
    JWT_ACCESS_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex')
  }, stdio: ['ignore', 'ignore', 'inherit'] });
  await expect.poll(async () => (await fetch(target + '/api/health').catch(() => null))?.status, { timeout: 30000 }).toBe(200);
  browser = await chromium.launch();
  context = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: artifacts, size: { width: 1280, height: 800 } }, serviceWorkers: 'block' });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  page = await context.newPage();
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', res => { if (res.status() >= 400 && res.url().startsWith(base)) errors.push(res.status() + ' ' + new URL(res.url()).pathname); });
  const visit = async route => {
    await page.goto(base + route);
    await expect(page.locator('h1,h2,main,form').first()).toBeVisible();
    await expect(page.getByRole('status', {name: /Loading (page|view)/})).toHaveCount(0);
    await expect(page.getByText('Something went wrong in this section')).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe(route.split('?')[0]);
    results.push(route);
  };
  for (const route of ['/welcome','/explore','/tools','/roadmaps','/finals-planner','/terms','/privacy','/rewards-rules','/verify/local-qa','/signin','/forgot-password','/reset-password','/reset-password/local-test','/signup']) await visit(route);
  await page.goto(base);
  await expect(page).toHaveURL(/\/welcome$/);
  await page.goto(base + '/admin');
  await expect(page).toHaveURL(/\/signin$/);
  results.push('Guest admin guard');
  await visit('/signup');
  await page.getByLabel('Full name').fill('Local QA');
  await page.getByLabel('Email', {exact:true}).fill('localqa@example.test');
  await page.getByLabel(/^Password/).fill(randomBytes(16).toString('hex') + 'Aa1!');
  await page.getByLabel('18 or older').check();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Create account/ }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole('button', {name:'Skip for now'}).click();
  await page.getByRole('button', {name:'End tour'}).click();
  const boundary = await page.evaluate(async () => {
    const csrf = document.cookie.split('; ').find(cookie => cookie.startsWith('csrfToken='))?.split('=')[1];
    const response = await fetch('/api/users/profile', { method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': decodeURIComponent(csrf || '') },
      body: JSON.stringify({ name: 'Local QA', rewardRun: 150 }) });
    const json = await response.json();
    return { status: response.status, rewardRun: json.data?.user?.rewardRun };
  });
  expect(boundary.status).toBe(200);
  expect(boundary.rewardRun).toBe(0);
  const csrf = (await context.cookies()).find(cookie => cookie.name === 'csrfToken').value;
  const headers = { 'X-CSRF-Token': csrf };
  const request = context.request;
  const sessionsUrl = base + '/api/study-sessions';
  const created = await request.post(sessionsUrl, { headers, data: { topic: 'Audit fixture', focusDuration: 4, activityType: 'Video/Tutorial' } });
  expect(created.status()).toBe(201);
  const session = (await created.json()).data.session;
  expect(session.heartbeatOk).toBe(false);
  const dashboard = async () => (await (await request.get(base + '/api/analytics/dashboard')).json()).today.studyMinutes;
  expect(await dashboard()).toBe(4);
  expect((await request.patch(sessionsUrl + '/' + session._id, { headers, data: { focusDuration: 2 } })).ok()).toBe(true);
  expect(await dashboard()).toBe(2);
  const backup = (await (await request.get(base + '/api/users/me/export')).json()).data;
  expect((await request.delete(sessionsUrl + '/' + session._id, { headers })).ok()).toBe(true);
  expect(await dashboard()).toBe(0);
  backup.mockTests = [{ title: 'Practice paper', obtainedMarks: 8, totalMarks: 10 }];
  backup.timetableSlots = [{ dayOfWeek: 1, subject: 'Physics', startTime: '09:00', endTime: '10:00' }];
  expect((await request.post(base + '/api/users/me/restore', { headers, data: backup })).ok()).toBe(true);
  const restored = (await (await request.get(base + '/api/users/me/export')).json()).data;
  expect(restored.studySessions[0].activityType).toBe('Video/Tutorial');
  expect(restored.mockTests[0].title).toBe('Practice paper');
  expect(restored.timetableSlots[0].subject).toBe('Physics');
  expect(await dashboard()).toBe(2);
  results.push('Session edits, deletion and backup restore update dashboard totals');
  await visit('/study');
  const started = page.waitForResponse(r => r.url().endsWith('/timer/start') && r.ok());
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await started;
  await expect.poll(async () => {
    const active = (await (await request.get(sessionsUrl + '/timer/active')).json()).data.session;
    return active?.verifiedSeconds >= 30 && Date.now() - Date.parse(active.startedAt) >= 61000;
  }, { timeout: 95000, intervals: [2000] }).toBe(true);
  const [finished] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/finish') && r.ok()),
    page.getByTitle('Finish session (Press S)').click(),
  ]);
  expect((await finished.json()).data.session.heartbeatOk).toBe(true);
  results.push('Browser focus timer earned server-verified time');
  for (const route of ['/','/study','/notes','/plan','/progress','/settings','/revisions','/mission','/garden','/achievements','/circles','/challenges']) {
    await visit(route);
    const tabs = page.getByRole('tab');
    for (let i=0; i < await tabs.count(); i++) {
      const tab = tabs.nth(i);
      const label = await tab.innerText();
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected','true');
      results.push(route + ' tab ' + label);
    }
  }
  await visit('/plan?tab=invalid');
  const add = page.getByPlaceholder('Add a task and press Enter');
  await add.fill('Local QA task');
  await add.press('Enter');
  await expect(page.getByText('Local QA task',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Edit task'}).click();
  await page.locator('.row input').fill('Renamed QA task');
  await page.getByRole('button',{name:'Save', exact:true}).click();
  await page.getByRole('button',{name:'Mark as done'}).click();
  await page.reload();
  await expect(page.getByText('Renamed QA task',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Mark as todo'}).click();
  await page.getByRole('button',{name:'Delete task'}).click();
  await expect(page.getByText('Renamed QA task',{exact:true})).toHaveCount(0);
  results.push('Task create, rename, complete, persist after reload, reopen and delete');
  await visit('/progress?tab=invalid');
  await expect(page.getByRole('tab').first()).toHaveAttribute('aria-selected','true');
  await visit('/tools');
  await page.getByLabel('Hours per week').fill('6');
  await page.getByLabel('Study days per week').fill('3');
  await expect(page.locator('#hours [role=status]')).toContainText('120 minutes');
  await page.getByRole('link',{name:'Build a revision timetable'}).click();
  await expect(page).toHaveURL(/\/finals-planner$/);
  results.push('Calculator and planner handoff');
  await visit('/circles');
  await page.getByLabel('Circle name').fill('Local study group');
  await page.getByRole('button',{name:'Create circle'}).click();
  await page.getByLabel('What did you work on?').selectOption('Reviewed a topic');
  await page.getByRole('button',{name:'Check in'}).click();
  await expect(page.getByText('Checked in for today')).toBeVisible();
  await page.getByRole('button',{name:'Leave circle'}).click();
  await page.getByRole('button',{name:'Stay'}).click();
  await page.getByRole('button',{name:'Leave circle'}).click();
  await page.getByRole('button',{name:'Leave circle'}).click();
  await expect(page).toHaveURL(base + '/circles');
  results.push('Circle creation, check-in, cancel leave and confirm leave');
  await visit('/challenges');
  await page.getByLabel('Group goal').selectOption('3');
  await page.getByRole('button',{name:'Start a challenge'}).click();
  await expect(page.getByText('Group progress')).toBeVisible();
  await page.getByText('Group encouragement').click();
  await page.getByRole('button',{name:/Cheer for the group/}).click();
  await expect(page.getByRole('button',{name:/You cheered/})).toBeDisabled();
  results.push('Challenge creation and cheer');
  await visit('/revisions');
  await page.getByRole('button',{name:'Quick add',exact:true}).click();
  const topic = page.getByPlaceholder(/Type topic name/);
  await topic.fill('QA revision topic');
  await topic.press('Enter');
  await expect(page.getByText('QA revision topic',{exact:true})).toBeVisible();
  results.push('Saved revision topic');
  await visit('/notes');
  await page.getByRole('button',{name:'New note'}).click();
  await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Untitled note');
  await page.getByLabel('Title',{exact:true}).fill('QA notebook');
  await page.getByLabel('Note',{exact:true}).fill('Review chapter one');
  await expect(page.getByRole('button',{name:/QA notebook/})).toBeVisible();
  await page.getByRole('button',{name:'Pin note',exact:true}).click();
  await expect(page.getByRole('button',{name:'Unpin note'})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:/QA notebook/}).click();
  await expect(page.getByLabel('Note',{exact:true})).toHaveValue('Review chapter one');
  results.push('Created, edited, pinned and reopened note');
  // Inventory each visible, named button on the primary workspace views. Reload
  // between clicks so one open menu or dialog cannot hide the next control.
  for (const route of ['/', '/notes','/plan?tab=subjects','/progress?tab=stats','/progress?tab=practice','/revisions','/settings','/garden','/mission','/achievements','/study']) {
    await page.goto(base + route);
    await page.locator('main').waitFor();
    await expect(page.getByRole('status',{name:/Loading (page|view)/})).toHaveCount(0);
    const selector = 'main button:visible:enabled';
    const names = await page.locator(selector).evaluateAll(buttons => [...new Set(buttons.map(b =>
      (b.getAttribute('aria-label') || b.innerText || b.title).trim()).filter(Boolean))]);
    for (const name of names) {
      await page.goto(base + route);
      const buttons = page.locator(selector);
      await buttons.first().waitFor();
      const index = await buttons.evaluateAll((items, name) => items.findIndex(b =>
        (b.getAttribute('aria-label') || b.innerText || b.title).trim() === name), name);
      if (index < 0) { results.push('No longer available: ' + route + ' ' + name); continue; }
      await buttons.nth(index).click();
      await expect(page.getByText('Something went wrong in this section')).toHaveCount(0);
      results.push('Clicked ' + route + ' ' + name);
    }
  }
  await page.goto(base + '/settings');
  await page.getByRole('button',{name:'Account menu'}).click();
  await page.getByRole('button',{name:'Sign out'}).click();
  await expect(page).toHaveURL(/\/signin$/);
  await page.getByLabel('Email',{exact:true}).fill('admin@example.test');
  await page.locator('input[autocomplete="current-password"]').fill(adminPassword);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).not.toHaveURL(/\/signin$/);
  await visit('/admin');
  await expect(page.getByRole('heading',{name:'Admin Operations'})).toBeVisible();
  const pending = (await (await request.get(base + '/api/admin/proofs')).json()).proofs;
  expect(pending[0].files[0].data).toBeUndefined();
  const image = await request.get(base + '/api/admin/proofs/' + pending[0]._id + '/files/0');
  expect(await image.body()).toEqual(proofImage);
  const reviews = page.getByPlaceholder('Optional review note...');
  await reviews.first().fill('Local fixture review');
  await reviews.first().locator('..').getByRole('button',{name:'Approve'}).click();
  await expect(reviews).toHaveCount(1);
  await reviews.first().locator('..').getByRole('button',{name:'Reject'}).click();
  await expect(reviews).toHaveCount(0);
  await page.getByRole('button',{name:'Mark Shipped'}).click();
  await expect(page.getByText('shipped',{exact:true})).toBeVisible();
  results.push('Administrator sign-in, approve and reject proofs, ship a claim');
  const adminCsrf = (await context.cookies()).find(cookie => cookie.name === 'csrfToken').value;
  const adminHeaders = { 'X-CSRF-Token': adminCsrf };
  for (const path of ['claim', 'proof']) {
    expect((await request.post(base + '/api/rewards/' + path, { headers: adminHeaders, data: {} })).status()).toBe(410);
  }
  expect((await request.delete(base + '/api/users/me', { headers: adminHeaders, data: { password: adminPassword } })).ok()).toBe(true);
  const inspection = new MongoClient(uri);
  try {
    for (const name of ['claims', 'proofs']) {
      expect(await inspection.db().collection(name).countDocuments({ user: adminId })).toBe(0);
    }
  } finally { await inspection.close(); }
  results.push('Closed claims, protected proof images and account deletion');
  expect(errors).toEqual([]);
} catch (error) {
  failure = error.message;
  throw error;
} finally {
  console.log('Completed checks:', results.length, 'Browser errors:', errors);
  await writeFile(artifacts + '/localhost-results.json', JSON.stringify({passed: !failure, results, errors, failure}, null, 2));
  if (page) console.log('Last view:', page.url(), (await page.locator('body').innerText()).slice(0,450));
  const video = page?.video();
  await context?.close();
  if (video) { await video.saveAs(artifacts + '/localhost-desktop.webm'); await video.delete(); }
  await browser?.close();
  if (api && api.exitCode === null) { const closed = once(api,'exit'); api.kill(); await closed; }
  await previewServer?.close();
  await mongo.stop();
}
