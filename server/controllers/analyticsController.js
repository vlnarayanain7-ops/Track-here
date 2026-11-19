import ProblemAttempt from '../models/ProblemAttempt.js';
import User from '../models/User.js';
import StudySession from '../models/StudySession.js';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { subDays, startOfMonth, startOfYear, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
  getDashboardStats,
  getStudyTimeStats,
  getWeeklySummary as getWeeklySummaryService,
  getHeatmapData,
  getConsistencyMetrics,
} from '../services/analyticsService.js';
import { getStreakInfo } from '../services/streakService.js';
import { parseDateRange } from '../utils/dateRange.js';

/**
 * Helper to compute by-subject breakdown for a given range (week | month | year)
 */
async function computeBySubject(userId, timezone, range = 'week', userSubjects = []) {
  const now = toZonedTime(new Date(), timezone);
  let startDate;

  if (range === 'month') {
    const startStr = format(startOfMonth(now), 'yyyy-MM-dd');
    startDate = parseDateRange(startStr, timezone).start;
  } else if (range === 'year') {
    const startStr = format(startOfYear(now), 'yyyy-MM-dd');
    startDate = parseDateRange(startStr, timezone).start;
  } else {
    // week (Monday-based)
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startStr = format(subDays(now, dayOfWeek), 'yyyy-MM-dd');
    startDate = parseDateRange(startStr, timezone).start;
  }

  const subjectAgg = await StudySession.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$category',
        minutes: { $sum: '$focusDuration' },
      },
    },
    { $sort: { minutes: -1 } },
  ]);

  const subjectMap = new Map((userSubjects || []).map((s) => [s.name, s.color]));
  return subjectAgg
    .filter((s) => s._id)
    .map((s) => ({
      id: s._id,
      name: s._id,
      minutes: s.minutes,
      color: subjectMap.get(s._id) || 'slate',
    }));
}

/**
 * GET /api/analytics/dashboard or /api/analytics
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('timezone dailyStudyGoal subjects').lean();
  const timezone = user?.timezone || 'Asia/Kolkata';
  const range = (req.query.range || 'week').toLowerCase();

  const [stats, bySubject, recurringMistakes] = await Promise.all([
    getDashboardStats(req.user.id, timezone),
    computeBySubject(req.user.id, timezone, range, user?.subjects || []),
    ProblemAttempt.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), attemptedAt: { $gte: new Date(Date.now() - 90 * 86400000) }, mistakes: { $type: 'string', $ne: '' } } },
      { $group: { _id: { $toLower: { $trim: { input: '$mistakes' } } }, count: { $sum: 1 }, example: { $first: '$mistakes' } } },
      { $match: { count: { $gte: 2 }, _id: { $ne: '' } } },
      { $sort: { count: -1 } }, { $limit: 5 },
      { $project: { _id: 0, text: '$example', count: 1 } },
    ]),
  ]);

  res.json({
    ...stats,
    bySubject,
    recurringMistakes,
    dailyStudyGoal: user?.dailyStudyGoal || 240,
  });
});

/**
 * GET /api/analytics/study-time
 */
export const getStudyTime = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  const user = await User.findById(req.user.id).select('timezone').lean();
  const timezone = user?.timezone || 'Asia/Kolkata';

  const stats = await getStudyTimeStats(req.user.id, period, timezone);
  res.json(stats);
});

/**
 * GET /api/analytics/categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = { user: new mongoose.Types.ObjectId(req.user.id) };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const [categoryBreakdown, activityBreakdown, topTopics] = await Promise.all([
    StudySession.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          totalMinutes: { $sum: '$focusDuration' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { totalMinutes: -1 } },
    ]),
    StudySession.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$activityType',
          totalMinutes: { $sum: '$focusDuration' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { totalMinutes: -1 } },
    ]),
    StudySession.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$topic',
          category: { $first: '$category' },
          totalMinutes: { $sum: '$focusDuration' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { totalMinutes: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.json({
    categories: categoryBreakdown,
    activities: activityBreakdown,
    topTopics,
  });
});

/**
 * GET /api/analytics/weekly-summary
 */
export const getWeeklySummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('timezone');
  const timezone = user?.timezone || 'Asia/Kolkata';

  const summary = await getWeeklySummaryService(req.user.id, timezone);
  res.json(summary);
});

/**
 * GET /api/analytics/streaks
 */
export const getStreaks = asyncHandler(async (req, res) => {
  const streakInfo = await getStreakInfo(req.user.id);
  res.json(streakInfo);
});

/**
 * GET /api/analytics/heatmap
 */
export const getHeatmap = asyncHandler(async (req, res) => {
  const streakInfo = await getStreakInfo(req.user.id);
  res.json(streakInfo.history);
});

/**
 * GET /api/analytics/consistency
 */
export const getConsistency = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('timezone');
  const timezone = user?.timezone || 'Asia/Kolkata';

  const consistency = await getConsistencyMetrics(req.user.id, timezone);
  res.json(consistency);
});

