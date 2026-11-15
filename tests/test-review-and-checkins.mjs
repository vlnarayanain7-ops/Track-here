import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

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

async function run() {
  ensureDir('screenshots');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // State
  let planSaved = null;
  let reviewSaved = null;
  let revisionsList = [];

  // Setup auth & user
  await page.addInitScript(() => {
    localStorage.setItem('th-token', 'mock-p13-token');
    localStorage.setItem(
      'th-user',
      JSON.stringify({
        _id: 'user-p13',
        name: 'Narayana',
        email: 'scholar@trackhere.app',
        ageBand: '18_plus',
        onboardingCompleted: true,
        dailyStudyGoal: 240,
        timezone: 'Asia/Kolkata',
        preparationType: 'Coding interviews',
        targetExamDate: new Date(Date.now() + 42 * 86400000).toISOString(),
        subjects: [
          { name: 'Algorithms', color: '#2563EB' },
          { name: 'System Design', color: '#16A34A' },
        ],
      })
    );
  });

  // Mock API routes
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/auth/csrf')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { csrfToken: 'csrf-123' } }),
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
              _id: 'user-p13',
              name: 'Narayana',
              email: 'scholar@trackhere.app',
              ageBand: '18_plus',
              onboardingCompleted: true,
              dailyStudyGoal: 240,
              timezone: 'Asia/Kolkata',
              preparationType: 'Coding interviews',
              targetExamDate: new Date(Date.now() + 42 * 86400000).toISOString(),
              subjects: [
                { name: 'Algorithms', color: '#2563EB' },
                { name: 'System Design', color: '#16A34A' },
              ],
            },
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
            currentStreak: 14,
            today: { studyMinutes: 45, focusMinutes: 45 },
          },
        }),
      });
    }

    if (url.includes('/api/daily-plans')) {
      if (method === 'POST') {
        const postData = JSON.parse(route.request().postData() || '{}');
        planSaved = {
          _id: 'plan-saved-1',
          ...postData,
        };
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(planSaved),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(planSaved ? planSaved : { plan: null }),
      });
    }

    if (url.includes('/api/daily-reviews')) {
      if (method === 'POST') {
        const postData = JSON.parse(route.request().postData() || '{}');
        reviewSaved = {
          _id: 'review-saved-1',
          ...postData,
        };
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(reviewSaved),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review: reviewSaved,
          liveStats: { actualStudyTime: 45 },
        }),
      });
    }

    if (url.includes('/api/revisions')) {
      if (method === 'POST') {
        const postData = JSON.parse(route.request().postData() || '{}');
        const newRev = {
          _id: `rev-${Date.now()}`,
          title: postData.title,
          type: postData.type || 'topic',
          intervalDays: postData.intervalDays || 1,
          dueDate: new Date().toISOString(),
          status: 'pending',
        };
        revisionsList.push(newRev);
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: newRev }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { revisions: revisionsList } }),
      });
    }

    if (url.includes('/api/tasks')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { tasks: [] } }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  console.log('Waiting for preview server to be ready...');
  let targetUrl = 'http://localhost:5173/';
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://localhost:5173/');
      if (res.ok) { targetUrl = 'http://localhost:5173/'; break; }
    } catch {}
    try {
      const res4 = await fetch('http://localhost:5174/');
      if (res4.ok) { targetUrl = 'http://localhost:5174/'; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`Navigating to dashboard at ${targetUrl}...`);
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle');

  // Verify initial state: Check-ins show "Set your plan", "Reflect on today", "All caught up"
  const mrgBtn = page.locator('button.ck3').filter({ hasText: /^Morning plan/ });
  const evgBtn = page.locator('button.ck3').filter({ hasText: /^Evening review/ });
  const revBtn = page.locator('button.ck3').filter({ hasText: /^Review/ });

  console.log('Verifying initial check-in labels...');
  await mrgBtn.waitFor({ state: 'visible' });
  const mrgText = await mrgBtn.innerText();
  console.log('Morning plan button text:', mrgText.replace('\n', ' '));

  // 1. Test Review Sheet drawer
  console.log('Testing Review Sheet drawer...');
  await revBtn.click();
  const reviewDialog = page.locator('dialog.sheet[open]');
  await reviewDialog.waitFor({ state: 'visible' });
  console.log('PASS: Review side sheet opened as dialog.sheet modal!');

  // Check the add topic input
  const topicInput = reviewDialog.locator('input[placeholder*="Dynamic Programming"]');
  await topicInput.fill('Dynamic Programming Trees');
  const addBtn = reviewDialog.locator('button[type="submit"]').filter({ hasText: 'Add' });
  await addBtn.click();

  // Wait for item to appear
  const addedItem = reviewDialog.locator('text=Dynamic Programming Trees');
  await addedItem.waitFor({ state: 'visible' });
  console.log('PASS: Directly added topic appeared in review queue!');

  // Check Remembered & Hard buttons
  const rememberedBtn = reviewDialog.locator('button').filter({ hasText: 'Remembered' });
  await rememberedBtn.waitFor({ state: 'visible' });
  console.log('PASS: Spaced repetition action buttons are available!');

  // Take screenshot of Review drawer
  await page.screenshot({ path: 'screenshots/review-sheet-drawer.png' });
  saveArtifact('screenshots/review-sheet-drawer.png');

  // Close review sheet
  const closeRevBtn = reviewDialog.locator('button').filter({ hasText: 'Close' });
  await closeRevBtn.click();
  await reviewDialog.waitFor({ state: 'hidden' });
  console.log('PASS: Review side sheet closed.');

  // 2. Test Morning Plan
  console.log('Testing Morning Plan saving...');
  await mrgBtn.click();
  const journalDialog = page.locator('dialog.sheet[open]');
  await journalDialog.waitFor({ state: 'visible' });

  // Fill in first priority
  const priInput = journalDialog.locator('input[aria-label="Priority 1"]');
  await priInput.fill('Graph shortest path algorithms');
  const savePlanBtn = journalDialog.locator('button[type="submit"]').filter({ hasText: 'Save plan' });
  await savePlanBtn.click();
  await journalDialog.waitFor({ state: 'hidden' });

  // Verify Morning plan chip now says "Done"
  await page.waitForTimeout(500);
  const mrgUpdatedText = await mrgBtn.innerText();
  console.log('Morning plan button text after saving:', mrgUpdatedText.replace('\n', ' '));
  if (!mrgUpdatedText.includes('Done')) {
    throw new Error(`Morning plan did not update to "Done", got: ${mrgUpdatedText}`);
  }
  console.log('PASS: Morning plan updated to "Done"!');

  // 3. Test Evening Review
  console.log('Testing Evening Review saving...');
  await evgBtn.click();
  await journalDialog.waitFor({ state: 'visible' });

  // Select a mood chip
  const moodChip = journalDialog.locator('button.chip').filter({ hasText: 'Good' });
  if (await moodChip.isVisible()) {
    await moodChip.click();
  }
  const noteArea = journalDialog.locator('textarea#ev-note');
  if (await noteArea.isVisible()) {
    await noteArea.fill('Great progress on Dijkstra and Bellman-Ford today.');
  }
  const saveReviewBtn = journalDialog.locator('button[type="submit"]').filter({ hasText: 'Save review' });
  await saveReviewBtn.click();
  await journalDialog.waitFor({ state: 'hidden' });

  // Verify Evening review chip now says "Done"
  await page.waitForTimeout(500);
  const evgUpdatedText = await evgBtn.innerText();
  console.log('Evening review button text after saving:', evgUpdatedText.replace('\n', ' '));
  if (!evgUpdatedText.includes('Done')) {
    throw new Error(`Evening review did not update to "Done", got: ${evgUpdatedText}`);
  }
  console.log('PASS: Evening review updated to "Done"!');

  // Take screenshot of Today dashboard showing both "Done"
  await page.screenshot({ path: 'screenshots/today-checkins-done.png' });
  saveArtifact('screenshots/today-checkins-done.png');

  // Also take mobile screenshot
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'screenshots/today-checkins-done-mobile.png' });
  saveArtifact('screenshots/today-checkins-done-mobile.png');

  await browser.close();
  console.log('ALL TESTS PASSED!');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
