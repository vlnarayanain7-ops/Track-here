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

/**
 * Automatically cleans up any test users created during test execution
 */
export async function teardownTestUsers() {
  try {
    const mongoose = (await import('mongoose')).default;
    const targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trackhere';
    const conn = await mongoose.connect(targetUri);
    const db = conn.connection.db;
    const testPattern = /(@trackhere\.test|@trackhere\.dev|@example\.com|ravi@nmtl\.gov\.in|@test\.com|test_|_test_|usera_|userb_|prod_a_|prod_b_|no_csrf_|hacker@|teen_|adult_|u13_|kolkata_|la_|wanderer_)/i;
    const testUsers = await db.collection('users').find({ email: { $regex: testPattern } }).toArray();
    if (testUsers.length > 0) {
      const ids = testUsers.map((u) => u._id);
      await Promise.allSettled([
        db.collection('users').deleteMany({ _id: { $in: ids } }),
        db.collection('studysessions').deleteMany({ user: { $in: ids } }),
        db.collection('tasks').deleteMany({ user: { $in: ids } }),
        db.collection('notes').deleteMany({ user: { $in: ids } }),
        db.collection('refreshsessions').deleteMany({ user: { $in: ids } }),
        db.collection('dailytotals').deleteMany({ user: { $in: ids } }),
      ]);
    }
    await mongoose.disconnect();
  } catch {
    // Non-blocking cleanup
  }
}
