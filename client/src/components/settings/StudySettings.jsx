import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import toast from 'react-hot-toast';
import { toLocalDateString } from '@/lib/date';
import { PREPARATION_TYPES } from '@/lib/constants';
import { Target, Clock } from 'lucide-react';

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
      });

      await checkAuth();
      toast.success('Study goals saved');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save study goals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-xl select-none">
      <div className="card p-5 bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--line)]">
          <Target className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-bold font-heading text-[var(--text)] tracking-tight">
            Study Goals &amp; Target
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="field">
            <span className="text-xs font-medium text-[var(--muted)]">Daily Study Goal (Hours)</span>
            <input
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"
            />
          </label>

          <label className="field">
            <span className="text-xs font-medium text-[var(--muted)]">Preparation Track</span>
            <select
              value={preparationType}
              onChange={(e) => setPreparationType(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"
            >
              {PREPARATION_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="field">
            <span className="text-xs font-medium text-[var(--muted)]">Target Exam / Goal Name</span>
            <input
              type="text"
              placeholder="e.g. Competitive Programming, GATE, SWE"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"
            />
          </label>

          <label className="field">
            <span className="text-xs font-medium text-[var(--muted)]">Target Date (optional)</span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-[var(--line)]/60">
          <label className="field">
            <span className="text-xs font-medium text-[var(--muted)]">Timezone</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="text-xs font-medium text-[var(--muted)]">Week Starts On</span>
            <select
              value={weekStartsOn}
              onChange={(e) => setWeekStartsOn(Number(e.target.value))}
              className="w-full h-9 px-3 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary h-9 px-4 text-xs font-semibold rounded-lg"
          >
            {loading ? 'Saving...' : 'Save Study Goals'}
          </button>
        </div>
      </div>
    </form>
  );
}
