import { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { CalendarDays } from 'lucide-react';

export default function HeatmapCard({ heatmapData }) {
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd }),
    [currentMonthStart, currentMonthEnd]
  );

  const minutesMap = useMemo(() => {
    const map = {};
    (heatmapData || []).forEach((item) => {
      const d = item.date || item._id;
      map[d] = item.minutes || item.totalMinutes || item.duration || 0;
    });
    return map;
  }, [heatmapData]);

  const getColorClass = (mins) => {
    if (!mins || mins === 0) return 'bg-[#EFECE6] text-stone-600';
    if (mins < 25) return 'bg-[#D1E7D6] text-emerald-900';
    if (mins < 60) return 'bg-[#86D09B] text-emerald-950 font-medium';
    if (mins < 180) return 'bg-[#34A853] text-white font-semibold';
    if (mins < 240) return 'bg-[#15803D] text-white font-semibold';
    return 'bg-[#0E5B29] text-white font-bold';
  };

  const activeDaysCount = Object.values(minutesMap).filter((m) => m >= 25).length;

  return (
    <Card className="h-full flex flex-col bg-card border-border hover:border-border-light transition-colors duration-200">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-accent" />
            {format(today, 'MMMM yyyy')}
          </span>
          <span className="text-[11px] text-text-muted font-normal font-mono">
            <strong className="text-text-primary">{activeDaysCount}</strong> active (≥25m)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i} className="text-[10px] text-text-muted font-semibold pb-1">
              {d}
            </span>
          ))}

          {Array.from({ length: getDay(currentMonthStart) }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 rounded-lg" />
          ))}

          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const mins = minutesMap[dateStr] || 0;
            const isCurrentDay = isSameDay(day, today);

            return (
              <div
                key={dateStr}
                title={`${format(day, 'MMM d')}: ${mins}m focused study`}
                className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-mono transition-all duration-150 hover:scale-110 cursor-default ${getColorClass(
                  mins
                )} ${isCurrentDay ? 'ring-1.5 ring-accent shadow-sm shadow-accent/20' : ''}`}
              >
                <span>{format(day, 'd')}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-text-muted pt-3 border-t border-border mt-3">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[#EFECE6] border border-[#E5E1DA]" title="0 mins" />
            <div className="w-3 h-3 rounded bg-[#D1E7D6] border border-[#B9DBC0]" title="<25 mins" />
            <div className="w-3 h-3 rounded bg-[#86D09B] border border-[#6EC687]" title="25-59 mins" />
            <div className="w-3 h-3 rounded bg-[#34A853] border border-[#2A9747]" title="1-3 hours" />
            <div className="w-3 h-3 rounded bg-[#15803D] border border-[#166534]" title="3-4 hours" />
            <div className="w-3 h-3 rounded bg-[#0E5B29] border border-[#0A471F]" title="4+ hours" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
