// tests/_guard.mjs - import this first in every test file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../server/.env');

if (fs.existsSync(envPath) && !process.env.MONGODB_URI_TEST) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('MONGODB_URI_TEST=')) {
      process.env.MONGODB_URI_TEST = trimmed.substring('MONGODB_URI_TEST='.length).trim();
      break;
    }
  }
}

const uri = process.env.MONGODB_URI_TEST || '';
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(uri)) {
  console.error('Refusing to run tests: MONGODB_URI_TEST must point at localhost');
  process.exit(1);
}
