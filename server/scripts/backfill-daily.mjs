// server/scripts/backfill-daily.mjs: sessions -> DailyTotal in each user's own timezone
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import StudySession from '../models/StudySession.js';
import { DailyTotal } from '../models/rewards.js';

await connectDB();
console.log('Connected to DB for backfill');

const safeKey = (n) => String(n || 'Focus').replace(/[.$]/g, '_').slice(0, 40);

const users = await User.find().select('timezone').lean();
console.log(`Processing ${users.length} users...`);

for (const u of users) {
  const tz = u.timezone || 'Asia/Kolkata';

  // Aggregate sessions grouped by local date and category
  const rows = await StudySession.aggregate([
    { $match: { user: u._id } },
    {
      $project: {
        dateStr: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: { $ifNull: ['$startedAt', '$date'] },
            timezone: tz,
          },
        },
        mins: {
          $ifNull: [
            '$focusDuration',
            { $round: [{ $divide: ['$durationSec', 60] }, 0] },
          ],
        },
        category: { $ifNull: ['$subjectName', { $ifNull: ['$category', 'Focus'] }] },
      },
    },
    {
      $group: {
        _id: { date: '$dateStr', category: '$category' },
        minutes: { $sum: '$mins' },
        sessions: { $sum: 1 },
      },
    },
  ]);

  if (rows.length) {
    const dateMap = new Map();
    for (const r of rows) {
      const date = r._id.date;
      if (!date) continue;
      if (!dateMap.has(date)) {
        dateMap.set(date, { minutes: 0, sessions: 0, bySubject: {} });
      }
      const entry = dateMap.get(date);
      entry.minutes += r.minutes;
      entry.sessions += r.sessions;
      const catKey = safeKey(r._id.category);
      entry.bySubject[catKey] = (entry.bySubject[catKey] || 0) + r.minutes;
    }

    const bulkOps = [];
    for (const [date, data] of dateMap.entries()) {
      bulkOps.push({
        updateOne: {
          filter: { user: u._id, date },
          update: {
            $set: {
              minutes: data.minutes,
              sessions: data.sessions,
              bySubject: data.bySubject,
            },
            $setOnInsert: { validMinutes: 0 },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length) {
      await DailyTotal.bulkWrite(bulkOps);
    }
  }
}

console.log('done');
process.exit(0);
