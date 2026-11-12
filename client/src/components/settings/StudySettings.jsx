import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import toast from 'react-hot-toast';
import { toLocalDateString } from '@/lib/date';
import {
  PREPARATION_TYPES,
} from '@/lib/constants';
import { Target, Layers, Calendar, Clock, Globe, ArrowRight } from 'lucide-react';

export default function StudySettings() {
  const { user, checkAuth } = useAuth();

  const [preparationType, setPreparationType] = useState(user?.preparationType || 'Competitive');
  const [examName, setExamName] = useState(user?.examName || '');
  const [examDate, setExamDate] = useState(
    user?.examDate || user?.targetExamDate
      ? toLocalDateString(user.examDate || user.targetExamDate)
      : ''
  );
  const [dailyGoalHours, setDailyGoalHours] = useState(
    user?.dailyStudyGoal ? (user.dailyStudyGoal / 60).toFixed(1) : '4.0'
  );
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [weekStartsOn, setWeekStartsOn] = useState(user?.weekStartsOn ?? 1);
  const [streakGraceDays, setStreakGraceDays] = useState(user?.streakGraceDays ?? 0);
  const [showHabits, setShowHabits] = useState(user?.preferences?.showHabits ?? false);
  const [loading, setLoading] = useState(false);

  const timezones = [
    'Asia/Kolkata',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
    'UTC',
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const minutes = Math.round(parseFloat(dailyGoalHours) * 60);

      // Update profile fields
      await usersApi.updateProfile({
        preparationType,
        examName: examName.trim() || undefined,
        targetExamDate: examDate ? new Date(examDate) : null,
        examDate: examDate ? new Date(examDate) : null,
        dailyStudyGoal: minutes,
        timezone,
      });

      // Update settings fields
      await usersApi.updateSettings({
        weekStartsOn: Number(weekStartsOn),
        streakGraceDays: Number(streakGraceDays),
        preferences: {
          showHabits: Boolean(showHabits),
        },
      });

      await checkAuth();
      toast.success('Study preferences saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update study preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl select-none">
      {/* 1. Subjects Link (Replaces duplicate manager) */}
      <div className="card p-5 bg-[var(--surface)] border-[var(--line)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-heading text-[var(--text)]">
                Subjects &amp; Chapters
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5 max-w-md">
                Subject management (adding, renaming, recoloring, and reordering) and chapter checklists are centralized in Syllabus &amp; Goals.
              </p>
            </div>
          </div>
          <Link
            to="/subjects"
            className="btn btn-primary h-[40px] px-4 text-xs font-semibold shrink-0"
          >
            <span>Open Syllabus &amp; Goals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Target Examination & Goals */}
      <div className="card p-5 sm:p-6 bg-[var(--surface)] border-[var(--line)] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--line)]">
          <Target className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-bold font-heading text-[var(--text)] uppercase tracking-wider">
            Target Goal &amp; Milestones
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="field">
            <span>Preparation Track</span>
            <select
              value={preparationType}
              onChange={(e) => setPreparationType(e.target.value)}
              className="w-full"
            >
              {PREPARATION_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Specific Exam / Goal Name</span>
            <input
              type="text"
              placeholder="e.g. GATE CSE 2027, JEE Advanced"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full text-xs"
            />
          </label>
        </div>

        <label className="field max-w-sm">
          <span>Target Date <small className="text-[var(--muted)] font-normal">(optional countdown)</small></span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full"
          />
        </label>
      </div>

      {/* 3. Study Rhythm, Timezone & Habit Tracker */}
      <div className="card p-5 sm:p-6 bg-[var(--surface)] border-[var(--line)] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--line)]">
          <Clock className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-bold font-heading text-[var(--text)] uppercase tracking-wider">
            Rhythm &amp; Habit Settings
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="field">
            <span>Daily Focus Goal (Hours)</span>
            <input
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(e.target.value)}
              className="w-full"
            />
          </label>

          <label className="field">
            <span>Timezone</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="field">
            <span>Week Starts On</span>
            <select
              value={weekStartsOn}
              onChange={(e) => setWeekStartsOn(Number(e.target.value))}
              className="w-full"
            >
              <option value={1}>Monday (Recommended standard)</option>
              <option value={0}>Sunday</option>
            </select>
          </label>

          <label className="field">
            <span>Streak Grace Days (0 - 2)</span>
            <select
              value={streakGraceDays}
              onChange={(e) => setStreakGraceDays(Number(e.target.value))}
              className="w-full"
            >
              <option value={0}>0 days (Strict daily discipline)</option>
              <option value={1}>1 day grace per week</option>
              <option value={2}>2 days grace per week</option>
            </select>
          </label>
        </div>

        {/* Habit Tracker Toggle (Default OFF per Prompt 5) */}
        <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--text)] block">
              Show Habit Tracker on Dashboard
            </span>
            <span className="text-xs text-[var(--muted)]">
              Displays a compact daily consistency block on your home overview (disabled by default).
            </span>
          </div>
          <input
            type="checkbox"
            checked={showHabits}
            onChange={(e) => setShowHabits(e.target.checked)}
            className="w-4 h-4 accent-[var(--primary)] rounded cursor-pointer"
            aria-label="Show Habit Tracker on Dashboard"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg min-w-[160px] text-xs font-semibold"
        >
          {loading ? 'Saving...' : 'Save Study Goals'}
        </button>
      </div>
    </form>
  );
}
