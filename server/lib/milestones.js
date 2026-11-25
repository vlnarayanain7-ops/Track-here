import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import crypto from 'crypto';
import { Certificate } from '../models/rewards.js';
import User from '../models/User.js';
import { addDays, todayIn, currentRun, REWARD_MINUTES, MILESTONE_MINUTES } from './streaks.js';

export async function applySession(user, session) {
  if (!session.isTimerSession || !session.heartbeatOk) return;
  const userId = user._id || user.id;
  const timezone = user.timezone || (await User.findById(userId).select('timezone').lean())?.timezone || 'Asia/Kolkata';
  await checkMilestones(userId, timezone);
}

export async function verifiedDays(userId, timezone) {
  const rows = await StudySession.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(String(userId)), isTimerSession: true, source: 'timer',
      heartbeatOk: true, 'timerState.status': 'completed', startedAt: { $gte: new Date(Date.now() - 202 * 86400000) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', timezone, date: '$startedAt' } }, seconds: { $sum: '$durationSec' } } },
  ]);
  return new Map(rows.map(row => [row._id, Math.floor(row.seconds / 60)]));
}

export async function checkMilestones(userId, tz) {
  const today = todayIn(tz);
  const valid = await verifiedDays(userId, tz);
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
    .createHmac('sha256', process.env.CERT_SECRET || process.env.JWT_ACCESS_SECRET)
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
