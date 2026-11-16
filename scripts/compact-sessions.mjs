// scripts/compact-sessions.mjs
// Compacts raw sessions older than 180 days after verifying DailyTotal exists
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/track-here';

async function main() {
  console.log('Connecting to database for monthly compaction...');
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  const sessionsCol = db.collection('studysessions');
  const dailyTotalCol = db.collection('dailytotals');

  const cutoff = new Date(Date.now() - 180 * 864e5);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  console.log(`Compaction cutoff: ${cutoffStr} (older than 180 days)`);

  const oldSessions = await sessionsCol.find({
    $or: [
      { startTime: { $lt: cutoff } },
      { startedAt: { $lt: cutoff } },
      { date: { $lt: cutoff } },
      { createdAt: { $lt: cutoff } },
    ],
  }).toArray();

  console.log(`Found ${oldSessions.length} candidate sessions older than 180 days.`);

  let deletedCount = 0;
  let skippedCount = 0;

  for (const session of oldSessions) {
    const rawDate = session.startedAt || session.startTime || session.date || session.createdAt;
    const dateStr = new Date(rawDate).toISOString().split('T')[0];
    const userId = session.user;

    // Verify DailyTotal exists before deleting raw session
    const hasDaily = await dailyTotalCol.findOne({ user: userId, date: dateStr });
    if (hasDaily) {
      await sessionsCol.deleteOne({ _id: session._id });
      deletedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`Compaction complete: Deleted ${deletedCount} raw sessions verified in DailyTotal. Skipped ${skippedCount} missing daily totals.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Compaction failed:', err);
  process.exit(1);
});
