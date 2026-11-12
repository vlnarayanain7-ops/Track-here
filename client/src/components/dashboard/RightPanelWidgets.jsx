import { Link } from 'react-router-dom';
import {
  Timer,
  RotateCcw,
  Calendar,
  Plus,
  Play,
  FileText,
  Code2,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

/**
 * 1. Time Tracker / Focus Widget (inspired by Image 3 Bento & Image 4)
 */
export function DailyFocusWidget({ todayMinutes = 0, goalMinutes = 240, onStartStudy }) {
  const percent = Math.min(100, Math.round((todayMinutes / Math.max(1, goalMinutes)) * 100));
  const remainingMinutes = Math.max(0, goalMinutes - todayMinutes);
  const isGoalReached = percent >= 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-emerald-300 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
            <Timer className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-text-primary">Daily Focus Target</span>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          {percent}%
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Clean circular gauge (like Image 3) */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="#EAE7E1"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke={isGoalReached ? '#16A34A' : '#D97706'}
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={201}
              strokeDashoffset={201 - (201 * percent) / 100}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold font-mono text-text-primary">
              {formatDuration(todayMinutes)}
            </span>
            <span className="text-[10px] text-text-muted font-mono">logged</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Target</span>
            <span className="font-mono text-text-primary font-semibold">{formatDuration(goalMinutes)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Remaining</span>
            <span className={cn('font-mono font-semibold', isGoalReached ? 'text-emerald-700' : 'text-amber-700')}>
              {remainingMinutes > 0 ? formatDuration(remainingMinutes) : 'Goal Reached!'}
            </span>
          </div>
          <Link to="/study" className="block pt-1">
            <button className="w-full h-8 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold shadow-xs transition-colors">
              <Play className="w-3 h-3 fill-current" />
              <span>Open Focus Timer</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Upcoming Revisions Widget
 */
export function UpcomingRevisionsWidget({ revisions = [] }) {
  const now = new Date();
  const overdue = revisions.filter(
    (r) => r.status === 'pending' && new Date(r.dueDate) < now
  ).length;
  const dueToday = revisions.filter(
    (r) => r.status === 'pending' && isSameDay(new Date(r.dueDate), now)
  ).length;
  const upcoming = revisions.filter(
    (r) => r.status === 'pending' && new Date(r.dueDate) > now && !isSameDay(new Date(r.dueDate), now)
  ).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-amber-300 transition-all duration-200">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
            <RotateCcw className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-text-primary">Active Revisions</span>
        </div>
        <Link
          to="/revisions"
          className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 font-semibold transition-colors"
        >
          <span>Manage</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={cn('p-2.5 rounded-xl border', overdue > 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-surface border-border text-text-muted')}>
          <span className="block text-base font-extrabold font-mono">{overdue}</span>
          <span className="text-[10px] font-medium">Overdue</span>
        </div>
        <div className={cn('p-2.5 rounded-xl border', dueToday > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-surface border-border text-text-muted')}>
          <span className="block text-base font-extrabold font-mono">{dueToday}</span>
          <span className="text-[10px] font-medium">Due Today</span>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
          <span className="block text-base font-extrabold font-mono">{upcoming}</span>
          <span className="text-[10px] font-medium">Upcoming</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Mini Calendar Widget (like Image 4 Flowly)
 */
export function PrepCalendarWidget({ days = [] }) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 is Sunday

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-text-primary">
            {format(today, 'MMMM yyyy')}
          </span>
        </div>
        <Link to="/timetable" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold">
          Schedule ➔
        </Link>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <span key={idx} className="text-[10px] font-semibold text-text-muted">
            {day}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7 w-7" />
        ))}
        {calendarDays.map((d) => {
          const isCurrentDay = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={cn(
                'h-7 w-7 mx-auto rounded-full flex items-center justify-center font-mono text-[11px] transition-all',
                isCurrentDay
                  ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                  : 'text-text-secondary hover:bg-surface'
              )}
            >
              {format(d, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 4. Daily Mindset Card (Inspired by Flowly minimal quote card)
 */
export function DailyMindsetCard() {
  return (
    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-2 text-emerald-800">
        <span className="text-sm">🌱</span>
        <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Daily Mindset</span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        &ldquo;Small, consistent sessions every day compound into mastery. Focus on clarity over speed.&rdquo;
      </p>
    </div>
  );
}
