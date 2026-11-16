import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/track-here';

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: 'vlnarayana.in7@gmail.com' });
  console.log('User found:', user?._id, user?.name, user?.email);

  const dailies = await db.collection('dailytotals').find({ user: user._id }).sort({ date: 1 }).toArray();
  console.log('--- ALL DAILY TOTALS FOR USER ---');
  console.log(dailies);

  const sessions = await db.collection('studysessions').find({ user: user._id }).sort({ startTime: 1, startedAt: 1 }).toArray();
  console.log('--- ALL SESSIONS FOR USER ---');
  sessions.forEach(s => {
    console.log({
      id: s._id,
      date: s.date,
      startTime: s.startTime,
      startedAt: s.startedAt,
      durationSec: s.durationSec,
      focusDuration: s.focusDuration,
      source: s.source,
      heartbeatOk: s.heartbeatOk,
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
