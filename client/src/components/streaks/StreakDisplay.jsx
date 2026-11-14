import { Flame, Trophy, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default function StreakDisplay({ streak, todayMinutes = 0 }) {
  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  const isQualifiedToday = todayMinutes >= 25;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Streak */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider font-heading">
              Current Streak
            </span>
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)] shadow-2xs">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold font-heading text-[var(--text)] tracking-tight">
                {currentStreak}
              </span>
              <span className="text-sm text-[var(--muted)] font-medium">days active</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {isQualifiedToday ? (
                <span className="flex items-center gap-1.5 text-[var(--primary)] font-medium bg-[var(--primary-soft)] border border-[var(--line)] px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Streak preserved today (≥25m logged)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[var(--muted)] font-medium bg-[var(--surface-2)] border border-[var(--line)] px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>{25 - todayMinutes} more mins needed to qualify today</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Longest Personal Streak */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider font-heading">
              Personal Record
            </span>
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)] shadow-2xs">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold font-heading text-[var(--text)] tracking-tight">
                {longestStreak}
              </span>
              <span className="text-sm text-[var(--muted)] font-medium">days</span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">
              Your all-time highest continuous study sequence
            </p>
          </div>
        </div>
      </div>

      {/* Streak Rule & Grace Protection */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider font-heading">
              Qualification Rules
            </span>
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)] shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-2 text-xs text-[var(--text)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              <span>Min. <strong>25 mins</strong> focused study per day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              <span>Calculated in your local timezone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              <span>Tasks/video alone do not qualify</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

