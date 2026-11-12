import { Flame, Trophy, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default function StreakDisplay({ streak, todayMinutes = 0 }) {
  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  const isQualifiedToday = todayMinutes >= 25;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Streak (Warm Honey Card) */}
      <div className="rounded-2xl border border-[#FCEBCB] bg-[#FEF8EC] p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider font-mono">
              Current Streak
            </span>
            <div className="w-9 h-9 rounded-xl bg-white border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-amber-950 tracking-tight">
                {currentStreak}
              </span>
              <span className="text-sm text-amber-800 font-medium">days active</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {isQualifiedToday ? (
                <span className="flex items-center gap-1.5 text-emerald-800 font-medium bg-white/80 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Streak preserved today (≥25m logged)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-800 font-medium bg-white/80 border border-amber-200/60 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>{25 - todayMinutes} more mins needed to qualify today</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Longest Personal Streak (Warm Peach Card) */}
      <div className="rounded-2xl border border-[#F8DFD4] bg-[#FDF3EE] p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider font-mono">
              Personal Record
            </span>
            <div className="w-9 h-9 rounded-xl bg-white border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-amber-950 tracking-tight">
                {longestStreak}
              </span>
              <span className="text-sm text-amber-800 font-medium">days</span>
            </div>
            <p className="text-xs text-amber-900/80 mt-3 leading-relaxed">
              Your all-time highest continuous study sequence
            </p>
          </div>
        </div>
      </div>

      {/* Streak Rule & Grace Protection (Soft Sage Card) */}
      <div className="rounded-2xl border border-[#D9EADC] bg-[#F0F7F1] p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider font-mono">
              Qualification Rules
            </span>
            <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
              <span>Min. <strong>25 mins</strong> focused study per day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
              <span>Calculated in your local timezone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
              <span>Tasks/video alone do not qualify</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

