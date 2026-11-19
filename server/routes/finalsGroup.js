import { Router } from 'express';
import { z } from 'zod';
import { startOfISOWeek, parseISO, format, differenceInCalendarDays } from 'date-fns';
import auth from '../middleware/auth.js';
import csrf from '../middleware/csrf.js';
import validate from '../middleware/validate.js';
import ApiError from '../utils/ApiError.js';
import Membership from '../models/FinalsMembership.js';
import StudySession from '../models/StudySession.js';

const router = Router();
router.use(auth, csrf);

router.get('/', async (req, res) => {
  const member = await Membership.findById(req.user.id).lean();
  if (!member) return res.json(null);
  const [totals] = await Membership.aggregate([
    { $match: { week: member.week } },
    { $group: { _id: null, members: { $sum: 1 }, sessions: { $sum: { $size: '$shared' } } } },
  ]);
  res.json({ week: member.week, goal: member.goal, mine: member.shared.length,
    members: totals?.members ?? 0, sessions: totals?.sessions ?? 0 });
});

router.put('/', validate(z.object({ exam: z.iso.date(), goal: z.number().int().min(1).max(84) })), async (req, res) => {
  const exam = parseISO(req.body.exam);
  const ahead = differenceInCalendarDays(exam, new Date());
  // One calendar day of slack for students across time zones.
  if (ahead < -1 || ahead > 91) throw ApiError.badRequest('Choose an upcoming exam within 90 days.');
  const week = format(startOfISOWeek(exam), 'yyyy-MM-dd');
  if (await Membership.exists({ _id: req.user.id, week: { $ne: week } })) {
    throw ApiError.conflict('Leave your current group before joining a different exam week.');
  }
  try {
    await Membership.updateOne({ _id: req.user.id, week }, {
      $set: { goal: req.body.goal }, $setOnInsert: { joinedAt: new Date(), shared: [] },
    }, { upsert: true });
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('Your group changed. Refresh and try again.');
    throw err;
  }
  res.sendStatus(204);
});

router.post('/check-in', async (req, res) => {
  const member = await Membership.findById(req.user.id).lean();
  if (!member) throw ApiError.badRequest('Join a group first.');
  const session = await StudySession.findOne({
    user: req.user.id, source: 'timer', date: { $gte: member.joinedAt, $lte: new Date() },
    'timerState.status': { $nin: ['running', 'paused'] },
    $or: [{ durationSec: { $gte: 60 } }, { durationSec: null, focusDuration: { $gte: 1 } }],
  }).sort({ date: -1, _id: -1 }).select('_id').lean();
  if (!session) throw ApiError.badRequest('Finish and sync a focus session after joining, then check in.');
  const result = await Membership.updateOne({ _id: member._id, joinedAt: member.joinedAt },
    { $addToSet: { shared: session._id } });
  if (!result.matchedCount) throw ApiError.conflict('Your membership changed. Refresh and try again.');
  res.json({ added: result.modifiedCount > 0 });
});

router.delete('/', async (req, res) => {
  await Membership.deleteOne({ _id: req.user.id });
  res.sendStatus(204);
});
export default router;
