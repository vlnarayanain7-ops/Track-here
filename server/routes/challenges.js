import { Router } from 'express';
import auth from '../middleware/auth.js';
import csrf from '../middleware/csrf.js';
import wrap from '../utils/asyncHandler.js';
import Challenge from '../models/FriendChallenge.js';
import Session from '../models/StudySession.js';

const router = Router();
const day = 86400000;
router.use(auth, csrf);
router.get('/', wrap(async (req, res) => {
  const rows = await Challenge.find({ members: req.user.id }).sort({ started: -1 }).limit(30).select('started ends').lean();
  res.json(rows);
}));
router.post('/', wrap(async (req, res) => {
  const started = new Date();
  const goalDays = req.body?.goalDays ?? 5;
  if (![3, 5, 7].includes(goalDays)) return res.status(400).json({ message: 'Choose a goal of three, five or seven days.' });
  const row = await Challenge.create({ members: [req.user.id], started, goalDays, ends: new Date(+started + 7 * day) });
  res.status(201).json({ id: row.id });
}));
router.post('/:id/join', wrap(async (req, res) => {
  const row = await Challenge.findOneAndUpdate({
    _id: req.params.id, ends: { $gt: new Date() },
    $or: [{ members: req.user.id }, { 'members.7': { $exists: false } }],
  }, { $addToSet: { members: req.user.id } });
  if (!row) return res.status(409).json({ message: 'This challenge is full, expired, or unavailable.' });
  res.json({ joined: true });
}));
router.post('/:id/cheer', wrap(async (req, res) => {
  const result = await Challenge.updateOne({ _id: req.params.id, members: req.user.id },
    { $addToSet: { cheers: req.user.id } });
  if (!result.matchedCount) return res.status(404).json({ message: 'Challenge unavailable.' });
  res.json({ cheered: true });
}));
router.get('/:id', wrap(async (req, res) => {
  const row = await Challenge.findById(req.params.id).lean();
  if (!row) return res.status(404).json({ message: 'Challenge could not be found.' });
  const result = { ends: row.ends, started: row.started, size: row.members.length, goalDays: row.goalDays ?? 5 };
  if (!row.members.some(id => String(id) === req.user.id)) return res.json(result);
  result.cheers = row.cheers?.length || 0;
  result.cheered = row.cheers?.some(id => String(id) === req.user.id) || false;
  const totals = await Session.aggregate([
    { $match: { user: { $in: row.members }, $or: [{ source: 'timer' }, { isTimerSession: true }],
      'timerState.status': { $nin: ['running', 'paused'] } } },
    { $set: { time: { $ifNull: ['$startedAt', '$startTime', '$date'] } } },
    { $match: { time: { $gte: row.started, $lt: new Date(Math.min(Date.now(), +row.ends)) } } },
    { $group: { _id: { user: '$user', day: { $floor: { $divide: [{ $subtract: ['$time', row.started] }, day] } } },
      seconds: { $sum: { $cond: [{ $gt: ['$durationSec', 0] }, '$durationSec', { $multiply: ['$focusDuration', 60] }] } } } },
    { $match: { seconds: { $gte: 1500 } } },
    { $group: { _id: '$_id.user', days: { $sum: 1 } } },
  ]);
  result.members = row.members.map((id, index) => ({
    label: String(id) === req.user.id ? 'You' : 'Study partner ' + (index + 1),
    days: totals.find(t => String(t._id) === String(id))?.days || 0,
  }));
  res.json(result);
}));
export default router;
