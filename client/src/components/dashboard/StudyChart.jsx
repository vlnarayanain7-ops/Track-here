import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function StudyChart({ data }) {
  const chartData = (data || []).map((item) => ({
    day: item.date || item.day || item.name,
    hours: item.minutes ? parseFloat((item.minutes / 60).toFixed(1)) : (item.hours || 0),
    minutes: item.minutes || Math.round((item.hours || 0) * 60),
  }));

  const totalHours = chartData.reduce((sum, d) => sum + d.hours, 0).toFixed(1);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-white border border-border p-2.5 rounded-xl shadow-md text-xs">
          <p className="font-semibold text-text-primary mb-1">{p.day}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            <p className="text-emerald-800 font-mono font-semibold">
              {p.hours} hrs <span className="text-text-muted font-normal">({p.minutes} mins)</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-text-primary">
            Weekly Study Progress
          </h2>
        </div>
        <span className="text-xs text-text-muted font-mono font-semibold bg-surface px-2 py-0.5 rounded-lg border border-border">
          {totalHours}h total
        </span>
      </div>

      <div className="min-h-[190px] pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-text-muted py-8 gap-2">
            <p className="text-center">No study sessions logged this week yet.<br /><span className="text-emerald-700 font-medium">Start a focus timer!</span></p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E1" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#8C867E"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                fontFamily="'JetBrains Mono', monospace"
              />
              <YAxis
                stroke="#8C867E"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}h`}
                fontFamily="'JetBrains Mono', monospace"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F3EF', opacity: 0.8, radius: 4 }} />
              <Bar
                dataKey="hours"
                fill="#16A34A"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
