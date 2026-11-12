import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useStudyTimeAnalytics } from '@/hooks/useAnalytics';
import { Clock } from 'lucide-react';

export default function StudyTimeChart() {
  const [period, setPeriod] = useState('week');
  const { data, isLoading } = useStudyTimeAnalytics({ period });

  const rawData = data?.daily || data?.data || [];
  const chartData = rawData.map((d) => ({
    label: d.date || d.day || d.name,
    hours: d.minutes ? parseFloat((d.minutes / 60).toFixed(1)) : 0,
    minutes: d.minutes || 0,
  }));

  const totalMinutes = chartData.reduce((acc, c) => acc + c.minutes, 0);
  const avgMinutes = chartData.length > 0 ? Math.round(totalMinutes / chartData.length) : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-card border border-border/80 p-2.5 rounded-xl shadow-xl text-xs backdrop-blur-sm">
          <p className="font-semibold text-text-primary mb-1">{p.label}</p>
          <p className="text-accent font-mono">
            {p.hours} hrs ({p.minutes} mins)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Focused Study Time</CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              Total: <strong className="text-text-primary font-mono">{(totalMinutes / 60).toFixed(1)} hrs</strong> •
              Avg: <strong className="text-text-primary font-mono">{avgMinutes}m / day</strong>
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex bg-surface/50 p-0.5 rounded-lg border border-border/60">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-200 ${
                period === p
                  ? 'bg-card text-text-primary shadow-sm border border-border/80'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-[260px] pt-4">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-text-muted">
            No study sessions logged for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E1" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#8C867E"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#8C867E"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F3EF' }} />
              <Bar
                dataKey="hours"
                fill="#15803D"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
