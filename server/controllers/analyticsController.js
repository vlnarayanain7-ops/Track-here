import User from '../models/User.js';
import StudySession from '../models/StudySession.js';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getDashboardStats,
  getStudyTimeStats,
  getWeeklySummary as getWeeklySummaryService,
  getHeatmapData,
  getConsistencyMetrics,
} from '../services/analyticsService.js';
import { getStreakInfo } from '../services/streakService.js';

/**
 * GET /api/analytics/dashboard or /api/analytics
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('timezone dailyStudyGoal');
  const timezone = user?.timezone || 'Asia/Kolkata';

  const stats = await getDashboardStats(req.user.id, timezone);
  res.json({
    ...stats,
    dailyStudyGoal: user?.dailyStudyGoal || 240,
  });
});

/**
 * GET /api/analytics/study-time
 */
export const getStudyTime = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  const user = await User.findById(req.user.id).select('timezone');
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
  const { year = new Date().getFullYear() } = req.query;
  const user = await User.findById(req.user.id).select('timezone');
  const timezone = user?.timezone || 'Asia/Kolkata';

  const heatmap = await getHeatmapData(req.user.id, parseInt(year, 10), timezone);
  res.json(heatmap);
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

