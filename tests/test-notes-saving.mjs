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

  // In-memory note store for mocking
  const notesStore = [
    {
      _id: 'note-general-1',
      title: 'General To-Do & Ideas',
      folder: 'General',
      contentMarkdown: 'Pick up notebooks and review semester goals.',
      contentHtml: 'Pick up notebooks and review semester goals.',
      isPinned: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'note-algo-1',
      title: 'Binary Search Edge Cases',
      folder: 'Algorithms',
      contentMarkdown: 'Remember low + (high - low) / 2 to avoid overflow.',
      contentHtml: 'Remember low + (high - low) / 2 to avoid overflow.',
      isPinned: false,
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'note-sys-1',
      title: 'CAP Theorem Breakdown',
      folder: 'System Design',
      contentMarkdown: 'Consistency, Availability, Partition tolerance - pick 2 under network partition.',
      contentHtml: 'Consistency, Availability, Partition tolerance - pick 2 under network partition.',
      isPinned: false,
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  await page.addInitScript(() => {
    localStorage.removeItem('trackhere_active_timer_v2');
    localStorage.setItem('th-token', 'mock-p13-token');
    localStorage.setItem(
      'th-user',
      JSON.stringify({
        _id: 'user-p13',
        name: 'Narayana',
        email: 'vlnarayana.in7@gmail.com',
        ageBand: '18_plus',
        onboardingCompleted: true,
        dailyStudyGoal: 240,
        timezone: 'Asia/Kolkata',
        preparationType: 'Coding interviews',
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

    if (url.endsWith('.js') || url.endsWith('.css') || url.includes('/assets/')) {
      return route.continue();
    }

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
              email: 'vlnarayana.in7@gmail.com',
              ageBand: '18_plus',
              onboardingCompleted: true,
              dailyStudyGoal: 240,
              timezone: 'Asia/Kolkata',
              subjects: [
                { name: 'Algorithms', color: '#2563EB' },
                { name: 'System Design', color: '#16A34A' },
              ],
            },
          },
        }),
      });
    }

    if (url.includes('/api/notes')) {
      const u = new URL(url);
      const folderParam = u.searchParams.get('folder');

      if (method === 'GET') {
        const idMatch = url.match(/\/api\/notes\/([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1] !== 'folders') {
          const found = notesStore.find((n) => n._id === idMatch[1]);
          return route.fulfill({
            status: found ? 200 : 404,
            contentType: 'application/json',
            body: JSON.stringify({ success: Boolean(found), data: { note: found } }),
          });
        }

        const filtered = folderParam
          ? notesStore.filter((n) => n.folder === folderParam)
          : notesStore;

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { notes: filtered },
          }),
        });
      }

      if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newNote = {
          _id: `note-${Date.now()}`,
          title: body.title || 'Untitled note',
          folder: body.folder || 'General',
          contentMarkdown: body.contentMarkdown || '',
          contentHtml: body.contentHtml || '',
          isPinned: Boolean(body.isPinned),
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        notesStore.unshift(newNote);
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { note: newNote } }),
        });
      }

      if (method === 'PUT') {
        const idMatch = url.match(/\/api\/notes\/([a-zA-Z0-9_-]+)/);
        const body = JSON.parse(route.request().postData() || '{}');
        const id = idMatch ? idMatch[1] : null;
        const noteIndex = notesStore.findIndex((n) => n._id === id);

        if (noteIndex >= 0) {
          notesStore[noteIndex] = {
            ...notesStore[noteIndex],
            ...body,
            updatedAt: new Date().toISOString(),
          };
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { note: notesStore[noteIndex] } }),
          });
        }
      }
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  console.log('Finding active preview server...');
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

  console.log(`Navigating to Notes page at ${targetUrl}notes...`);
  await page.goto(`${targetUrl}notes`);
  await page.waitForLoadState('networkidle');

  // Verify page title
  const h1 = page.locator('h1').filter({ hasText: 'Notes' });
  await h1.waitFor({ state: 'visible' });
  console.log('PASS: Notes page rendered successfully!');

  // 1. Verify all 3 initial notes are listed with their folder badges
  console.log('Verifying initial notes in All Subjects view...');
  await page.locator('text=General To-Do & Ideas').waitFor({ state: 'visible' });
  await page.locator('text=Binary Search Edge Cases').waitFor({ state: 'visible' });
  await page.locator('text=CAP Theorem Breakdown').waitFor({ state: 'visible' });
  console.log('PASS: All initial notes loaded in list!');

  // Take screenshot of Notes page with multiple subjects
  await page.screenshot({ path: 'screenshots/notes-all-subjects.png' });
  saveArtifact('screenshots/notes-all-subjects.png');

  // 2. Test Subject Filtering
  console.log('Testing filter: Algorithms...');
  const subjectFilter = page.locator('select[aria-label="Filter notes by subject"]');
  await subjectFilter.selectOption('Algorithms');
  await page.waitForTimeout(500);

  const algoVisible = await page.locator('text=Binary Search Edge Cases').isVisible();
  const sysVisible = await page.locator('text=CAP Theorem Breakdown').isVisible();
  if (!algoVisible || sysVisible) {
    throw new Error(`Filter failed: Algorithms note should be visible (${algoVisible}), System Design should be hidden (${sysVisible})`);
  }
  console.log('PASS: Algorithms filter correctly shows only Algorithms notes!');

  // Test filter: General (Normal notes)
  console.log('Testing filter: General (Normal notes)...');
  await subjectFilter.selectOption('General');
  await page.waitForTimeout(500);

  const genVisible = await page.locator('text=General To-Do & Ideas').isVisible();
  const algoHidden = await page.locator('text=Binary Search Edge Cases').isVisible();
  if (!genVisible || algoHidden) {
    throw new Error(`Filter failed: General note should be visible (${genVisible}), Algorithms should be hidden (${algoHidden})`);
  }
  console.log('PASS: General filter correctly shows only normal/General notes!');

  // Reset to All subjects
  await subjectFilter.selectOption('');
  await page.waitForTimeout(500);

  // 3. Test creating a new Normal Note
  console.log('Testing creation of a new Normal Note...');
  const newNoteBtn = page.locator('button').filter({ hasText: 'New note' });
  await newNoteBtn.click();
  await page.waitForTimeout(600);

  // Edit title and body
  const titleInput = page.locator('input[aria-label="Title"]');
  await titleInput.fill('Daily Reflection & Ideas');

  const textArea = page.locator('textarea[aria-label="Note"]');
  await textArea.fill('Finished dynamic programming sets. Consistency is building nicely.');

  // Wait for autosave (800ms debounce)
  await page.waitForTimeout(1200);

  // Verify "Saved" status indicator
  const savedIndicator = page.locator('[data-testid="desktop-saved-indicator"]');
  const savedText = await savedIndicator.innerText();
  console.log(`Autosave indicator: ${savedText}`);
  if (!savedText.includes('Saved')) {
    throw new Error(`Note did not autosave properly, got: ${savedText}`);
  }
  console.log('PASS: Normal note created and autosaved successfully!');

  // 4. Test changing subject from General to a specific subject (System Design)
  console.log('Testing moving note to System Design subject...');
  const noteSubjectSelect = page.locator('select[aria-label="Note subject"]');
  await noteSubjectSelect.selectOption('System Design');
  await page.waitForTimeout(1000);

  const updatedNoteInStore = notesStore.find((n) => n.title === 'Daily Reflection & Ideas');
  console.log('Updated note folder in store:', updatedNoteInStore?.folder);
  if (updatedNoteInStore?.folder !== 'System Design') {
    throw new Error(`Folder was not updated in store, got: ${updatedNoteInStore?.folder}`);
  }
  console.log('PASS: Note successfully updated subject to System Design and saved to backend!');

  // Take screenshot of Note Editor with Subject Selector
  await page.screenshot({ path: 'screenshots/notes-editor-saved.png' });
  saveArtifact('screenshots/notes-editor-saved.png');

  // Mobile screenshot
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'screenshots/notes-mobile-saved.png' });
  saveArtifact('screenshots/notes-mobile-saved.png');

  await browser.close();
  console.log('ALL NOTES TESTS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
