import { Timer, Flame, CheckCircle2, Clock, Target, Trophy, TrendingUp } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export default function StatsCards({ stats, streak, preparationType }) {
  const todayMinutes = stats?.today?.focusMinutes || 0;
  const dailyGoalMinutes = stats?.dailyStudyGoal || 240;
  const goalProgress = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  const weekMinutes = stats?.week?.focusMinutes || 0;
  const currentStreak = streak?.currentStreak ?? (stats?.streaks?.currentStreak || 0);
  const longestStreak = streak?.longestStreak ?? (stats?.streaks?.longestStreak || 0);

  const problemsSolved = stats?.problems?.solved || 0;
  const problemsAttempted = stats?.problems?.total || 0;
  const tasksCompleted = stats?.tasks?.completed || 0;
  const totalTasks = stats?.tasks?.total || 0;

  const isExamPrep = ['NEET', 'JEE', 'UPSC', 'GATE'].includes(preparationType);

  const cards = [
    {
      label: "Today's Focus",
      value: formatDuration(todayMinutes),
      unit: '',
      subLabel: `${goalProgress}% of daily goal (${formatDuration(dailyGoalMinutes)})`,
      icon: Timer,
      bgColor: 'bg-[#F0F7F1]',
      borderColor: 'border-[#D9EADC]',
      textColor: 'text-emerald-950',
      iconColor: 'text-emerald-700 bg-white border border-emerald-200/80',
      progress: goalProgress,
      progressBarColor: 'bg-emerald-600',
    },
    {
      label: 'Focus Time (Week)',
      value: `${(weekMinutes / 60).toFixed(1)}`,
      unit: 'hrs',
      subLabel: `${stats?.week?.sessionCount || 0} session${(stats?.week?.sessionCount || 0) === 1 ? '' : 's'} logged this week`,
      icon: Clock,
      bgColor: 'bg-[#FDF3EE]',
      borderColor: 'border-[#F8DFD4]',
      textColor: 'text-amber-950',
      iconColor: 'text-amber-700 bg-white border border-amber-200/80',
    },
    {
      label: 'Current Streak',
      value: `${currentStreak}`,
      unit: 'days',
      subLabel: `Personal record: ${longestStreak} days active`,
      icon: Flame,
      bgColor: 'bg-[#FEF8EC]',
      borderColor: 'border-[#FCEBCB]',
      textColor: 'text-amber-950',
      iconColor: 'text-amber-600 bg-white border border-amber-200/80',
    },
    {
      label: isExamPrep ? 'Tasks Completed' : 'Problems Solved',
      value: `${isExamPrep ? tasksCompleted : problemsSolved}`,
      unit: `/ ${isExamPrep ? totalTasks : problemsAttempted}`,
      subLabel: isExamPrep
        ? `${totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0}% tasks completed`
        : `${problemsSolved} solved independently`,
      icon: isExamPrep ? Target : CheckCircle2,
      bgColor: 'bg-[#F2F4FD]',
      borderColor: 'border-[#DFE4FB]',
      textColor: 'text-indigo-950',
      iconColor: 'text-indigo-700 bg-white border border-indigo-200/80',
      progress: totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0,
      progressBarColor: 'bg-indigo-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`rounded-2xl border ${card.borderColor} ${card.bgColor} p-4 sm:p-5 transition-all duration-200 hover:shadow-xs flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-secondary">{card.label}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${card.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${card.textColor}`}>
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-xs text-text-secondary font-medium font-mono">{card.unit}</span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {card.progress !== undefined && (
                <div className="w-full bg-white/70 h-1.5 rounded-full overflow-hidden border border-black/5">
                  <div
                    className={`h-full ${card.progressBarColor} rounded-full transition-all duration-500`}
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              )}
              <p className="text-[11px] text-text-secondary font-medium truncate">{card.subLabel}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
