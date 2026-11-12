import { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useCategoryBreakdown } from '@/hooks/useAnalytics';
import { formatDuration } from '@/lib/utils';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#15803D', '#2563EB', '#D97706', '#7C3AED', '#E11D48', '#0D9488', '#F59E0B'];

export default function CategoryBreakdown() {
  const { data, isLoading } = useCategoryBreakdown();

  const categories = data?.categories || [];
  const topTopics = data?.topTopics || [];

  const pieData = categories.map((c) => ({
    name: c._id || 'Other',
    value: c.totalMinutes || 0,
  }));

  const totalMinutes = pieData.reduce((acc, c) => acc + c.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      const pct = totalMinutes > 0 ? Math.round((p.value / totalMinutes) * 100) : 0;
      return (
        <div className="bg-card border border-border p-2.5 rounded-xl text-xs shadow-md">
          <p className="font-semibold text-text-primary mb-1">{p.name}</p>
          <p className="text-emerald-700 font-mono font-medium">
            {formatDuration(p.value)} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shrink-0">
            <PieIcon className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-semibold">Category &amp; Topic Focus</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 pt-2">
        {pieData.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs text-text-muted">
            No category distribution data available yet.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category list with percentages */}
            <div className="flex-1 space-y-2 w-full">
              {pieData.map((entry, idx) => {
                const pct = totalMinutes > 0 ? Math.round((entry.value / totalMinutes) * 100) : 0;
                return (
                  <div key={entry.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-surface/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-text-primary font-medium">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-text-muted">{formatDuration(entry.value)}</span>
                      <span className="text-text-primary font-semibold bg-surface/50 px-1.5 py-0.5 rounded">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top 5 Topics */}
        {topTopics.length > 0 && (
          <div className="pt-3 border-t border-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted font-mono block mb-2.5">
              Top Focused Topics
            </span>
            <div className="space-y-1.5">
              {topTopics.slice(0, 5).map((topic, i) => (
                <div
                  key={topic._id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface/40 border border-border/50 text-xs hover:border-border-light transition-colors"
                >
                  <span className="text-text-primary font-medium truncate flex-1 mr-2">
                    <span className="text-text-muted font-mono mr-1.5">{i + 1}.</span>
                    {topic._id}
                  </span>
                  <span className="text-accent font-mono font-medium shrink-0">
                    {formatDuration(topic.totalMinutes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
