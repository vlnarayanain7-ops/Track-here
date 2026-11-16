// tests/test-prompt14-qa.mjs
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../client/dist');
const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveArtifact(srcPath) {
  try {
    ensureDir(ARTIFACT_DIR);
    const dest = path.join(ARTIFACT_DIR, path.basename(srcPath));
    fs.copyFileSync(srcPath, dest);
    console.log(`Saved artifact: ${path.basename(srcPath)}`);
  } catch (err) {
    console.error('Failed to copy artifact:', err);
  }
}

// 1. Lightweight SPA server for client/dist
function startServer(port = 5173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      let filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        return fs.createReadStream(filePath).pipe(res);
      }

      // SPA fallback
      const indexPath = path.join(DIST_DIR, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
    });

    server.listen(port, () => {
      console.log(`Preview server running on port ${port}`);
      resolve(server);
    });
  });
}

async function run() {
  ensureDir('screenshots/prompt14');
  const server = await startServer(5173);
  const browser = await chromium.launch();

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  const themes = ['light', 'dark'];

  // Base mock user
  const mockUser = {
    _id: 'user-p14',
    name: 'Narayana',
    email: 'vlnarayana.in7@gmail.com',
    ageBand: '18_plus',
    termsVersion: '2026-11-20',
    onboardingCompleted: true,
    timezone: 'Asia/Kolkata',
    rewardRun: 150,
    bestRewardRun: 150,
    milestones: [{ days: 7 }, { days: 30 }],
  };

  // Base rewards state
  let currentRewardsState = {
    milestoneRun: 32,
    rewardRun: 150,
    bestRewardRun: 150,
    milestones: [7, 30],
    proofs: [
      { month: 1, status: 'approved' },
      { month: 2, status: 'approved' },
      { month: 3, status: 'approved' },
      { month: 4, status: 'approved' },
      { month: 5, status: 'approved' },
    ],
    eligible: true,
    certificate: {
      serial: 'TH30-ABC1234567',
      issuedAt: new Date().toISOString(),
      showName: true,
      displayName: 'Narayana',
    },
    claim: null,
  };

  for (const vp of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      await page.addInitScript(({ th }) => {
        localStorage.setItem('th_theme', th);
        localStorage.setItem('th-token', 'mock-p14-token');
        document.documentElement.setAttribute('data-theme', th);
      }, { th: theme });

      // Mock API Routes
      await page.route('**/api/**', async (route) => {
        const url = route.request().url();

        if (url.includes('/api/auth/csrf')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { csrfToken: 'csrf-p14' } }),
          });
        }

        if (url.includes('/api/auth/me') || url.includes('/api/users/profile') || url.includes('/api/users/me')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { user: mockUser } }),
          });
        }

        if (url.includes('/api/rewards/me')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(currentRewardsState),
          });
        }

        if (url.includes('/api/analytics/streaks')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                currentStreak: 7,
                longestStreak: 30,
                activeDaysThisYear: 45,
                thisWeek: [
                  { day: 'M', isActive: true, minutes: 45, date: '2026-11-10' },
                  { day: 'T', isActive: true, minutes: 60, date: '2026-11-11' },
                  { day: 'W', isActive: true, minutes: 50, date: '2026-11-12' },
                  { day: 'T', isActive: true, minutes: 75, date: '2026-11-13' },
                  { day: 'F', isActive: true, minutes: 90, date: '2026-11-14' },
                  { day: 'S', isActive: true, minutes: 80, date: '2026-11-15' },
                  { day: 'S', isActive: true, isToday: true, minutes: 65, date: '2026-11-16' },
                ],
                activeStreakDays: [
                  { label: 'Today', minutes: 65 },
                  { label: 'Yesterday', minutes: 80 },
                ],
                history: [
                  { date: '2026-11-16', minutes: 65 },
                  { date: '2026-11-15', minutes: 80 },
                  { date: '2026-11-14', minutes: 90 },
                  { date: '2026-11-13', minutes: 75 },
                  { date: '2026-11-12', minutes: 50 },
                  { date: '2026-11-11', minutes: 60 },
                  { date: '2026-11-10', minutes: 45 },
                ],
              },
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
                totalMinutes: 465,
                bySubject: [
                  { name: 'Algorithms', minutes: 300 },
                  { name: 'System Design', minutes: 165 },
                ],
              },
            }),
          });
        }

        if (url.includes('/api/verify/TH30-ABC1234567')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              valid: true,
              milestone: 30,
              issuedAt: '2026-11-16T12:00:00Z',
              name: 'Narayana',
            }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      // ─── 1. Milestones Row in Progress > Streak ───────────────────
      console.log(`[${vp.name}][${theme}] Capturing Progress Streak with Milestones Row...`);
      await page.goto('http://localhost:5173/progress', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=7-day badge');
      await page.waitForTimeout(500);

      const pMilestones = `screenshots/prompt14/step-14-8-milestones-row-${vp.name}-${theme}.png`;
      await page.screenshot({ path: pMilestones });
      saveArtifact(pMilestones);

      // ─── 2. Rewards Sheet in Claim Form State (Approved & 150 days) ─
      console.log(`[${vp.name}][${theme}] Capturing Rewards Sheet (Claim Form)...`);
      await page.click('text=7-day badge');
      await page.waitForSelector('h3:has-text("Claim the surprise reward")');
      await page.waitForTimeout(400);

      const pClaim = `screenshots/prompt14/step-14-8-rewards-sheet-claim-${vp.name}-${theme}.png`;
      await page.screenshot({ path: pClaim });
      saveArtifact(pClaim);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // ─── 3. Focus Report Modal (Today's Report) ───────────────────
      console.log(`[${vp.name}][${theme}] Capturing Focus Report Card...`);
      await page.click('button:has-text("Today")');
      await page.waitForSelector('img[alt="Report Card Preview"]');
      await page.waitForTimeout(600);

      const pReport = `screenshots/prompt14/step-14-8-report-card-daily-${vp.name}-${theme}.png`;
      await page.screenshot({ path: pReport });
      saveArtifact(pReport);

      // Save report to device to verify Saved Reports list
      await page.click('button:has-text("Save to device")');
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      // ─── 4. Saved Reports List ────────────────────────────────────
      console.log(`[${vp.name}][${theme}] Capturing Saved Reports List...`);
      await page.waitForSelector('text=Saved reports on device');
      const pSavedList = `screenshots/prompt14/step-14-8-saved-reports-list-${vp.name}-${theme}.png`;
      await page.screenshot({ path: pSavedList });
      saveArtifact(pSavedList);

      // ─── 5. Public Verification Page /verify/:serial ─────────────
      console.log(`[${vp.name}][${theme}] Capturing Public Verification Page...`);
      await page.goto('http://localhost:5173/verify/TH30-ABC1234567', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Verified Certificate');
      await page.waitForTimeout(400);

      const pVerify = `screenshots/prompt14/step-14-8-verify-certificate-${vp.name}-${theme}.png`;
      await page.screenshot({ path: pVerify });
      saveArtifact(pVerify);

      // ─── 6. Legal Pages: /terms, /privacy, /rewards-rules ────────
      console.log(`[${vp.name}][${theme}] Capturing /terms...`);
      await page.goto('http://localhost:5173/terms', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1:has-text("Terms of Service")');
      await page.waitForTimeout(300);
      const pTerms = `screenshots/prompt14/step-14-8-terms-${vp.name}-${theme}.png`;
      await page.screenshot({ path: pTerms });
      saveArtifact(pTerms);

      console.log(`[${vp.name}][${theme}] Capturing /privacy...`);
      await page.goto('http://localhost:5173/privacy', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1:has-text("Privacy Policy")');
      await page.waitForTimeout(300);
      const pPrivacy = `screenshots/prompt14/step-14-8-privacy-${vp.name}-${theme}.png`;
      await page.screenshot({ path: pPrivacy });
      saveArtifact(pPrivacy);

      console.log(`[${vp.name}][${theme}] Capturing /rewards-rules...`);
      await page.goto('http://localhost:5173/rewards-rules', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1:has-text("Rewards Rules")');
      await page.waitForTimeout(300);
      const pRules = `screenshots/prompt14/step-14-8-rewards-rules-${vp.name}-${theme}.png`;
      await page.screenshot({ path: pRules });
      saveArtifact(pRules);

      await context.close();
    }
  }

  // ─── 7. Rewards Sheet States (Locked, Available, Pending, Approved) ─
  console.log('Capturing Rewards Sheet in Locked, Month Available, Pending, and Approved states...');
  const sheetStates = [
    {
      stateName: 'locked',
      data: {
        milestoneRun: 3,
        rewardRun: 15, // Day 15 (< 30) -> all locked
        milestones: [],
        proofs: [],
        eligible: true,
      },
    },
    {
      stateName: 'month-available',
      data: {
        milestoneRun: 35,
        rewardRun: 35, // Day 35 (>= 30) -> Month 1 ready to submit
        milestones: [7, 30],
        proofs: [],
        eligible: true,
      },
    },
    {
      stateName: 'pending',
      data: {
        milestoneRun: 35,
        rewardRun: 35,
        milestones: [7, 30],
        proofs: [{ month: 1, status: 'pending' }],
        eligible: true,
      },
    },
    {
      stateName: 'approved',
      data: {
        milestoneRun: 65,
        rewardRun: 65,
        milestones: [7, 30],
        proofs: [
          { month: 1, status: 'approved' },
          { month: 2, status: 'approved' },
        ],
        eligible: true,
      },
    },
  ];

  for (const st of sheetStates) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('th_theme', 'dark');
      localStorage.setItem('th-token', 'mock-p14-token');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/api/auth/me')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { user: mockUser } }),
        });
      }
      if (url.includes('/api/rewards/me')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(st.data),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('http://localhost:5173/progress', { waitUntil: 'domcontentloaded' });
    await page.click('text=7-day badge');
    await page.waitForTimeout(400);

    const shotPath = `screenshots/prompt14/step-14-8-rewards-sheet-state-${st.stateName}-dark.png`;
    await page.screenshot({ path: shotPath });
    saveArtifact(shotPath);

    await context.close();
  }

  await browser.close();
  server.close();
  console.log('✅ ALL PROMPT 14 SCREENSHOTS AND QA EVIDENCE CAPTURED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('QA script failed:', err);
  process.exit(1);
});
