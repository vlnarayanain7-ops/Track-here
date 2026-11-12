import { useState } from 'react';
import StudyTimeChart from './StudyTimeChart';
import CategoryBreakdown from './CategoryBreakdown';
import ProblemStats from './ProblemStats';
import WeeklySummary from './WeeklySummary';
import StreakDisplay from '@/components/streaks/StreakDisplay';
import Heatmap from '@/components/Heatmap';
import Achievements from '@/components/streaks/Achievements';
import { useStreakData, useHeatmapData, useAnalytics } from '@/hooks/useAnalytics';
import { useProblemStats } from '@/hooks/useProblems';
import Skeleton from '@/components/ui/Skeleton';
import { BarChart3, Flame, Clock, Award } from 'lucide-react';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('consistency'); // 'consistency' | 'time' | 'practice'

  const { data: streakData, isLoading: streakLoading } = useStreakData();
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmapData();
  const { data: analyticsData } = useAnalytics();
  const { data: problemStats } = useProblemStats();

  const todayMinutes = analyticsData?.today?.focusMinutes || 0;
  const totalSolved = problemStats?.solved || 0;

  const tabs = [
    { id: 'consistency', label: 'Consistency', icon: Flame },
    { id: 'time', label: 'Study Time', icon: Clock },
    { id: 'practice', label: 'Practice & Problems', icon: Award },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-[1240px] mx-auto select-none pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] font-heading">
              Statistics &amp; Analytics
            </h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Review your study momentum, time allocation across subjects, and problem-solving metrics.
            </p>
          </div>
        </div>

        {/* Clean 3-Tab Bar */}
        <div className="flex bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--line)] shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-2xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: CONSISTENCY ─── */}
      {activeTab === 'consistency' && (
        <div className="space-y-6">
          {/* Streak Hero Banner */}
          {streakLoading ? (
            <Skeleton className="h-36 w-full rounded-2xl" />
          ) : (
            <StreakDisplay streak={streakData} todayMinutes={todayMinutes} />
          )}

          {/* Heatmap */}
          <div className="card p-5 sm:p-6 bg-[var(--surface)] border-[var(--line)] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-heading text-[var(--text)]">
                Daily Activity Grid (53 Weeks)
              </h2>
              <span className="text-xs text-[var(--muted)] font-mono">
                25m minimum keeps streak active
              </span>
            </div>
            {heatmapLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : (
              <Heatmap minutesByDay={heatmapData?.days || heatmapData?.data || heatmapData || []} weeks={53} />
            )}
          </div>

          {/* Milestones */}
          <Achievements
            currentStreak={streakData?.currentStreak || 0}
            longestStreak={streakData?.longestStreak || 0}
            totalSolved={totalSolved}
          />
        </div>
      )}

      {/* ─── TAB 2: TIME ─── */}
      {activeTab === 'time' && (
        <div className="space-y-6">
          <WeeklySummary />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudyTimeChart />
            <CategoryBreakdown />
          </div>
        </div>
      )}

      {/* ─── TAB 3: PRACTICE ─── */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          <ProblemStats />
        </div>
      )}
    </div>
  );
}
