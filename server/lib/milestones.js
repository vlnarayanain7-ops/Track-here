import crypto from 'crypto';
import { DailyTotal, Certificate } from '../models/rewards.js';
import User from '../models/User.js';
import { addDays, todayIn, currentRun, REWARD_MINUTES, MILESTONE_MINUTES } from './streaks.js';

const safeKey = (n) => String(n || 'none').replace(/[.$]/g, '_').slice(0, 40);

export async function applySession(user, session) { // call ONCE for each newly created session (skip duplicates)
  const tz = user?.timezone || 'Asia/Kolkata';
  const startedAt = session.startedAt || session.startTime || session.date || new Date();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(startedAt);
  const minutes = Math.round((session.durationSec || (session.focusDuration * 60)) / 60);
  const valid = session.source === 'timer' && session.heartbeatOk ? minutes : 0;
  const subject = session.subjectName || session.category || 'Focus';

  await DailyTotal.updateOne(
    { user: user._id || user.id, date },
    {
      $inc: {
        minutes,
        validMinutes: valid,
        sessions: 1,
        [`bySubject.${safeKey(subject)}`]: minutes,
      },
    },
    { upsert: true }
  );

  await checkMilestones(user._id || user.id, tz);
}

export async function checkMilestones(userId, tz) {
  const today = todayIn(tz);
  const rows = await DailyTotal.find({ user: userId, date: { $gte: addDays(today, -200) } })
    .select('date validMinutes')
    .lean();
  const valid = new Map(rows.map((r) => [r.date, r.validMinutes]));
  const milestoneRun = currentRun(valid, MILESTONE_MINUTES, today);
  const rewardRun = currentRun(valid, REWARD_MINUTES, today);

  for (const d of [7, 30]) {
    if (milestoneRun >= d) {
      await User.updateOne(
        { _id: userId, 'milestones.days': { $ne: d } },
        { $push: { milestones: { days: d, at: new Date() } } }
      ); // idempotent
    }
  }

  if (milestoneRun >= 30) {
    await ensureCertificate(userId);
  }

  await User.updateOne(
    { _id: userId },
    { $set: { rewardRun }, $max: { bestRewardRun: rewardRun } }
  );
}

export const serialFor = (userId, milestone) =>
  `TH${milestone}-${crypto
    .createHmac('sha256', process.env.CERT_SECRET || 'th-cert-default-secret-2026')
    .update(`${userId}:${milestone}`)
    .digest('base64url')
    .slice(0, 10)
    .toUpperCase()}`;

export async function ensureCertificate(userId) {
  try {
    await Certificate.create({ user: userId, milestone: 30, serial: serialFor(userId, 30) });
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
}

// Public, rate limited, no auth: GET /api/verify/:serial -> { valid, milestone, issuedAt, name? } and NOTHING else.
export async function verify(req, res) {
  const c = await Certificate.findOne({
    serial: String(req.params.serial).toUpperCase().slice(0, 20),
  }).lean();
  if (!c) return res.json({ valid: false });
  res.json({
    valid: true,
    milestone: c.milestone,
    issuedAt: c.issuedAt,
    ...(c.showName && c.displayName ? { name: c.displayName } : {}),
  });
}

export default {
  applySession,
  checkMilestones,
  serialFor,
  ensureCertificate,
  verify,
};
