import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useWeeklySummary } from '@/hooks/useAnalytics';
import { formatDuration } from '@/lib/utils';
import { BarChart3, CheckCircle2, Clock, Calendar, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

export default function WeeklySummary() {
  const { data: summary, isLoading } = useWeeklySummary();

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const totalMinutes = summary?.totalMinutes || 0;
  const activeDays = summary?.activeDays || 0;
  const avgDailyMins = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
  const completedTasksCount = summary?.completedTasksCount || 0;
  const problemsSolved = summary?.problemsSolved || 0;
  const independentSolved = summary?.independentSolved || 0;
  const topicsLearned = summary?.topicsLearned || [];
  const mistakesList = summary?.commonMistakes || [];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Weekly Executive Review</CardTitle>
              <p className="text-xs text-text-secondary">
                Synthesis of focused hours vs. demonstrated mastery
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Core KPI Grid (Flowly Pastels) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#F0F7F1] border border-[#D9EADC]">
            <span className="text-xs text-emerald-900 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Total Focused Time</span>
            </span>
            <p className="text-xl font-bold font-mono text-emerald-950 mt-1.5">
              {formatDuration(totalMinutes)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FDF3EE] border border-[#F8DFD4]">
            <span className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Active Study Days</span>
            </span>
            <p className="text-xl font-bold font-mono text-amber-950 mt-1.5">
              {activeDays} / 7 days
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F2F4FD] border border-[#DFE4FB]">
            <span className="text-xs text-indigo-900 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />
              <span>Tasks Completed</span>
            </span>
            <p className="text-xl font-bold font-mono text-indigo-950 mt-1.5">
              {completedTasksCount}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FEF8EC] border border-[#FCEBCB]">
            <span className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-600" />
              <span>Solo Solved</span>
            </span>
            <p className="text-xl font-bold font-mono text-amber-950 mt-1.5">
              {independentSolved} / {problemsSolved}
            </p>
          </div>
        </div>

        {/* Qualitative Learning vs Time Spent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/50">
          {/* Topics learned */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono flex items-center gap-1.5 mb-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-700" />
              <span>Demonstrated Topics Mastered</span>
            </h4>
            {topicsLearned.length === 0 ? (
              <p className="text-xs text-text-secondary italic">
                No topic sessions recorded this week.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {topicsLearned.map((topic, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-center gap-2 p-2 rounded-lg bg-surface border border-border"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-text-primary font-medium">{topic}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mistakes & Bottlenecks */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono flex items-center gap-1.5 mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Recurring Mistakes &amp; Friction Points</span>
            </h4>
            {mistakesList.length === 0 ? (
              <p className="text-xs text-text-secondary italic">
                No mistake logs recorded this week. Great execution!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {mistakesList.slice(0, 4).map((m, i) => (
                  <li
                    key={i}
                    className="text-xs p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-text-secondary leading-relaxed"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

