import StreakDisplay from './StreakDisplay';
import Heatmap from '../Heatmap';
import Achievements from './Achievements';
import { useStreakData, useHeatmapData, useAnalytics } from '@/hooks/useAnalytics';
import { useProblemStats } from '@/hooks/useProblems';
import Skeleton from '@/components/ui/Skeleton';
import { Flame, Trophy } from 'lucide-react';

export default function StreaksPage() {
  const { data: streakData, isLoading: streakLoading } = useStreakData();
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmapData();
  const { data: analyticsData } = useAnalytics();
  const { data: problemStats } = useProblemStats();

  const todayMinutes = analyticsData?.today?.focusMinutes || 0;
  const totalSolved = problemStats?.solved || 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-[1200px] mx-auto select-none pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[var(--line)]">
        <div className="w-10 h-10 rounded-xl bg-[var(--warn-soft)] border border-[var(--warn)]/30 flex items-center justify-center">
          <Flame className="w-5 h-5 text-[var(--warn)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-heading">
            Study Streak &amp; Consistency
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            25+ minutes of daily focused study maintains your streak momentum.
          </p>
        </div>
      </div>

      {/* Hero Stats */}
      {streakLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <StreakDisplay streak={streakData} todayMinutes={todayMinutes} />
      )}

      {/* Modern High-Contrast Heatmap */}
      <div className="card p-5 sm:p-6 bg-[var(--surface)] border-[var(--line)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold font-heading text-[var(--text)]">
            Daily Study Heatmap (Last 53 Weeks)
          </h2>
          <span className="text-xs text-[var(--muted)] font-mono">
            Recorded Sessions
          </span>
        </div>
        {heatmapLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <Heatmap minutesByDay={heatmapData?.days || heatmapData?.data || heatmapData || []} weeks={53} />
        )}
      </div>

      {/* Milestone Badges */}
      <Achievements
        currentStreak={streakData?.currentStreak || 0}
        longestStreak={streakData?.longestStreak || 0}
        totalSolved={totalSolved}
      />
    </div>
  );
}
