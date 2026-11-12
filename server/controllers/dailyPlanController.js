import { z } from 'zod';
import DailyPlan from '../models/DailyPlan.js';
import Task from '../models/Task.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';

// ─── Validation Schemas ───────────────────────────────────────

export const createDailyPlanSchema = z.object({
  date: z.string().or(z.date()),
  studyTargets: z.object({
    cpp: z.string().optional().nullable(),
    dsa: z.string().optional().nullable(),
    cp: z.string().optional().nullable(),
    other: z.string().optional().nullable(),
  }).optional(),
  targetHours: z.number().min(0).max(24).optional(),
  priorityTasks: z.array(z.string()).optional(),
  intentions: z.string().optional().nullable(),
  yesterdayIncomplete: z.array(z.string()).optional(),
}).strict();

export const updateDailyPlanSchema = createDailyPlanSchema.partial().strict();

// ─── Helper ───────────────────────────────────────────────────

function parseDateRange(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/daily-plans
 */
export const getDailyPlans = asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;

  const plans = await DailyPlan.find({ user: req.user.id })
    .sort({ date: -1 })
    .limit(parseInt(limit, 10))
    .populate('priorityTasks')
    .lean();

  res.json(plans);
});

/**
 * GET /api/daily-plans/:date
 */
export const getDailyPlan = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const targetDate = date === 'today' ? new Date().toISOString().split('T')[0] : date;
  const { start, end } = parseDateRange(targetDate);

  const plan = await DailyPlan.findOne({
    user: req.user.id,
    date: { $gte: start, $lte: end },
  }).populate('priorityTasks');

  if (!plan) {
    // If not found, check yesterday's incomplete tasks to help populate
    const yesterday = new Date(start);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStart = new Date(yesterday);
    yStart.setUTCHours(0, 0, 0, 0);
    const yEnd = new Date(yesterday);
    yEnd.setUTCHours(23, 59, 59, 999);

    const pendingTasks = await Task.find({
      user: req.user.id,
      status: { $in: ['Todo', 'In Progress'] },
      dueDate: { $lte: end },
    }).limit(10).select('title priority dueDate');

    return res.json({
      plan: null,
      suggestedTasks: pendingTasks,
    });
  }

  res.json(plan);
});

/**
 * POST /api/daily-plans
 */
export const createDailyPlan = asyncHandler(async (req, res) => {
  const { date, ...rest } = req.body;
  const targetDate = new Date(date);
  const { start, end } = parseDateRange(date);

  // Check if plan already exists for this date
  let plan = await DailyPlan.findOne({
    user: req.user.id,
    date: { $gte: start, $lte: end },
  });

  if (plan) {
    // Update existing plan
    Object.assign(plan, rest);
    await plan.save();
    await plan.populate('priorityTasks');
    emitToUser(req.user.id, 'dailyPlan:updated', plan);
    return res.json(plan);
  }

  plan = await DailyPlan.create({
    user: req.user.id,
    date: targetDate,
    ...rest,
  });

  await plan.populate('priorityTasks');
  emitToUser(req.user.id, 'dailyPlan:updated', plan);
  res.status(201).json(plan);
});

/**
 * PUT /api/daily-plans/:date
 */
export const updateDailyPlan = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const targetDate = date === 'today' ? new Date().toISOString().split('T')[0] : date;
  const { start, end } = parseDateRange(targetDate);

  const plan = await DailyPlan.findOneAndUpdate(
    {
      user: req.user.id,
      date: { $gte: start, $lte: end },
    },
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('priorityTasks');

  if (!plan) {
    throw ApiError.notFound('Daily plan not found for this date');
  }
  emitToUser(req.user.id, 'dailyPlan:updated', plan);

  res.json(plan);
});

