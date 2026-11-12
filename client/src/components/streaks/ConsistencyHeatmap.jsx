import { useMemo, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  format,
  subDays,
  getDay,
  isValid,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addDays,
} from 'date-fns';
import { CalendarDays, Flame, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';

export default function ConsistencyHeatmap({ heatmapData = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Minutes map keyed by YYYY-MM-DD
  const minutesMap = useMemo(() => {
    const map = {};
    (heatmapData || []).forEach((item) => {
      const d = item.date || item._id;
      if (d) {
        map[d] = item.minutes || item.totalMinutes || 0;
      }
    });
    return map;
  }, [heatmapData]);

  // Build the 52-week calendar grid (Monday-aligned)
  const { weeks, monthLabels, stats } = useMemo(() => {
    const today = new Date();
    // 52 weeks = 364 days. Align end of grid to end of current week (Sunday)
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const start = startOfWeek(subDays(end, 52 * 7 - 1), { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start, end });
    const weekChunks = [];
    let currentWeek = [];

    let totalMinutes = 0;
    let activeDaysCount = 0;
    let qualifiedDaysCount = 0;
    let maxDayMinutes = 0;

    allDays.forEach((day) => {
      const isFuture = day > today;
      const dateKey = format(day, 'yyyy-MM-dd');
      const mins = isFuture ? 0 : minutesMap[dateKey] || 0;

      if (!isFuture && mins > 0) {
        totalMinutes += mins;
        activeDaysCount++;
        if (mins >= 25) qualifiedDaysCount++;
        if (mins > maxDayMinutes) maxDayMinutes = mins;
      }

      currentWeek.push({
        date: day,
        dateKey,
        mins,
        isFuture,
        isToday: format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
      });

      if (currentWeek.length === 7) {
        weekChunks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weekChunks.push(currentWeek);
    }

    // Determine month label positions (first week where a new month starts)
    const labels = [];
    let lastMonth = -1;

    weekChunks.forEach((week, wIdx) => {
      // Check the middle or first day of the week for month transition
      const firstValidDay = week[0]?.date;
      if (firstValidDay) {
        const m = firstValidDay.getMonth();
        if (m !== lastMonth) {
          labels.push({
            monthName: format(firstValidDay, 'MMM'),
            weekIndex: wIdx,
          });
          lastMonth = m;
        }
      }
    });

    return {
      weeks: weekChunks,
      monthLabels: labels,
      stats: {
        totalMinutes,
        activeDaysCount,
        qualifiedDaysCount,
        maxDayMinutes,
      },
    };
  }, [minutesMap]);

  const getColorClass = (mins, isFuture) => {
    if (isFuture) return 'bg-[#F2F4EE] border-transparent opacity-30 cursor-not-allowed';
    if (!mins || mins === 0) return 'bg-[#EAECE6] border-[#DFE2DA] hover:border-[#B5BBB0]';
    if (mins < 25) return 'bg-[#C5E3CF] border-[#A8D7B6] hover:border-[#72BC89]';
    if (mins < 60) return 'bg-[#8FCBA3] border-[#72BC89] hover:border-[#3F9A63]';
    if (mins < 120) return 'bg-[#3F9A63] border-[#328553] hover:border-[#216E39]';
    if (mins < 240) return 'bg-[#216E39] border-[#1A572D] hover:border-[#134E27]';
    return 'bg-[#134E27] border-[#0C381B]';
  };

  return (
    <Card className="rounded-3xl border border-[#E5E8E1] bg-white overflow-hidden shadow-xs">
      <CardHeader className="p-6 pb-4 border-b border-[#E5E8E1] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EAF3EC] border border-[#C2DEC9] flex items-center justify-center text-[#216E39] shadow-2xs shrink-0">
            <CalendarDays className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-heading font-bold text-[#141815] tracking-tight">
                52-Week Study Heatmap
              </CardTitle>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF3EC] text-[#216E39] border border-[#C2DEC9]">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-[#5F6862] mt-0.5">
              Daily focused learning matrix. Days with ≥25 mins study qualify for active streaks.
            </p>
          </div>
        </div>

        {/* Quick Annual Summary Badges */}
        <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-[#F8F9F5] border border-[#E5E8E1]">
            <span className="text-[#88928B] text-[11px] block font-medium">Active Days</span>
            <b className="text-sm font-heading font-bold text-[#141815] font-mono">
              {stats.activeDaysCount} <span className="text-[10px] text-[#88928B] font-sans font-normal">/ 365</span>
            </b>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#F8F9F5] border border-[#E5E8E1]">
            <span className="text-[#88928B] text-[11px] block font-medium">Streak Qualified</span>
            <b className="text-sm font-heading font-bold text-[#216E39] font-mono">
              {stats.qualifiedDaysCount} <span className="text-[10px] text-[#88928B] font-sans font-normal">days (≥25m)</span>
            </b>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#F8F9F5] border border-[#E5E8E1]">
            <span className="text-[#88928B] text-[11px] block font-medium">Total Focus</span>
            <b className="text-sm font-heading font-bold text-[#141815] font-mono">
              {(stats.totalMinutes / 60).toFixed(1)} <span className="text-[10px] text-[#88928B] font-sans font-normal">hrs</span>
            </b>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[820px] select-none">
            {/* Top Month Labels Header Row */}
            <div className="flex mb-2 text-[11px] font-semibold text-[#88928B] font-heading relative h-5 pl-8">
              {monthLabels.map((lbl, idx) => (
                <span
                  key={idx}
                  className="absolute"
                  style={{ left: `calc(32px + ${lbl.weekIndex * 15.2}px)` }}
                >
                  {lbl.monthName}
                </span>
              ))}
            </div>

            {/* Main Grid: Left Weekday Labels + Week Columns */}
            <div className="flex gap-2">
              {/* Left Column: Mon, Wed, Fri Labels */}
              <div className="flex flex-col gap-[3px] text-[10px] font-semibold text-[#88928B] font-heading pr-1 pt-[1px] select-none w-7 shrink-0 text-right">
                <span className="h-[12.5px] leading-[12.5px]">Mon</span>
                <span className="h-[12.5px] leading-[12.5px] opacity-0">Tue</span>
                <span className="h-[12.5px] leading-[12.5px]">Wed</span>
                <span className="h-[12.5px] leading-[12.5px] opacity-0">Thu</span>
                <span className="h-[12.5px] leading-[12.5px]">Fri</span>
                <span className="h-[12.5px] leading-[12.5px] opacity-0">Sat</span>
                <span className="h-[12.5px] leading-[12.5px] opacity-0">Sun</span>
              </div>

              {/* 52 Week Columns */}
              <div className="flex gap-[3.2px] flex-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3.2px]">
                    {week.map((item) => {
                      const isHovered = hoveredDay?.dateKey === item.dateKey;

                      return (
                        <div
                          key={item.dateKey}
                          onMouseEnter={() => !item.isFuture && setHoveredDay(item)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={cn(
                            'w-[12.5px] h-[12.5px] rounded-[3px] border transition-all duration-150 relative cursor-pointer',
                            getColorClass(item.mins, item.isFuture),
                            item.isToday && 'ring-2 ring-[#216E39] ring-offset-1 ring-offset-white',
                            isHovered && 'scale-150 z-20 shadow-md ring-2 ring-[#141815]'
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Hover Tooltip Bar */}
            <div className="mt-4 pt-3 border-t border-[#E5E8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-h-[24px]">
                {hoveredDay ? (
                  <div className="flex items-center gap-2 text-xs animate-fade-in">
                    <span className="font-semibold text-[#141815]">
                      {format(hoveredDay.date, 'EEEE, d MMMM yyyy')}:
                    </span>
                    <span className="font-mono font-bold text-[#216E39]">
                      {hoveredDay.mins > 0 ? formatDuration(hoveredDay.mins) : '0 minutes'} focused
                    </span>
                    {hoveredDay.mins >= 25 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#216E39] bg-[#EAF3EC] px-2 py-0.5 rounded-full border border-[#C2DEC9]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Streak Qualified</span>
                      </span>
                    ) : hoveredDay.mins > 0 ? (
                      <span className="text-[11px] text-[#D97706] font-medium bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE6A8]">
                        Needs 25m for streak
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#88928B]">No study logged</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[#88928B] text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#216E39]" />
                    <span>Hover over any calendar cell to view daily study duration and streak qualification</span>
                  </span>
                )}
              </div>

              {/* Intensity Legend */}
              <div className="flex items-center gap-2 text-[#88928B] text-[11px] shrink-0 font-medium">
                <span>Less</span>
                <div className="flex items-center gap-1">
                  <div className="w-[11px] h-[11px] rounded-[2.5px] bg-[#EAECE6] border border-[#DFE2DA]" title="0 mins" />
                  <div className="w-[11px] h-[11px] rounded-[2.5px] bg-[#C5E3CF] border border-[#A8D7B6]" title="1-24 mins" />
                  <div className="w-[11px] h-[11px] rounded-[2.5px] bg-[#8FCBA3] border border-[#72BC89]" title="25-59 mins (Streak Qualifies)" />
                  <div className="w-[11px] h-[11px] rounded-[2.5px] bg-[#3F9A63] border border-[#328553]" title="1-2 hours" />
                  <div className="w-[11px] h-[11px] rounded-[2.5px] bg-[#216E39] border border-[#1A572D]" title="2-4 hours" />
                  <div className="w-[11px] h-[11px] rounded-[2.5px] bg-[#134E27] border border-[#0C381B]" title="4+ hours" />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
