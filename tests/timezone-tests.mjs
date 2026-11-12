import mongoose from '../server/node_modules/mongoose/index.js';
import { MongoMemoryServer } from '../server/node_modules/mongodb-memory-server/index.js';

import User from '../server/models/User.js';
import StudySession from '../server/models/StudySession.js';
import { getStreakInfo } from '../server/services/streakService.js';
import { getStudyTimeStats, getHeatmapData } from '../server/services/analyticsService.js';

let mongod;

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(msg);
  }
  console.log(`  ✅ ${msg}`);
};

async function runTimezoneTests() {
  console.log('\n🌍 ========================================');
  console.log('   RUNNING COMPREHENSIVE TIMEZONE SUITE');
  console.log('   (Asia/Kolkata & America/Los_Angeles)');
  console.log('========================================\n');

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  try {
    // ─── Test 1: Asia/Kolkata Midnight Boundary Tests ─────────────────────────
    console.log('▶ [Test 1] Asia/Kolkata Midnight Boundary Attribution');

    const kolkataUser = await User.create({
      name: 'Kolkata Student',
      email: 'kolkata@student.dev',
      password: 'password123',
      timezone: 'Asia/Kolkata',
      dailyStudyGoal: 240,
    });

    // 2026-03-10 23:50:00 IST -> 2026-03-10 18:20:00 UTC
    const sessionDay1 = await StudySession.create({
      user: kolkataUser._id,
      category: 'DSA',
      activityType: 'Coding',
      topic: 'Graph BFS',
      date: new Date('2026-03-10T18:20:00.000Z'),
      focusDuration: 60,
    });

    // 2026-03-11 00:15:00 IST -> 2026-03-10 18:45:00 UTC (SAME UTC DATE, DIFFERENT IST DATE!)
    const sessionDay2 = await StudySession.create({
      user: kolkataUser._id,
      category: 'C++',
      activityType: 'Problem Solving',
      topic: 'Templates',
      date: new Date('2026-03-10T18:45:00.000Z'),
      focusDuration: 45,
    });

    const statsKolkata = await getStudyTimeStats(kolkataUser._id, 'daily', 'Asia/Kolkata', 365);
    const day1Stats = statsKolkata.find((s) => s.date === '2026-03-10');
    const day2Stats = statsKolkata.find((s) => s.date === '2026-03-11');

    assert(day1Stats?.totalMinutes === 60, '23:50 IST session correctly assigned to 2026-03-10');
    assert(day2Stats?.totalMinutes === 45, '00:15 IST session correctly assigned to 2026-03-11 (even though UTC is 2026-03-10)');

    // ─── Test 2: America/Los_Angeles Evening / Next-Day UTC Tests ─────────────
    console.log('\n▶ [Test 2] America/Los_Angeles Evening Attribution (PST)');

    const laUser = await User.create({
      name: 'California Coder',
      email: 'california@student.dev',
      password: 'password123',
      timezone: 'America/Los_Angeles',
      dailyStudyGoal: 180,
    });

    // 2026-01-15 21:30:00 PST -> 2026-01-16 05:30:00 UTC (Next day in UTC!)
    await StudySession.create({
      user: laUser._id,
      category: 'Competitive Programming',
      activityType: 'Coding',
      topic: 'Segment Tree',
      date: new Date('2026-01-16T05:30:00.000Z'),
      focusDuration: 90,
    });

    const statsLA = await getStudyTimeStats(laUser._id, 'daily', 'America/Los_Angeles', 365);
    const laJan15 = statsLA.find((s) => s.date === '2026-01-15');
    const laJan16 = statsLA.find((s) => s.date === '2026-01-16');

    assert(laJan15?.totalMinutes === 90, 'Evening 21:30 PST session correctly attributed to local date 2026-01-15 (not UTC 2026-01-16)');
    assert((laJan16?.totalMinutes || 0) === 0, 'Next UTC day 2026-01-16 has 0 minutes in LA local time');

    // ─── Test 3: Daylight Saving Time Transition (Spring Forward: March 8, 2026) ─
    console.log('\n▶ [Test 3] America/Los_Angeles Daylight Saving (Spring Forward: 2026-03-08)');

    // In 2026, US Spring Forward occurred on Sunday, March 8:
    // PST (UTC-8) -> PDT (UTC-7)
    // March 7: PST (UTC-8). 10:00 AM PST = 18:00 UTC
    // March 8: Transition day (23 hours long). 10:00 AM PDT = 17:00 UTC
    // March 9: PDT (UTC-7). 10:00 AM PDT = 17:00 UTC

    await StudySession.create({
      user: laUser._id,
      category: 'DSA',
      activityType: 'Coding',
      topic: 'Trie Insert',
      date: new Date('2026-03-07T18:00:00.000Z'), // 10:00 AM PST
      focusDuration: 40,
    });

    await StudySession.create({
      user: laUser._id,
      category: 'DSA',
      activityType: 'Coding',
      topic: 'Trie Search',
      date: new Date('2026-03-08T17:00:00.000Z'), // 10:00 AM PDT (Post-spring forward)
      focusDuration: 50,
    });

    await StudySession.create({
      user: laUser._id,
      category: 'DSA',
      activityType: 'Coding',
      topic: 'Trie Delete',
      date: new Date('2026-03-09T17:00:00.000Z'), // 10:00 AM PDT
      focusDuration: 45,
    });

    const dstStats = await getStudyTimeStats(laUser._id, 'daily', 'America/Los_Angeles', 365);
    const mar7 = dstStats.find((s) => s.date === '2026-03-07');
    const mar8 = dstStats.find((s) => s.date === '2026-03-08');
    const mar9 = dstStats.find((s) => s.date === '2026-03-09');

    assert(mar7?.totalMinutes === 40, 'Pre-DST Saturday March 7 total = 40 mins');
    assert(mar8?.totalMinutes === 50, 'DST Transition Sunday March 8 total = 50 mins');
    assert(mar9?.totalMinutes === 45, 'Post-DST Monday March 9 total = 45 mins');

    // ─── Test 4: Daylight Saving Time Transition (Fall Back: November 1, 2026) ─
    console.log('\n▶ [Test 4] America/Los_Angeles Daylight Saving (Fall Back: 2026-11-01)');

    // In 2026, US Fall Back occurred on Sunday, November 1:
    // PDT (UTC-7) -> PST (UTC-8)
    // Oct 31: PDT (UTC-7). 23:30 PDT = Nov 1 06:30 UTC
    // Nov 1: Transition day (25 hours long). 02:30 PST = 10:30 UTC

    await StudySession.create({
      user: laUser._id,
      category: 'C++',
      activityType: 'Coding',
      topic: 'Smart Pointers',
      date: new Date('2026-11-01T06:30:00.000Z'), // Oct 31 23:30 PDT
      focusDuration: 35,
    });

    await StudySession.create({
      user: laUser._id,
      category: 'C++',
      activityType: 'Coding',
      topic: 'Weak Pointers',
      date: new Date('2026-11-01T10:30:00.000Z'), // Nov 1 02:30 PST
      focusDuration: 30,
    });

    const fallBackStats = await getStudyTimeStats(laUser._id, 'daily', 'America/Los_Angeles', 90);
    const oct31 = fallBackStats.find((s) => s.date === '2026-10-31');
    const nov1 = fallBackStats.find((s) => s.date === '2026-11-01');

    assert(oct31?.totalMinutes === 35, 'Late Oct 31 PDT session correctly falls on 2026-10-31');
    assert(nov1?.totalMinutes === 30, 'Early Nov 1 PST session correctly falls on 2026-11-01');

    // ─── Test 5: Dynamic Timezone Switching ───────────────────────────────────
    console.log('\n▶ [Test 5] Dynamic Timezone Recalculation Across Perspectives');

    // A single timestamp: 2026-06-15 01:30:00 UTC
    // In America/Los_Angeles (PDT, UTC-7): 2026-06-14 18:30:00 (June 14th)
    // In Asia/Kolkata (IST, UTC+5:30): 2026-06-15 07:00:00 (June 15th)

    const wanderer = await User.create({
      name: 'Global Scholar',
      email: 'global@student.dev',
      password: 'password123',
      timezone: 'America/Los_Angeles',
    });

    await StudySession.create({
      user: wanderer._id,
      category: 'DSA',
      activityType: 'Problem Solving',
      topic: 'Dijkstra',
      date: new Date('2026-06-15T01:30:00.000Z'),
      focusDuration: 60,
    });

    const laPerspective = await getStudyTimeStats(wanderer._id, 'daily', 'America/Los_Angeles', 365);
    const laJune14 = laPerspective.find((s) => s.date === '2026-06-14');
    const laJune15 = laPerspective.find((s) => s.date === '2026-06-15');

    assert(laJune14?.totalMinutes === 60, 'From LA perspective, session is on 2026-06-14');
    assert((laJune15?.totalMinutes || 0) === 0, 'From LA perspective, 2026-06-15 is empty');

    // Recalculate from Kolkata perspective
    const kolkataPerspective = await getStudyTimeStats(wanderer._id, 'daily', 'Asia/Kolkata', 365);
    const kolJune14 = kolkataPerspective.find((s) => s.date === '2026-06-14');
    const kolJune15 = kolkataPerspective.find((s) => s.date === '2026-06-15');

    assert((kolJune14?.totalMinutes || 0) === 0, 'From Kolkata perspective, 2026-06-14 is empty');
    assert(kolJune15?.totalMinutes === 60, 'From Kolkata perspective, session is on 2026-06-15');

    console.log('\n🌟 ========================================');
    console.log('   ALL TIMEZONE AND DST TESTS PASSED! 5/5');
    console.log('========================================\n');
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
}

runTimezoneTests().catch((err) => {
  console.error('Fatal timezone test error:', err);
  process.exit(1);
});

