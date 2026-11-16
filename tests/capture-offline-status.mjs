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

function startServer(port = 5174) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      let filePath = path.join(DIST_DIR, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        return fs.createReadStream(filePath).pipe(res);
      }
      const indexPath = path.join(DIST_DIR, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const server = await startServer(5174);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('th_theme', 'dark');
    localStorage.setItem('th-token', 'mock-p14-token');
    document.documentElement.setAttribute('data-theme', 'dark');
    // Emulate offline
    Object.defineProperty(navigator, 'onLine', { value: false });
  });

  await page.route('**/api/**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            _id: 'user-p14',
            name: 'Narayana',
            email: 'vlnarayana.in7@gmail.com',
            ageBand: '18_plus',
          },
        },
      }),
    });
  });

  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Click Avatar button to open menu
  const avatarBtn = page.locator('button[aria-label="User account menu"]').or(page.locator('header button').last());
  await avatarBtn.click();
  await page.waitForSelector('text=Offline: changes will sync');
  await page.waitForTimeout(300);

  const shotPath = 'screenshots/prompt14/step-14-8-offline-banner.png';
  await page.screenshot({ path: shotPath });
  fs.copyFileSync(shotPath, path.join(ARTIFACT_DIR, 'step-14-8-offline-banner.png'));
  console.log('Saved offline banner artifact: step-14-8-offline-banner.png');

  await browser.close();
  server.close();
}

run().catch(console.error);
