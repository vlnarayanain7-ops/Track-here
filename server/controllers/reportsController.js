import { z } from 'zod';
import { DailyTotal, DailyReport } from '../models/rewards.js';
import { addDays } from '../lib/streaks.js';

export async function weekly(req, res) { // available any time, nothing stored
  const start = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.start);
  const rows = await DailyTotal.find({ user: req.user.id, date: { $gte: start, $lte: addDays(start, 6) } }).lean();
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    return { date: d, minutes: byDate.get(d)?.minutes ?? 0 };
  });

  const subjects = new Map();
  rows.forEach((r) => {
    const entries = r.bySubject instanceof Map ? r.bySubject.entries() : Object.entries(r.bySubject ?? {});
    for (const [k, v] of entries) {
      subjects.set(k, (subjects.get(k) ?? 0) + v);
    }
  });

  res.json({
    days,
    minutes: days.reduce((a, d) => a + d.minutes, 0),
    sessions: rows.reduce((a, r) => a + (r.sessions || 0), 0),
    topSubject: [...subjects].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  });
}

const dailySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.object({
    minutes: z.number().int().min(0).max(1440),
    sessions: z.number().int().min(0).max(200),
    streak: z.number().int().min(0).max(5000),
    topSubject: z.string().max(40).nullable().optional(),
  }).strict(),
}).strict();

export async function saveDaily(req, res) { // only called when the user taps Save, Download or Share
  const b = dailySchema.parse(req.body);
  await DailyReport.updateOne(
    { user: req.user.id, date: b.date },
    { $set: { summary: b.summary, createdAt: new Date() } },
    { upsert: true }
  );
  res.json({ ok: true, keptForHours: 48 });
}

export async function getDaily(req, res) {
  const r = await DailyReport.findOne({ user: req.user.id, date: req.params.date }).lean();
  r ? res.json(r.summary) : res.status(404).json({ error: 'not_found' });
}

export default {
  weekly,
  saveDaily,
  getDaily,
};
