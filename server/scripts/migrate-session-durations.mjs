// server/scripts/migrate-session-durations.mjs
// Dry-run migration script for legacy study session shapes
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const isDryRun = !process.argv.includes('--execute');

async function main() {
  const { default: StudySession } = await import('../models/StudySession.js');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trackhere';
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  } catch (err) {
    console.warn(`Could not connect to ${uri}, trying in-memory fallback for verification...`);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }

  const count = await StudySession.countDocuments({});
  console.log(`[migration] Total study sessions found in database: ${count}`);

  const cursor = StudySession.find({}).cursor();
  let needsMigrationCount = 0;
  const sampleChanges = [];

  for await (const s of cursor) {
    const hasDurationSec = Number.isFinite(s.durationSec) && s.durationSec > 0;
    
    if (!hasDurationSec) {
      let computedSec = null;
      if (Number.isFinite(s.durationMinutes) && s.durationMinutes > 0) {
        computedSec = s.durationMinutes * 60;
      } else if (Number.isFinite(s.focusDuration) && s.focusDuration > 0) {
        computedSec = s.focusDuration * 60;
      } else if (Number.isFinite(s.duration) && s.duration > 0) {
        computedSec = s.duration * 60;
      } else if (s.startedAt && s.endedAt) {
        computedSec = Math.max(0, Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 1000));
      } else if (s.startTime && s.endTime) {
        computedSec = Math.max(0, Math.round((new Date(s.endTime) - new Date(s.startTime)) / 1000));
      }

      if (computedSec != null && computedSec > 0) {
        needsMigrationCount++;
        if (sampleChanges.length < 5) {
          sampleChanges.push({
            _id: s._id,
            old: {
              focusDuration: s.focusDuration,
              duration: s.duration,
              durationSec: s.durationSec
            },
            newDurationSec: computedSec
          });
        }

        if (!isDryRun) {
          await StudySession.updateOne({ _id: s._id }, { $set: { durationSec: computedSec } });
        }
      }
    }
  }

  console.log(`[migration] Mode: ${isDryRun ? 'DRY RUN (no rows changed)' : 'EXECUTE'}`);
  console.log(`[migration] Rows needing durationSec backfill: ${needsMigrationCount}`);
  if (sampleChanges.length > 0) {
    console.log('[migration] Sample transformations:', JSON.stringify(sampleChanges, null, 2));
  }

  await mongoose.disconnect();
  console.log('[migration] Done.');
}

main().catch(err => {
  console.error('[migration] Error:', err);
  process.exit(1);
});
