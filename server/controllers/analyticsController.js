import ProblemAttempt from '../models/ProblemAttempt.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Revision from '../models/Revision.js';
import StudySession from '../models/StudySession.js';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import { subDays, startOfMonth, startOfYear, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  studyRows,
  getDashboardStats,
  getStudyTimeStats,
  getWeeklySummary as getWeeklySummaryService,
  getHeatmapData,
  getConsistencyMetrics,
} from '../services/analyticsService.js';
import { getStreakInfo, getStudyDays } from '../services/streakService.js';
import { parseDateRange } from '../utils/dateRange.js';

export const getMission = asyncHandler(async (req, res) => {
  const user = req.user.id;
  const profile = await User.findById(user).select('timezone').lean();
  const zone = profile?.timezone || 'Asia/Kolkata';
  const now = new Date();
  const day = format(toZonedTime(now, zone), 'yyyy-MM-dd');
  const today = { $gte: fromZonedTime(day + 'T00:00:00', zone), $lte: now };
  const [taskDone, reviewDone, task] = await Promise.all([
    Task.exists({ user, completedAt: today, status: 'Completed' }),
    Revision.exists({ user, 'history.date': today }),
    Task.findOne({ user, status: { $in: ['Todo', 'In Progress'] } }).sort({ dueDate: 1 }).select('title').lean(),
  ]);
  res.json({ taskDone: Boolean(taskDone), reviewDone: Boolean(reviewDone), task });
});

/**
 * Helper to compute by-subject breakdown for a given range (week | month | year)
 */
async function computeBySubject(userId, timezone, range = 'week', userSubjects = [], studyDays) {
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

  const rows = await studyRows(userId, timezone, format(toZonedTime(startDate, timezone), 'yyyy-MM-dd'), format(now, 'yyyy-MM-dd'), studyDays);
  const totals = new Map();
  for (const row of rows) {
    for (const [subject, minutes] of Object.entries(row.bySubject || {})) {
      totals.set(subject, (totals.get(subject) || 0) + minutes);
    }
  }
  const subjectAgg = [...totals].map(([_id, minutes]) => ({ _id, minutes })).sort((a, b) => b.minutes - a.minutes);

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

  const studyDays = getStudyDays(req.user.id, timezone);
  const [stats, bySubject, recurringMistakes] = await Promise.all([
    getDashboardStats(req.user.id, timezone, studyDays),
    computeBySubject(req.user.id, timezone, range, user?.subjects || [], studyDays),
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
  const query = { user: new mongoose.Types.ObjectId(req.user.id), 'timerState.status': { $nin: ['running', 'paused'] } };

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
          totalMinutes: { $sum: { $cond: [{ $gt: ['$durationSec', 0] }, { $divide: ['$durationSec', 60] }, '$focusDuration'] } },
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
          totalMinutes: { $sum: { $cond: [{ $gt: ['$durationSec', 0] }, { $divide: ['$durationSec', 60] }, '$focusDuration'] } },
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
          totalMinutes: { $sum: { $cond: [{ $gt: ['$durationSec', 0] }, { $divide: ['$durationSec', 60] }, '$focusDuration'] } },
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

