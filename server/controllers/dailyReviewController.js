import { z } from 'zod';
import DailyReview from '../models/DailyReview.js';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import ProblemAttempt from '../models/ProblemAttempt.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';
import { parseDateRange } from '../utils/dateRange.js';

// ─── Validation Schemas ───────────────────────────────────────

export const createDailyReviewSchema = z.object({
  date: z.string().or(z.date()),
  actualStudyTime: z.number().min(0).optional(),
  completedTasks: z.array(z.string()).optional(),
  problemsAttempted: z.number().min(0).optional(),
  problemsSolved: z.number().min(0).optional(),
  goalProgress: z.number().min(0).max(100).optional(),
  learned: z.string().optional().nullable(),
  mistakes: z.string().optional().nullable(),
  difficulties: z.string().optional().nullable(),
  incompleteGoals: z.array(z.string()).optional(),
  tomorrowPlan: z.string().optional().nullable(),
  mood: z.string().optional().nullable(),
  reflection: z.string().optional().nullable(),
  tomorrowFirst: z.string().optional().nullable(),
});

export const updateDailyReviewSchema = createDailyReviewSchema.partial();

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/daily-reviews
 */
export const getDailyReviews = asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;

  const reviews = await DailyReview.find({ user: req.user.id })
    .sort({ date: -1 })
    .limit(parseInt(limit, 10))
    .populate('completedTasks')
    .lean();

  res.json(reviews);
});

/**
 * GET /api/daily-reviews/:date
 * Returns existing review or auto-calculated day stats
 */
export const getDailyReview = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const user = await User.findById(req.user.id).select('dailyStudyGoal timezone').lean();
  const tz = user?.timezone || 'Asia/Kolkata';
  const { start, end } = parseDateRange(date, tz);

  const [existingReview, sessions, completedTasksList, attempts] = await Promise.all([
    DailyReview.findOne({
      user: req.user.id,
      date: { $gte: start, $lte: end },
    }).populate('completedTasks').lean(),
    StudySession.find({
      user: req.user.id,
      date: { $gte: start, $lte: end },
    }).select('focusDuration problemsAttempted problemsSolved').lean(),
    Task.find({
      user: req.user.id,
      status: 'Completed',
      completedAt: { $gte: start, $lte: end },
    }).select('title').lean(),
    ProblemAttempt.find({
      user: req.user.id,
      attemptedAt: { $gte: start, $lte: end },
    }).select('outcome').lean(),
  ]);

  // Calculate live stats for this date
  const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.focusDuration || 0), 0);
  const problemsAttemptedCount = attempts.length || sessions.reduce((acc, s) => acc + (s.problemsAttempted || 0), 0);
  const problemsSolvedCount = attempts.filter(a => a.outcome?.startsWith('Solved')).length ||
    sessions.reduce((acc, s) => acc + (s.problemsSolved || 0), 0);

  const dailyGoalMinutes = user?.dailyStudyGoal || 240;
  const goalProgressCalc = Math.min(100, Math.round((totalFocusMinutes / dailyGoalMinutes) * 100));

  res.json({
    review: existingReview,
    liveStats: {
      actualStudyTime: totalFocusMinutes,
      completedTasks: completedTasksList,
      problemsAttempted: problemsAttemptedCount,
      problemsSolved: problemsSolvedCount,
      goalProgress: goalProgressCalc,
      dailyStudyGoal: dailyGoalMinutes,
    },
  });
});

/**
 * POST /api/daily-reviews
 */
export const createDailyReview = asyncHandler(async (req, res) => {
  const { date, ...rest } = req.body;
  const tz = req.user?.timezone || 'Asia/Kolkata';
  const { start, end } = parseDateRange(date, tz);

  // Check if review already exists
  let review = await DailyReview.findOne({
    user: req.user.id,
    date: { $gte: start, $lte: end },
  });

  if (review) {
    Object.assign(review, rest);
    await review.save();
    await review.populate('completedTasks');
    emitToUser(req.user.id, 'dailyReview:updated', review);
    return res.json(review);
  }

  review = await DailyReview.create({
    user: req.user.id,
    date: start,
    ...rest,
  });

  await review.populate('completedTasks');
  emitToUser(req.user.id, 'dailyReview:updated', review);
  res.status(201).json(review);
});

/**
 * PUT /api/daily-reviews/:date
 */
export const updateDailyReview = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const tz = req.user?.timezone || 'Asia/Kolkata';
  const { start, end } = parseDateRange(date, tz);

  const review = await DailyReview.findOneAndUpdate(
    {
      user: req.user.id,
      date: { $gte: start, $lte: end },
    },
    { $set: req.body },
    { returnDocument: 'after', runValidators: true }
  ).populate('completedTasks');

  if (!review) {
    throw ApiError.notFound('Daily review not found for this date');
  }
  emitToUser(req.user.id, 'dailyReview:updated', review);

  res.json(review);
});

