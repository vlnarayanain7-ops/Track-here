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

function startServer(port = 5175) {
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
  const server = await startServer(5175);
  const browser = await chromium.launch();

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];
  const themes = ['light', 'dark'];

  for (const vp of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      await page.addInitScript(({ th }) => {
        localStorage.setItem('th_theme', th);
        document.documentElement.setAttribute('data-theme', th);
      }, { th: theme });

      // 1. /terms
      await page.goto('http://localhost:5175/terms', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1:has-text("Terms of Service")');
      await page.waitForTimeout(400);
      const pTerms = path.join(ARTIFACT_DIR, `step-14-8-terms-${vp.name}-${theme}.png`);
      await page.screenshot({ path: pTerms });
      console.log(`Saved: step-14-8-terms-${vp.name}-${theme}.png`);

      // 2. /privacy
      await page.goto('http://localhost:5175/privacy', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1:has-text("Privacy Policy")');
      await page.waitForTimeout(400);
      const pPrivacy = path.join(ARTIFACT_DIR, `step-14-8-privacy-${vp.name}-${theme}.png`);
      await page.screenshot({ path: pPrivacy });
      console.log(`Saved: step-14-8-privacy-${vp.name}-${theme}.png`);

      // 3. /rewards-rules
      await page.goto('http://localhost:5175/rewards-rules', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1:has-text("Rewards Rules")');
      await page.waitForTimeout(400);
      const pRules = path.join(ARTIFACT_DIR, `step-14-8-rewards-rules-${vp.name}-${theme}.png`);
      await page.screenshot({ path: pRules });
      console.log(`Saved: step-14-8-rewards-rules-${vp.name}-${theme}.png`);

      await context.close();
    }
  }

  await browser.close();
  server.close();
  console.log('Successfully captured updated legal pages screenshots!');
}

run().catch(console.error);
