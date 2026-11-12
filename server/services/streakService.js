import { startOfDay, subDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import User from '../models/User.js';

const MINIMUM_ACTIVE_MINUTES = 25;

/**
 * Get the current date string in user's timezone (YYYY-MM-DD).
 */
function getTodayInTimezone(timezone) {
  const now = toZonedTime(new Date(), timezone);
  return format(now, 'yyyy-MM-dd');
}

/**
 * Get date string for a given date in user's timezone.
 */
function getDateStringInTimezone(date, timezone) {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, 'yyyy-MM-dd');
}

/**
 * Check if a specific date (YYYY-MM-DD) was an active study day.
 * An active day has >= MINIMUM_ACTIVE_MINUTES of focused study.
 */
async function isDayActive(userId, dateString, timezone) {
  // Create date range for the entire day in user's timezone
  const dayStart = new Date(`${dateString}T00:00:00`);
  const dayEnd = new Date(`${dateString}T23:59:59.999`);
  const userObjId = new mongoose.Types.ObjectId(userId);

  const result = await StudySession.aggregate([
    {
      $match: {
        user: userObjId,
        date: { $gte: dayStart, $lte: dayEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$focusDuration' },
      },
    },
  ]);

  const totalMinutes = result.length > 0 ? result[0].totalMinutes : 0;
  return totalMinutes >= MINIMUM_ACTIVE_MINUTES;
}

/**
 * Get daily study totals for a range of dates in user's timezone.
 */
async function getDailyTotals(userId, startDate, endDate, timezone = 'Asia/Kolkata') {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const results = await StudySession.aggregate([
    {
      $match: {
        user: userObjId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date', timezone },
        },
        totalMinutes: { $sum: '$focusDuration' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = {};
  for (const r of results) {
    map[r._id] = r.totalMinutes;
  }
  return map;
}

/**
 * Calculate streak information for a user.
 * @returns {{ currentStreak: number, longestStreak: number, isActiveToday: boolean }}
 */
export async function getStreakInfo(userId) {
  const user = await User.findById(userId).select('timezone streakGraceDays');
  const timezone = user?.timezone || 'Asia/Kolkata';
  const graceDays = user?.streakGraceDays || 0;

  const todayStr = getTodayInTimezone(timezone);

  // Fetch last 400 days of study data to calculate streaks
  const lookbackDays = 400;
  const startDate = subDays(new Date(`${todayStr}T00:00:00`), lookbackDays);
  const endDate = new Date(`${todayStr}T23:59:59.999`);

  const dailyTotals = await getDailyTotals(userId, startDate, endDate, timezone);

  const isActiveToday = (dailyTotals[todayStr] || 0) >= MINIMUM_ACTIVE_MINUTES;

  // Calculate current streak: count consecutive active days going backward
  let currentStreak = 0;
  let checkDate = isActiveToday ? todayStr : format(subDays(new Date(`${todayStr}T12:00:00`), 1), 'yyyy-MM-dd');
  let consecutiveGraceDaysUsed = 0;

  for (let i = 0; i < lookbackDays; i++) {
    const dateStr = format(subDays(new Date(`${todayStr}T12:00:00`), isActiveToday ? i : i + 1), 'yyyy-MM-dd');
    const minutes = dailyTotals[dateStr] || 0;

    if (minutes >= MINIMUM_ACTIVE_MINUTES) {
      currentStreak++;
      consecutiveGraceDaysUsed = 0; // Reset grace counter
    } else if (consecutiveGraceDaysUsed < graceDays) {
      consecutiveGraceDaysUsed++;
      // Grace day — streak continues but doesn't increment
    } else {
      break;
    }
  }

  // Calculate longest streak
  // Build sorted array of all active dates
  const activeDates = Object.entries(dailyTotals)
    .filter(([, mins]) => mins >= MINIMUM_ACTIVE_MINUTES)
    .map(([date]) => date)
    .sort();

  let longestStreak = 0;
  let tempStreak = 0;
  let tempGraceUsed = 0;

  for (let i = 0; i < activeDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
      continue;
    }

    const prevDate = new Date(`${activeDates[i - 1]}T12:00:00`);
    const currDate = new Date(`${activeDates[i]}T12:00:00`);
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      tempGraceUsed = 0;
    } else if (diffDays <= graceDays + 1) {
      // Within grace period
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
      tempGraceUsed = 0;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Ensure current streak is included in longest
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
  };
}

export default { getStreakInfo };
