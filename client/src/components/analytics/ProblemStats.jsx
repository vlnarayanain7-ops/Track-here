import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Progress from '@/components/ui/Progress';
import { useProblemStats } from '@/hooks/useProblems';
import { Code2, Award, CheckCircle2 } from 'lucide-react';

export default function ProblemStats() {
  const { data: stats } = useProblemStats();

  const total = stats?.total || 0;
  const solved = stats?.solved || 0;
  const solo = stats?.solvedIndependently || 0;
  const soloPct = solved > 0 ? Math.round((solo / solved) * 100) : 0;

  const byDifficulty = stats?.byDifficulty || [];
  const byPlatform = stats?.byPlatform || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 border-b border-border">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-accent" />
            <span>Problem Solving Analysis</span>
          </span>
          <span className="text-xs text-text-secondary font-mono">
            {solved}/{total} Solved
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Independence Rate Banner */}
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-text-secondary block">Independent Solving Ratio</span>
            <p className="text-xl font-bold font-mono text-accent mt-0.5">
              {soloPct}% ({solo} problems)
            </p>
            <p className="text-[11px] text-text-secondary mt-1">
              Solved completely without reading hints or viewing editorial
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* By Difficulty */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono block mb-3">
            Problems by Difficulty
          </span>
          <div className="space-y-3">
            {['Easy', 'Medium', 'Hard'].map((diff) => {
              const diffItem = byDifficulty.find((d) => d._id === diff) || { count: 0, solved: 0 };
              const diffSolved = diffItem.solved || 0;
              const diffTotal = diffItem.count || 0;
              const diffPct = diffTotal > 0 ? Math.round((diffSolved / diffTotal) * 100) : 0;

              const color =
                diff === 'Easy' ? 'text-emerald-400' : diff === 'Medium' ? 'text-amber-400' : 'text-rose-400';

              return (
                <div key={diff} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${color}`}>{diff}</span>
                    <span className="text-text-secondary font-mono">
                      {diffSolved} / {diffTotal} ({diffPct}%)
                    </span>
                  </div>
                  <Progress value={diffPct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* By Platform */}
        {byPlatform.length > 0 && (
          <div className="pt-2 border-t border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono block mb-2">
              Platform Distribution
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {byPlatform.map((p) => (
                <div
                  key={p._id || 'Other'}
                  className="p-2.5 rounded-lg bg-surface/40 border border-border flex items-center justify-between"
                >
                  <span className="font-medium text-text-primary">{p._id || 'Other'}</span>
                  <span className="font-mono text-text-secondary">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

