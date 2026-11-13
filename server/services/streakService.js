import { startOfDay, subDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import User from '../models/User.js';

const MINIMUM_ACTIVE_MINUTES = 25;

/**
 * Calculate streak, heatmap history, and activity info for a user.
 * Single source of truth for both streaks and heatmap.
 *
 * @param {string} userId
 * @returns {Promise<{
 *   currentStreak: number,
 *   longestStreak: number,
 *   activeDaysThisYear: number,
 *   isActiveToday: boolean,
 *   nextMilestone: number,
 *   history: Array<{ date: string, minutes: number }>,
 *   last7Days: Array<{ day: string, date: string, minutes: number, hours: number, isActive: boolean }>
 * }>}
 */
export async function getStreakInfo(userId) {
  const user = await User.findById(userId).select('timezone streakGraceDays');
  const timezone = user?.timezone || 'Asia/Kolkata';
  const graceDays = user?.streakGraceDays || 0;

  // User's current local date
  const now = toZonedTime(new Date(), timezone);
  const todayStr = format(now, 'yyyy-MM-dd');
  const currentYear = format(now, 'yyyy');

  // Heatmap window: 53 weeks (371 days) ending with current week's Sunday
  // Monday is day 0, Sunday is day 6
  const dayOfWeek = (now.getDay() + 6) % 7;
  const startDate = subDays(now, dayOfWeek + (53 - 1) * 7);

  const userObjId = new mongoose.Types.ObjectId(userId);
  const results = await StudySession.aggregate([
    {
      $match: {
        user: userObjId,
        date: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } },
        totalMinutes: { $sum: '$focusDuration' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = {};
  for (const r of results) {
    map[r._id] = r.totalMinutes;
  }

  // Build the 53-week history array
  const history = [];
  const totalDays = 53 * 7;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate.getTime() + i * 86400000);
    const dateStr = format(d, 'yyyy-MM-dd');
    const minutes = map[dateStr] || 0;
    history.push({
      date: dateStr,
      minutes,
    });
  }

  // Count active days this year from map
  let activeDaysThisYear = 0;
  for (const [dStr, mins] of Object.entries(map)) {
    if (dStr.startsWith(currentYear) && mins >= MINIMUM_ACTIVE_MINUTES) {
      activeDaysThisYear++;
    }
  }

  // Calculate current streak
  const isActiveToday = (map[todayStr] || 0) >= MINIMUM_ACTIVE_MINUTES;
  let currentStreak = 0;
  let checkOffset = isActiveToday ? 0 : 1;
  let graceUsed = 0;

  for (let i = checkOffset; i < 400; i++) {
    const d = subDays(now, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const minutes = map[dateStr] || 0;

    if (minutes >= MINIMUM_ACTIVE_MINUTES) {
      currentStreak++;
      graceUsed = 0;
    } else if (graceUsed < graceDays) {
      graceUsed++;
    } else {
      break;
    }
  }

  // Calculate longest streak across all days in map
  const activeDates = Object.entries(map)
    .filter(([, mins]) => mins >= MINIMUM_ACTIVE_MINUTES)
    .map(([date]) => date)
    .sort();

  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < activeDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
      continue;
    }
    const prev = new Date(`${activeDates[i - 1]}T12:00:00`);
    const curr = new Date(`${activeDates[i]}T12:00:00`);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else if (diffDays <= graceDays + 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  // Next milestone
  const MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
  let nextMilestone = 3;
  for (const m of MILESTONES) {
    if (currentStreak < m) {
      nextMilestone = m;
      break;
    }
    nextMilestone = currentStreak + 10;
  }

  // Last 7 days (M, T, W, T, F, S, S)
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayIdx = (d.getDay() + 6) % 7;
    const minutes = map[dateStr] || 0;
    const hours = Math.round((minutes / 60) * 10) / 10;
    last7Days.push({
      day: dayNames[dayIdx],
      date: dateStr,
      minutes,
      hours,
      isActive: minutes >= MINIMUM_ACTIVE_MINUTES,
    });
  }

  return {
    currentStreak,
    longestStreak,
    activeDaysThisYear,
    isActiveToday,
    nextMilestone,
    history,
    last7Days,
  };
}

export default { getStreakInfo };
