import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT_DIR = 'C:/Users/LAKSHMI NARAYANA/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.addInitScript(() => {
    localStorage.setItem('th-theme', 'dark');
    localStorage.setItem('th-token', 'mock-token');
  });

  const mockUser = {
    _id: 'u1',
    name: 'Narayana',
    email: 'vlnarayana.in7@gmail.com',
    ageBand: '18_plus',
    termsVersion: '2026-11-20',
    onboardingCompleted: true,
    timezone: 'Asia/Kolkata',
    rewardRun: 3,
    bestRewardRun: 3,
    milestones: [],
  };

  const streakData = {
    currentStreak: 3,
    longestStreak: 3,
    activeDaysThisYear: 3,
    isActiveToday: true,
    thisWeek: [
      { day: 'M', label: 'Mon', isActive: true, isToday: true, minutes: 38, date: '2026-11-16' },
      { day: 'T', label: 'Tue', isActive: false, isToday: false, minutes: 0, date: '2026-11-17' },
      { day: 'W', label: 'Wed', isActive: false, isToday: false, minutes: 0, date: '2026-11-18' },
      { day: 'T', label: 'Thu', isActive: false, isToday: false, minutes: 0, date: '2026-11-19' },
      { day: 'F', label: 'Fri', isActive: false, isToday: false, minutes: 0, date: '2026-11-20' },
      { day: 'S', label: 'Sat', isActive: false, isToday: false, minutes: 0, date: '2026-11-21' },
      { day: 'S', label: 'Sun', isActive: false, isToday: false, minutes: 0, date: '2026-11-22' },
    ],
    last7Days: [
      { day: 'T', label: 'Tue', isActive: false, minutes: 0, date: '2026-11-10' },
      { day: 'W', label: 'Wed', isActive: false, minutes: 0, date: '2026-11-11' },
      { day: 'T', label: 'Thu', isActive: false, minutes: 0, date: '2026-11-12' },
      { day: 'F', label: 'Fri', isActive: false, minutes: 0, date: '2026-11-13' },
      { day: 'S', label: 'Sat', isActive: true, minutes: 30, date: '2026-11-14' },
      { day: 'S', label: 'Sun', isActive: true, minutes: 30, date: '2026-11-15' },
      { day: 'M', label: 'Mon', isActive: true, isToday: true, minutes: 38, date: '2026-11-16' },
    ],
    activeStreakDays: [
      { label: 'Sat Nov 14', minutes: 30 },
      { label: 'Sun Nov 15', minutes: 30 },
      { label: 'Mon Nov 16', minutes: 38 },
    ],
    history: [
      { date: '2026-11-14', minutes: 30 },
      { date: '2026-11-15', minutes: 30 },
      { date: '2026-11-16', minutes: 38 },
    ],
  };

  await page.route((url) => {
    try {
      const u = new URL(url);
      return u.pathname.startsWith('/api/');
    } catch {
      return false;
    }
  }, async (route) => {
    const url = route.request().url();
    if (url.includes('/api/auth/csrf')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { csrfToken: 'csrf-1' } }) });
    }
    if (url.includes('/api/auth/me') || url.includes('/api/users/profile') || url.includes('/api/users/me')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { user: mockUser } }) });
    }
    if (url.includes('/api/analytics/streaks')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(streakData),
      });
    }
    if (url.includes('/api/analytics/heatmap')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(streakData.history),
      });
    }
    if (url.includes('/api/analytics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { studyMinutes: 38 },
          streaks: streakData,
          totalStudyHours: 1.6,
          subjects: [{ name: 'Engineering', minutes: 98 }],
        }),
      });
    }
    if (url.includes('/api/rewards/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          milestoneRun: 3,
          rewardRun: 3,
          milestones: [],
          proofs: [],
          eligible: true,
        }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });

  await page.goto('http://localhost:5173/progress', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=3-day continuous streak:');
  await page.waitForTimeout(500);

  const shotPath = path.join(ARTIFACT_DIR, 'step-14-8-streak-fixed-recent7.png');
  await page.screenshot({ path: shotPath });
  console.log('Saved screenshot:', shotPath);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
