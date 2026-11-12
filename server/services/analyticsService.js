import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, startOfYear, endOfYear } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import Problem from '../models/Problem.js';
import { getStreakInfo } from './streakService.js';

/**
 * Get the "today" boundaries in user's timezone.
 */
function getTodayRange(timezone) {
  const now = toZonedTime(new Date(), timezone);
  const todayStr = format(now, 'yyyy-MM-dd');
  return {
    start: new Date(`${todayStr}T00:00:00`),
    end: new Date(`${todayStr}T23:59:59.999`),
    todayStr,
  };
}

/**
 * Get comprehensive dashboard statistics.
 */
export async function getDashboardStats(userId, timezone = 'Asia/Kolkata') {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const { start: todayStart, end: todayEnd } = getTodayRange(timezone);

  const now = toZonedTime(new Date(), timezone);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  // Run all queries in parallel
  const [
    todayStudy,
    weekStudy,
    monthStudy,
    totalStudy,
    todayTasks,
    pendingTasks,
    problemStats,
    streakInfo,
  ] = await Promise.all([
    // Today's study time
    StudySession.aggregate([
      { $match: { user: userObjId, date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$focusDuration' }, sessions: { $sum: 1 } } },
    ]),
    // This week's study time
    StudySession.aggregate([
      { $match: { user: userObjId, date: { $gte: new Date(`${weekStartStr}T00:00:00`), $lte: new Date(`${weekEndStr}T23:59:59.999`) } } },
      { $group: { _id: null, total: { $sum: '$focusDuration' } } },
    ]),
    // This month's study time
    StudySession.aggregate([
      { $match: { user: userObjId, date: { $gte: new Date(`${monthStartStr}T00:00:00`), $lte: new Date(`${monthEndStr}T23:59:59.999`) } } },
      { $group: { _id: null, total: { $sum: '$focusDuration' } } },
    ]),
    // All-time total
    StudySession.aggregate([
      { $match: { user: userObjId } },
      { $group: { _id: null, total: { $sum: '$focusDuration' } } },
    ]),
    // Today's completed tasks
    Task.countDocuments({
      user: userId,
      status: 'Completed',
      completedAt: { $gte: todayStart, $lte: todayEnd },
    }),
    // Pending tasks
    Task.countDocuments({
      user: userId,
      status: { $in: ['Todo', 'In Progress'] },
    }),
    // Problem stats
    Problem.aggregate([
      { $match: { user: userObjId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          solved: { $sum: { $cond: [{ $eq: ['$status', 'Solved'] }, 1, 0] } },
          attempted: { $sum: { $cond: [{ $eq: ['$status', 'Attempted'] }, 1, 0] } },
        },
      },
    ]),
    // Streaks
    getStreakInfo(userId),
  ]);

  return {
    today: {
      studyMinutes: todayStudy[0]?.total || 0,
      sessions: todayStudy[0]?.sessions || 0,
      tasksCompleted: todayTasks,
    },
    week: {
      studyMinutes: weekStudy[0]?.total || 0,
    },
    month: {
      studyMinutes: monthStudy[0]?.total || 0,
    },
    allTime: {
      studyMinutes: totalStudy[0]?.total || 0,
    },
    tasks: {
      pending: pendingTasks,
    },
    problems: {
      total: problemStats[0]?.total || 0,
      solved: problemStats[0]?.solved || 0,
      attempted: problemStats[0]?.attempted || 0,
    },
    streaks: streakInfo,
  };
}

/**
 * Get study time broken down by period (daily, weekly, monthly).
 */
export async function getStudyTimeStats(userId, period = 'daily', timezone = 'Asia/Kolkata', days = 30) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const now = toZonedTime(new Date(), timezone);
  const todayStr = format(now, 'yyyy-MM-dd');
  const startDate = subDays(new Date(`${todayStr}T00:00:00`), days);
  const endDate = new Date(`${todayStr}T23:59:59.999`);

  let groupFormat;
  switch (period) {
    case 'weekly':
      groupFormat = '%Y-W%V';
      break;
    case 'monthly':
      groupFormat = '%Y-%m';
      break;
    default:
      groupFormat = '%Y-%m-%d';
  }

  const results = await StudySession.aggregate([
    {
      $match: {
        user: userObjId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$date', timezone } },
        totalMinutes: { $sum: '$focusDuration' },
        sessions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // For daily, fill in missing dates with 0
  if (period === 'daily') {
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const dataMap = {};
    for (const r of results) {
      dataMap[r._id] = r;
    }
    return allDays.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      return {
        date: key,
        totalMinutes: dataMap[key]?.totalMinutes || 0,
        sessions: dataMap[key]?.sessions || 0,
      };
    });
  }

  return results.map((r) => ({
    period: r._id,
    totalMinutes: r.totalMinutes,
    sessions: r.sessions,
  }));
}

/**
 * Get weekly summary with category breakdown.
 */
export async function getWeeklySummary(userId, timezone = 'Asia/Kolkata') {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const now = toZonedTime(new Date(), timezone);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const [categoryBreakdown, activityBreakdown, dailyBreakdown] = await Promise.all([
    StudySession.aggregate([
      {
        $match: {
          user: userObjId,
          date: { $gte: new Date(`${weekStartStr}T00:00:00`), $lte: new Date(`${weekEndStr}T23:59:59.999`) },
        },
      },
      {
        $group: {
          _id: '$category',
          totalMinutes: { $sum: '$focusDuration' },
          sessions: { $sum: 1 },
        },
      },
    ]),
    StudySession.aggregate([
      {
        $match: {
          user: userObjId,
          date: { $gte: new Date(`${weekStartStr}T00:00:00`), $lte: new Date(`${weekEndStr}T23:59:59.999`) },
        },
      },
      {
        $group: {
          _id: '$activityType',
          totalMinutes: { $sum: '$focusDuration' },
        },
      },
    ]),
    StudySession.aggregate([
      {
        $match: {
          user: userObjId,
          date: { $gte: new Date(`${weekStartStr}T00:00:00`), $lte: new Date(`${weekEndStr}T23:59:59.999`) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } },
          totalMinutes: { $sum: '$focusDuration' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalMinutes = categoryBreakdown.reduce((sum, c) => sum + c.totalMinutes, 0);

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    totalMinutes,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c._id,
      totalMinutes: c.totalMinutes,
      sessions: c.sessions,
      percentage: totalMinutes > 0 ? Math.round((c.totalMinutes / totalMinutes) * 100) : 0,
    })),
    activityBreakdown: activityBreakdown.map((a) => ({
      activityType: a._id,
      totalMinutes: a.totalMinutes,
    })),
    dailyBreakdown: dailyBreakdown.map((d) => ({
      date: d._id,
      totalMinutes: d.totalMinutes,
    })),
  };
}

/**
 * Get heatmap data for an entire year (GitHub-style).
 */
export async function getHeatmapData(userId, year, timezone = 'Asia/Kolkata') {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const currentYear = year || new Date().getFullYear();

  const yearStart = new Date(`${currentYear}-01-01T00:00:00`);
  const yearEnd = new Date(`${currentYear}-12-31T23:59:59.999`);

  const results = await StudySession.aggregate([
    {
      $match: {
        user: userObjId,
        date: { $gte: yearStart, $lte: yearEnd },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } },
        totalMinutes: { $sum: '$focusDuration' },
        sessions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Build full year map
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
  const dataMap = {};
  for (const r of results) {
    dataMap[r._id] = r;
  }

  return allDays.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const minutes = dataMap[key]?.totalMinutes || 0;
    let level = 0;
    if (minutes >= 240) level = 4;
    else if (minutes >= 180) level = 3;
    else if (minutes >= 90) level = 2;
    else if (minutes >= 25) level = 1;

    return {
      date: key,
      totalMinutes: minutes,
      sessions: dataMap[key]?.sessions || 0,
      level,
    };
  });
}

/**
 * Get consistency metrics.
 */
export async function getConsistencyMetrics(userId, timezone = 'Asia/Kolkata') {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const now = toZonedTime(new Date(), timezone);
  const todayStr = format(now, 'yyyy-MM-dd');

  // Last 30 days
  const thirtyDaysAgo = subDays(new Date(`${todayStr}T00:00:00`), 30);

  const dailyTotals = await StudySession.aggregate([
    {
      $match: {
        user: userObjId,
        date: { $gte: thirtyDaysAgo, $lte: new Date(`${todayStr}T23:59:59.999`) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalMinutes: { $sum: '$focusDuration' },
      },
    },
  ]);

  const activeDays = dailyTotals.filter((d) => d.totalMinutes >= 25).length;
  const totalMinutes = dailyTotals.reduce((sum, d) => sum + d.totalMinutes, 0);
  const avgDailyMinutes = activeDays > 0 ? Math.round(totalMinutes / 30) : 0;
  const consistencyRate = Math.round((activeDays / 30) * 100);

  // Study time distribution (by hour of day)
  const hourDistribution = await StudySession.aggregate([
    {
      $match: {
        user: userObjId,
        startTime: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: { $hour: '$startTime' },
        totalMinutes: { $sum: '$focusDuration' },
        sessions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    last30Days: {
      activeDays,
      totalMinutes,
      avgDailyMinutes,
      consistencyRate,
    },
    hourDistribution: hourDistribution.map((h) => ({
      hour: h._id,
      totalMinutes: h.totalMinutes,
      sessions: h.sessions,
    })),
  };
}

export default {
  getDashboardStats,
  getStudyTimeStats,
  getWeeklySummary,
  getHeatmapData,
  getConsistencyMetrics,
};
