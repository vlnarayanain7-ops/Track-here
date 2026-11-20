import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import auth from '../middleware/auth.js';
import csrf from '../middleware/csrf.js';
import validate from '../middleware/validate.js';
import wrap from '../utils/asyncHandler.js';
import Circle from '../models/StudyCircle.js';

const router = Router();
const activities = ['Finished a focus session', 'Reviewed a topic', 'Completed a practice task'];
const createSchema = z.object({ name: z.string().trim().min(1).max(50), target: z.number().int().min(1).max(56) });
const dayKey = date => date.toISOString().slice(0, 10);
function weekStart(date) {
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return dayKey(monday);
}
function view(circle, userId) {
  const now = new Date();
  const start = weekStart(now);
  const mine = circle.members.find(m => String(m.user) === userId);
  const info = { id: circle._id, name: circle.name, target: circle.target, size: circle.members.length, joined: !!mine };
  if (!mine) return info;
  const checkIns = circle.members.flatMap((m, i) => m.checkIns.filter(c => c.day >= start).map(c => ({
    member: String(m._id), label: String(m.user) === userId ? 'You' : 'Study partner ' + (i + 1),
    mine: String(m.user) === userId, day: c.day, activity: c.activity, cheers: c.cheers.length,
    cheered: c.cheers.some(id => String(id) === userId),
  }))).sort((a, b) => b.day.localeCompare(a.day));
  return { ...info, checkIns, checkedToday: mine.checkIns.some(c => c.day === dayKey(now)) };
}

router.use(auth, csrf);
router.get('/', wrap(async (req, res) => {
  const circles = await Circle.find({ 'members.user': req.user.id }).sort({ updatedAt: -1 }).lean();
  res.json(circles.map(c => {
    const { id, name, size, target, checkIns } = view(c, req.user.id);
    return { id, name, size, target, count: checkIns.length };
  }));
}));
router.post('/', validate(createSchema), wrap(async (req, res) => {
  const row = await Circle.create({ name: req.body.name, target: req.body.target, members: [{ user: req.user.id }] });
  res.status(201).json({ id: row.id });
}));
router.get('/:id', wrap(async (req, res) => {
  const circle = await Circle.findById(req.params.id).lean();
  if (!circle || !circle.members.length) return res.status(404).json({ message: 'This circle is unavailable.' });
  res.json(view(circle, req.user.id));
}));
router.post('/:id/join', wrap(async (req, res) => {
  const id = req.params.id, user = req.user.id;
  const updated = await Circle.updateOne({ _id: id, 'members.user': { $ne: user }, 'members.0': { $exists: true }, 'members.7': { $exists: false } },
    { $push: { members: { user, checkIns: [] } } });
  if (!updated.modifiedCount && !await Circle.exists({ _id: id, 'members.user': user })) return res.status(409).json({ message: 'This circle is full or unavailable.' });
  res.json({ joined: true });
}));
router.post('/:id/check-in', validate(z.object({ activity: z.enum(activities) })), wrap(async (req, res) => {
  const today = dayKey(new Date());
  const result = await Circle.updateOne({ _id: req.params.id, members: { $elemMatch: { user: req.user.id, 'checkIns.day': { $ne: today } } } },
    { $push: { 'members.$.checkIns': { $each: [{ day: today, activity: req.body.activity, cheers: [] }], $slice: -7 } } });
  if (!result.modifiedCount) return res.status(409).json({ message: 'Already checked in today or the circle is unavailable.' });
  res.json({ saved: true });
}));
router.post('/:id/cheer', validate(z.object({ member: z.string().regex(/^[a-f0-9]{24}$/), day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })), wrap(async (req, res) => {
  const { member, day } = req.body;
  const target = new mongoose.Types.ObjectId(member);
  const result = await Circle.updateOne({ _id: req.params.id, 'members.user': req.user.id,
    members: { $elemMatch: { _id: target, user: { $ne: req.user.id }, 'checkIns.day': day } } },
    { $addToSet: { 'members.$[partner].checkIns.$[entry].cheers': req.user.id } },
    { arrayFilters: [{ 'partner._id': target }, { 'entry.day': day }] });
  if (!result.matchedCount) return res.status(404).json({ message: 'This check-in is unavailable.' });
  res.json({ cheered: true });
}));
router.post('/:id/leave', wrap(async (req, res) => {
  await Circle.updateOne({ _id: req.params.id }, { $pull: { members: { user: req.user.id } } });
  await Circle.updateOne({ _id: req.params.id }, { $pull: { 'members.$[].checkIns.$[].cheers': req.user.id } });
  await Circle.deleteOne({ _id: req.params.id, members: { $size: 0 } });
  res.json({ left: true });
}));
export default router;
