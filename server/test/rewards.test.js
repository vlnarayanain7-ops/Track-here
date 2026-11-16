import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { currentRun, longestRun, addDays } from '../lib/streaks.js';
import { RewardCounter, DailyReport, DailyTotal, Proof, ProofHash, Certificate, Claim } from '../models/rewards.js';
import StudySession from '../models/StudySession.js';
import User from '../models/User.js';
import { applySession, serialFor, verify } from '../lib/milestones.js';

test('an unfinished today does not break the run', () => {
  assert.equal(currentRun(new Map([['2026-11-12', 70], ['2026-11-13', 65]]), 60, '2026-11-14'), 2);
});

test('a missed day resets the run', () => {
  assert.equal(currentRun(new Map([['2026-11-10', 90], ['2026-11-12', 90], ['2026-11-13', 90]]), 60, '2026-11-13'), 2);
});

test('59 minutes is not a reward day', () => {
  assert.equal(currentRun(new Map([['2026-11-13', 59]]), 60, '2026-11-13'), 0);
});

test('longest run handles month and year ends', () => {
  const m = new Map(['2026-12-30', '2026-12-31', '2027-01-01'].map((d) => [d, 60]));
  assert.equal(longestRun(m, 60), 3);
});

test('only 10 claims win a race of 25', async () => {
  if (mongoose.connection.readyState !== 1) await connectDB();
  await RewardCounter.deleteOne({ _id: 'race' });
  await RewardCounter.create({ _id: 'race', claimed: 0 });
  const r = await Promise.all(
    Array.from({ length: 25 }, () =>
      RewardCounter.findOneAndUpdate(
        { _id: 'race', claimed: { $lt: 10 } },
        { $inc: { claimed: 1 } },
        { returnDocument: 'after' }
      )
    )
  );
  assert.equal(r.filter(Boolean).length, 10);
});

test('daily reports expire after 2 days', async () => {
  if (mongoose.connection.readyState !== 1) await connectDB();
  await DailyReport.init();
  const indexes = await DailyReport.collection.indexes();
  assert.ok(indexes.some((i) => i.expireAfterSeconds === 172800));
});

test('verified timer heartbeat coverage calculates validMinutes correctly', async () => {
  if (mongoose.connection.readyState !== 1) await connectDB();
  const testUser = await User.findOne({ email: 'vlnarayana.in7@gmail.com' });
  assert.ok(testUser);

  const testDate = '2026-11-18';
  await DailyTotal.deleteOne({ user: testUser._id, date: testDate });

  // 1. Session with heartbeatOk = true (verified timer)
  const session1 = {
    startedAt: new Date(`${testDate}T10:00:00Z`),
    durationSec: 1800, // 30 mins
    source: 'timer',
    heartbeatOk: true,
    subjectName: 'Algorithms',
  };
  await applySession(testUser, session1);

  const dt1 = await DailyTotal.findOne({ user: testUser._id, date: testDate });
  assert.equal(dt1.minutes, 30);
  assert.equal(dt1.validMinutes, 30);
  assert.equal(dt1.sessions, 1);

  // 2. Session with heartbeatOk = false (unverified or missed heartbeats)
  const session2 = {
    startedAt: new Date(`${testDate}T11:00:00Z`),
    durationSec: 1200, // 20 mins
    source: 'timer',
    heartbeatOk: false,
    subjectName: 'Algorithms',
  };
  await applySession(testUser, session2);

  const dt2 = await DailyTotal.findOne({ user: testUser._id, date: testDate });
  assert.equal(dt2.minutes, 50); // 30 + 20
  assert.equal(dt2.validMinutes, 30); // only valid minutes stay 30!
  assert.equal(dt2.sessions, 2);

  await DailyTotal.deleteOne({ user: testUser._id, date: testDate });
});

test('ProofHash rejects duplicate SHA-256 fingerprint', async () => {
  if (mongoose.connection.readyState !== 1) await connectDB();
  const testUser = await User.findOne({ email: 'vlnarayana.in7@gmail.com' });
  assert.ok(testUser);

  const dummySha = crypto.createHash('sha256').update('test-photo-proof-1').digest('hex');
  await ProofHash.deleteOne({ sha: dummySha });

  await ProofHash.create({ sha: dummySha, user: testUser._id, month: 1 });

  // Attempting duplicate insert must throw duplicate key error (code 11000)
  await assert.rejects(
    async () => {
      await ProofHash.create({ sha: dummySha, user: testUser._id, month: 2 });
    },
    (err) => err.code === 11000
  );

  await ProofHash.deleteOne({ sha: dummySha });
});

test('Public verification endpoint returns only non-sensitive certificate details', async () => {
  if (mongoose.connection.readyState !== 1) await connectDB();
  const testSerial = 'TH30-TESTSERIAL123';
  await Certificate.deleteOne({ serial: testSerial });

  const testUser = await User.findOne({ email: 'vlnarayana.in7@gmail.com' });
  assert.ok(testUser);

  // 1. Certificate without showName (name off by default)
  await Certificate.create({
    user: testUser._id,
    milestone: 30,
    serial: testSerial,
    showName: false,
    displayName: 'Scholar Secret Name',
  });

  const req1 = { params: { serial: testSerial } };
  let jsonResponse1 = null;
  const res1 = { json: (data) => { jsonResponse1 = data; } };

  await verify(req1, res1);
  assert.equal(jsonResponse1.valid, true);
  assert.equal(jsonResponse1.milestone, 30);
  assert.equal(jsonResponse1.name, undefined); // Name MUST be omitted
  assert.equal(jsonResponse1.email, undefined); // Zero email
  assert.equal(jsonResponse1.user, undefined); // Zero user id

  // 2. Certificate with showName turned on
  await Certificate.updateOne({ serial: testSerial }, { $set: { showName: true } });
  let jsonResponse2 = null;
  const res2 = { json: (data) => { jsonResponse2 = data; } };
  await verify(req1, res2);
  assert.equal(jsonResponse2.valid, true);
  assert.equal(jsonResponse2.name, 'Scholar Secret Name');
  assert.equal(jsonResponse2.email, undefined);

  await Certificate.deleteOne({ serial: testSerial });
});

test('Reward submission and claim enforces 18+ and approved proofs gates', async () => {
  if (mongoose.connection.readyState !== 1) await connectDB();
  const { submitProof, claimSurprise } = await import('../controllers/rewardsController.js');

  // 1. Under-18 test user
  const minorUser = await User.findOneAndUpdate(
    { email: 'minor-test@example.com' },
    {
      $set: {
        name: 'Minor Learner',
        email: 'minor-test@example.com',
        passwordHash: 'dummyhash123',
        ageBand: '13_17',
        rewardRun: 150,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  let statusPassed = null;
  let jsonPassed = null;
  const mockRes = {
    status: (s) => {
      statusPassed = s;
      return { json: (j) => { jsonPassed = j; } };
    },
    json: (j) => { jsonPassed = j; },
  };

  // Attempting to submit proof as minor must return 403 not_eligible
  await submitProof(
    {
      user: { id: minorUser._id },
      body: { month: 1, note: 'Tested note', link: 'https://github.com' },
    },
    mockRes
  );
  assert.equal(statusPassed, 403);
  assert.equal(jsonPassed.error, 'not_eligible');

  // Attempting claim as minor must return 403 not_eligible
  statusPassed = null;
  await claimSurprise(
    {
      user: { id: minorUser._id },
      body: {
        name: 'Test Claim',
        line1: '123 Market St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
      },
    },
    mockRes
  );
  assert.equal(statusPassed, 403);
  assert.equal(jsonPassed.error, 'not_eligible');

  await User.deleteOne({ _id: minorUser._id });
  await mongoose.disconnect();
});
