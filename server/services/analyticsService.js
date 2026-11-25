import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, startOfYear, endOfYear } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import Problem from '../models/Problem.js';
import { getStreakInfo, getStudyDays } from './streakService.js';
import { parseDateRange } from '../utils/dateRange.js';

/**
 * Get the "today" boundaries in user's timezone.
 */
export async function studyRows(user, timezone, start, end, studyDays) {
  const days = await (studyDays || getStudyDays(user, timezone));
  return [...days].filter(([date]) => date >= start && date <= end).map(([date, day]) =>
    ({ ...day, date, minutes: Math.floor(day.seconds / 60) }));
}

function getTodayRange(timezone) {
  return parseDateRange('today', timezone);
}

/**
 * Get comprehensive dashboard statistics.
 */
export async function getDashboardStats(userId, timezone = 'Asia/Kolkata', studyDays = getStudyDays(userId, timezone)) {
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

  const todayStr = format(now, 'yyyy-MM-dd');
  const [
    days,
    todayTasks,
    pendingTasks,
    problemStats,
    streakInfo,
  ] = await Promise.all([
    studyDays,
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
    getStreakInfo(userId, studyDays),
  ]);

  const sumMinutes = (start = '', end = todayStr) => Math.floor([...days].reduce(
    (seconds, [date, day]) => seconds + (date >= start && date <= end ? day.seconds : 0), 0) / 60);
  const today = days.get(todayStr);
  return {
    today: {
      studyMinutes: Math.floor((today?.seconds || 0) / 60),
      sessions: today?.sessions || 0,
      tasksCompleted: todayTasks,
    },
    week: {
      studyMinutes: sumMinutes(weekStartStr, weekEndStr),
    },
    month: {
      studyMinutes: sumMinutes(monthStartStr, monthEndStr),
    },
    allTime: {
      studyMinutes: sumMinutes(),
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
  const now = toZonedTime(new Date(), timezone);
  const todayStr = format(now, 'yyyy-MM-dd');
  const pastDateStr = format(subDays(now, days), 'yyyy-MM-dd');

  const { start: startDate } = parseDateRange(pastDateStr, timezone);
  const { end: endDate } = parseDateRange(todayStr, timezone);

  const rows = await studyRows(userId, timezone, pastDateStr, todayStr);

  // For daily, fill in missing dates with 0
  if (period === 'daily') {
    const dataMap = {};
    for (const r of rows) {
      dataMap[r.date] = r;
    }
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    return allDays.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      return {
        date: key,
        totalMinutes: dataMap[key]?.minutes || 0,
        sessions: dataMap[key]?.sessions || 0,
      };
    });
  }

  const periodMap = {};
  for (const r of rows) {
    const d = new Date(`${r.date}T12:00:00Z`);
    const key = period === 'monthly' ? format(d, 'yyyy-MM') : format(d, 'yyyy-I');
    if (!periodMap[key]) periodMap[key] = { totalMinutes: 0, sessions: 0 };
    periodMap[key].totalMinutes += r.minutes || 0;
    periodMap[key].sessions += r.sessions || 0;
  }

  return Object.entries(periodMap).map(([periodKey, val]) => ({
    period: periodKey,
    totalMinutes: val.totalMinutes,
    sessions: val.sessions,
  }));
}

/**
 * Get weekly summary with category breakdown.
 */
export async function getWeeklySummary(userId, timezone = 'Asia/Kolkata') {
  const now = toZonedTime(new Date(), timezone);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');


  const weekRows = await studyRows(userId, timezone, weekStartStr, weekEndStr);

  const subjectsMap = new Map();
  for (const r of weekRows) {
    if (r.bySubject) {
      const entries = r.bySubject instanceof Map ? r.bySubject.entries() : Object.entries(r.bySubject);
      for (const [subj, mins] of entries) {
        subjectsMap.set(subj, (subjectsMap.get(subj) || 0) + mins);
      }
    }
  }

  const categoryBreakdown = [...subjectsMap.entries()].map(([cat, totalMinutes]) => ({
    _id: cat,
    totalMinutes,
    sessions: 0,
  }));

  const dailyBreakdown = weekRows.map((r) => ({
    _id: r.date,
    totalMinutes: r.minutes,
    sessions: r.sessions,
  }));

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
    activityBreakdown: [],
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
        'timerState.status': { $nin: ['running', 'paused'] },
        date: { $gte: yearStart, $lte: yearEnd },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } },
        totalMinutes: { $sum: { $cond: [{ $gt: ['$durationSec', 0] }, { $divide: ['$durationSec', 60] }, '$focusDuration'] } },
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

  // Last 30 days bounded in user timezone
  const past30Str = format(subDays(now, 30), 'yyyy-MM-dd');
  const { start: thirtyDaysAgo } = parseDateRange(past30Str, timezone);
  const { end: todayEnd } = parseDateRange(todayStr, timezone);

  const dailyTotals = await StudySession.aggregate([
    {
      $match: {
        user: userObjId,
        'timerState.status': { $nin: ['running', 'paused'] },
        date: { $gte: thirtyDaysAgo, $lte: todayEnd },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } },
        totalMinutes: { $sum: { $cond: [{ $gt: ['$durationSec', 0] }, { $divide: ['$durationSec', 60] }, '$focusDuration'] } },
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
        'timerState.status': { $nin: ['running', 'paused'] },
        startTime: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: { $hour: '$startTime' },
        totalMinutes: { $sum: { $cond: [{ $gt: ['$durationSec', 0] }, { $divide: ['$durationSec', 60] }, '$focusDuration'] } },
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
