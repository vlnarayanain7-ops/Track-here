import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import auth from '../middleware/auth.js';
import csrfProtection from '../middleware/csrf.js';
import { requireAdmin, reviewProof } from '../controllers/rewardsController.js';
import { Proof, Claim, RewardCounter } from '../models/rewards.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);
router.use(requireAdmin);

// Storage stats against free 512 MB limit
router.get('/stats', async (_req, res) => {
  const s = await mongoose.connection.db.stats();
  res.json({
    storageMB: +(s.storageSize / 1048576).toFixed(1),
    dataMB: +(s.dataSize / 1048576).toFixed(1),
    usedPct: Math.round((s.storageSize / (512 * 1048576)) * 100),
  });
});

// Pending proofs for admin review
router.get('/proofs', async (_req, res) => {
  const proofs = await Proof.find({ status: 'pending' })
    .populate('user', 'name email rewardRun')
    .sort({ submittedAt: -1 })
    .lean();
  res.json({ proofs });
});

router.post('/proofs/:id/review', reviewProof);

// Claims management
router.get('/claims', async (_req, res) => {
  const claims = await Claim.find()
    .populate('user', 'name email rewardRun')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ claims });
});

router.patch('/claims/:id', async (req, res) => {
  const { status } = z.object({
    status: z.enum(['pending', 'approved', 'shipped', 'rejected']),
  }).parse(req.body);

  const claim = await Claim.findById(req.params.id);
  if (!claim) return res.status(404).json({ error: 'not_found' });

  const prevStatus = claim.status;
  claim.status = status;

  if (status === 'rejected' && prevStatus !== 'rejected') {
    // Release the claimed counter slot atomically
    await RewardCounter.updateOne({ _id: 'surprise' }, { $inc: { claimed: -1 } });
    claim.purgeAt = new Date(Date.now() + 60 * 864e5);
  } else if (status === 'shipped') {
    claim.purgeAt = new Date(Date.now() + 60 * 864e5);
  }

  await claim.save();
  res.json({ ok: true, claim });
});

export default router;
