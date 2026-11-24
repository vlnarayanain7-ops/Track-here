import crypto from 'crypto';
import { z } from 'zod';
import { Proof, ProofHash, Claim, RewardCounter, Certificate, DailyTotal } from '../models/rewards.js';
import User from '../models/User.js';
import {
  REWARD_DAYS,
  REWARD_SLOTS,
  MILESTONE_MINUTES,
  REWARD_MINUTES,
  todayIn,
  currentRun,
  addDays,
} from '../lib/streaks.js';

const MAGIC = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47] };
const isImage = (buf, type) =>
  type === 'image/webp'
    ? buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP'
    : MAGIC[type]?.every((b, i) => buf[i] === b);

const proofSchema = z
  .object({
    month: z.number().int().min(1).max(5),
    note: z.string().trim().max(300).default(''),
    link: z.string().url().max(300).optional(),
    files: z
      .array(
        z.object({
          type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
          data: z.string().max(280_000),
        })
      )
      .max(3)
      .default([]),
  })
  .strict();

export async function submitProof(req, res) {
  const b = proofSchema.parse(req.body);
  const user = await User.findById(req.user.id).select('ageBand rewardRun').lean();
  if (user.ageBand !== '18_plus')
    return res
      .status(403)
      .json({ error: 'not_eligible', message: 'This is available to users aged 18 and over.' });
  if (user.rewardRun < b.month * 30)
    return res
      .status(409)
      .json({ error: 'not_yet', message: 'Keep your streak going to unlock this month.' });
  if (!b.files.length && !b.link)
    return res.status(400).json({ error: 'empty', message: 'Add a photo or a link.' });

  const files = b.files.map((f) => {
    const data = Buffer.from(f.data, 'base64');
    if (data.length > 200_000 || !isImage(data, f.type))
      throw Object.assign(new Error('That file is not allowed.'), { status: 400 });
    return {
      data,
      type: f.type,
      sha: crypto.createHash('sha256').update(data).digest('hex'),
    };
  });

  const proof = await Proof.create({
    user: req.user.id,
    month: b.month,
    note: b.note,
    link: b.link,
    files,
    expireAt: new Date(Date.now() + 45 * 864e5),
  }).catch((e) => {
    if (e.code === 11000)
      throw Object.assign(new Error('You already submitted this month.'), { status: 409 });
    throw e;
  });

  try {
    await ProofHash.insertMany(files.map((f) => ({ sha: f.sha, user: req.user.id, month: b.month })));
  } catch {
    await Proof.deleteOne({ _id: proof._id });
    throw Object.assign(new Error('One of these files was already submitted before.'), {
      status: 409,
    });
  }

  res.status(201).json({ ok: true });
}

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

const addressSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    line1: z.string().trim().min(3).max(100),
    line2: z.string().trim().max(100).optional(),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().length(2).toUpperCase(),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
    phone: z.string().trim().max(20).optional(),
  })
  .strict();

export async function claimSurprise(req, res) {
  const address = addressSchema.parse(req.body);
  const user = await User.findById(req.user.id).select('ageBand rewardRun').lean();
  const approved = await Proof.countDocuments({ user: req.user.id, status: 'approved' });
  if (user.ageBand !== '18_plus' || user.rewardRun < REWARD_DAYS || approved < 5)
    return res.status(403).json({ error: 'not_eligible', message: 'Not eligible yet.' });

  const slot = await RewardCounter.findOneAndUpdate(
    { _id: 'surprise', claimed: { $lt: REWARD_SLOTS } },
    { $inc: { claimed: 1 } },
    { returnDocument: 'after' }
  );
  if (!slot)
    return res.status(409).json({ error: 'closed', message: 'All surprise rewards have been claimed.' });

  const addrHash = crypto
    .createHash('sha256')
    .update(`${address.line1}|${address.zip}`.toLowerCase().replace(/\s+/g, ''))
    .digest('hex');

  try {
    await Claim.create({ user: req.user.id, address, addrHash });
  } catch (e) {
    await RewardCounter.updateOne({ _id: 'surprise' }, { $inc: { claimed: -1 } }); // give the slot back
    if (e.code === 11000)
      return res
        .status(409)
        .json({ error: 'duplicate', message: 'A claim already exists for this person or address.' });
    throw e;
  }
  res.status(201).json({ ok: true });
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
  const rows = await DailyTotal.find({ user: req.user.id, date: { $gte: addDays(today, -200) } })
    .select('date validMinutes')
    .lean();
  const valid = new Map(rows.map((r) => [r.date, r.validMinutes]));
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
    eligible: user?.ageBand === '18_plus',
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
