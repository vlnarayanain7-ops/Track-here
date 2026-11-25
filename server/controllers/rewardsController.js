import { verifiedDays } from '../lib/milestones.js';
import { z } from 'zod';
import { Proof, Claim, Certificate } from '../models/rewards.js';
import User from '../models/User.js';
import {
  MILESTONE_MINUTES,
  todayIn,
  currentRun,
} from '../lib/streaks.js';

export function physicalRewardsClosed(_req, res) {
  return res.status(410).json({ error: 'closed', message: 'New physical reward submissions are closed.' });
}

export const submitProof = physicalRewardsClosed;
export const claimSurprise = physicalRewardsClosed;

export async function reviewProof(req, res) {
  // admin only
  const { status, note } = z
    .object({
      status: z.enum(['approved', 'rejected']),
      note: z.string().max(300).optional(),
    })
    .strict()
    .parse(req.body);

  const p = await Proof.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    {
      status,
      reviewNote: note,
      reviewedAt: new Date(),
      files: [],
      expireAt: new Date(Date.now() + 400 * 864e5),
    },
    { returnDocument: 'after' }
  ); // images are deleted now

  if (!p) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
}

export const requireAdmin = async (req, res, next) => {
  const admins = (process.env.ADMIN_USER_IDS || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!admins.includes(String(req.user.id))) return res.status(404).json({ error: 'not_found' });
  next();
};

export async function getRewardsMe(req, res) {
  const user = await User.findById(req.user.id)
    .select('ageBand rewardRun bestRewardRun milestones timezone')
    .lean();
  const tz = user?.timezone || 'Asia/Kolkata';
  const today = todayIn(tz);
  const valid = await verifiedDays(req.user.id, tz);
  const milestoneRun = currentRun(valid, MILESTONE_MINUTES, today);
  const proofs = await Proof.find({ user: req.user.id })
    .select('month status note link reviewNote reviewedAt submittedAt')
    .lean();
  const cert = await Certificate.findOne({ user: req.user.id, milestone: 30 }).lean();
  const claim = await Claim.findOne({ user: req.user.id }).select('status createdAt').lean();

  res.json({
    milestoneRun,
    rewardRun: user?.rewardRun || 0,
    bestRewardRun: user?.bestRewardRun || 0,
    milestones: (user?.milestones || []).map((m) => m.days),
    proofs,
    eligible: false,
    certificate: cert
      ? {
          serial: cert.serial,
          issuedAt: cert.issuedAt,
          showName: cert.showName,
          displayName: cert.displayName,
        }
      : null,
    claim: claim || null,
  });
}

export async function updateCertificatePreferences(req, res) {
  const schema = z
    .object({
      showName: z.boolean().optional(),
      displayName: z.string().trim().max(60).optional(),
    })
    .strict();
  const b = schema.parse(req.body);
  const cert = await Certificate.findOneAndUpdate(
    { user: req.user.id, milestone: 30 },
    { $set: b },
    { returnDocument: 'after' }
  );
  if (!cert) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true, certificate: cert });
}

export default {
  submitProof,
  reviewProof,
  claimSurprise,
  requireAdmin,
  getRewardsMe,
  updateCertificatePreferences,
};
