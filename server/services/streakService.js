import { startOfDay, subDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import User from '../models/User.js';
import { DailyTotal } from '../models/rewards.js';

const MINIMUM_ACTIVE_MINUTES = 25;

async function getLiveStudyDays(userId, timezone) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  // Recent sessions are editable. Recompute their totals rather than relying
  // on an increment that may have failed after the session was inserted.
  // Historical compaction retained daily summaries beyond 180 days.
  const now = toZonedTime(new Date(), timezone);
  const todayStr = format(now, 'yyyy-MM-dd');
  const groups = await StudySession.aggregate([
      { $match: { user: userObjId, 'timerState.status': { $nin: ['running', 'paused'] } } },
      { $project: {
        date: { $dateToString: { format: '%Y-%m-%d', timezone, date: { $ifNull: ['$startedAt', '$startTime', '$date'] } } },
        seconds: { $cond: [{ $gt: ['$durationSec', 0] }, '$durationSec', { $multiply: [{ $ifNull: ['$focusDuration', '$duration', 0] }, 60] }] },
        subject: { $ifNull: ['$category', 'Focus'] },
      } },
      { $match: { seconds: { $gt: 0 }, date: { $lte: todayStr } } },
      { $group: { _id: { date: '$date', subject: '$subject' }, seconds: { $sum: '$seconds' }, sessions: { $sum: 1 } } },
  ]);
  const days = new Map();
  for (const group of groups) {
    const { date, subject } = group._id;
    const day = days.get(date) || { seconds: 0, sessions: 0, bySubject: Object.create(null) };
    day.seconds += group.seconds;
    day.sessions += group.sessions;
    day.bySubject[subject] = group.seconds / 60;
    days.set(date, day);
  }
  return days;
}

// Older installations compacted some raw sessions. Freeze only the missing
// portion before a live session can change, so a later deletion stays deleted.
export async function preserveArchivedStudy(userId, timezone) {
  const rows = await DailyTotal.find({ user: userId, archivedStudy: { $exists: false } }).lean();
  if (!rows.length) return;
  const zone = timezone || (await User.findById(userId).select('timezone').lean())?.timezone || 'Asia/Kolkata';
  const cutoff = format(subDays(toZonedTime(new Date(), zone), 180), 'yyyy-MM-dd');
  const liveDays = await getLiveStudyDays(userId, zone);
  const writes = rows.map(row => {
    const live = liveDays.get(row.date);
    const sessions = row.sessions - (live?.sessions || 0);
    let archivedStudy = null;
    if (row.date <= cutoff && sessions > 0) {
      const bySubject = Object.fromEntries(Object.entries(row.bySubject || {}).map(([name, minutes]) =>
        [name, Math.max(0, minutes - (live?.bySubject[name] || 0))]));
      archivedStudy = { sessions, seconds: Math.max(0, row.minutes * 60 - (live?.seconds || 0)), bySubject };
    }
    return { updateOne: { filter: { _id: row._id, archivedStudy: { $exists: false } }, update: { $set: { archivedStudy } } } };
  });
  await DailyTotal.bulkWrite(writes);
}

export async function getStudyDays(userId, timezone) {
  await preserveArchivedStudy(userId, timezone);
  const [days, archive] = await Promise.all([
    getLiveStudyDays(userId, timezone),
    DailyTotal.find({ user: userId, 'archivedStudy.sessions': { $gt: 0 } }).select('date archivedStudy').lean(),
  ]);
  for (const { date, archivedStudy } of archive) {
    const day = days.get(date) || { seconds: 0, sessions: 0, bySubject: Object.create(null) };
    day.seconds += archivedStudy.seconds;
    day.sessions += archivedStudy.sessions;
    for (const [name, minutes] of Object.entries(archivedStudy.bySubject || {})) {
      day.bySubject[name] = (day.bySubject[name] || 0) + minutes;
    }
    days.set(date, day);
  }
  return days;
}

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
export async function getStreakInfo(userId, studyDays) {
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

  const days = await (studyDays || getStudyDays(userId, timezone));
  const map = Object.fromEntries([...days].map(([date, day]) => [date, Math.floor(day.seconds / 60)]));

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
      sessions: days.get(dateStr)?.sessions || 0,
      bySubject: days.get(dateStr)?.bySubject || {},
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
  const activeStreakDays = [];

  const earliest = Object.keys(map).sort()[0] || todayStr;
  for (let i = checkOffset; ; i++) {
    const d = subDays(now, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    if (dateStr < earliest) break;
    const minutes = map[dateStr] || 0;

    if (minutes >= MINIMUM_ACTIVE_MINUTES) {
      currentStreak++;
      graceUsed = 0;
      activeStreakDays.unshift({
        date: dateStr,
        label: format(d, 'EEE MMM d'),
        minutes,
      });
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

  // Current calendar week (Monday to Sunday in user's timezone)
  const weekDayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentDayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const mondayDate = subDays(now, currentDayOfWeek);

  const thisWeek = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate.getTime() + i * 86400000);
    const dateStr = format(d, 'yyyy-MM-dd');
    const minutes = map[dateStr] || 0;
    const hours = Math.round((minutes / 60) * 10) / 10;
    const isToday = dateStr === todayStr;
    const isFuture = i > currentDayOfWeek;
    thisWeek.push({
      day: weekDayNames[i],
      label: weekDayLabels[i],
      date: dateStr,
      minutes,
      hours,
      isActive: minutes >= MINIMUM_ACTIVE_MINUTES,
      isToday,
      isFuture,
    });
  }

  // Rolling last 7 days ending today
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayIdx = (d.getDay() + 6) % 7;
    const minutes = map[dateStr] || 0;
    const hours = Math.round((minutes / 60) * 10) / 10;
    last7Days.push({
      day: weekDayNames[dayIdx],
      label: weekDayLabels[dayIdx],
      date: dateStr,
      minutes,
      hours,
      isActive: minutes >= MINIMUM_ACTIVE_MINUTES,
      isToday: dateStr === todayStr,
    });
  }

  return {
    today: todayStr,
    currentStreak,
    longestStreak,
    activeDaysThisYear,
    gardenDays: Object.values(map).filter(minutes => minutes >= MINIMUM_ACTIVE_MINUTES).length,
    isActiveToday,
    nextMilestone,
    history,
    byDay: map,
    thisWeek,
    last7Days,
    activeStreakDays,
  };
}

export default { getStreakInfo };
