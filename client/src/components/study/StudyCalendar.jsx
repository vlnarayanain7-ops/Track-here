import { useState, useMemo } from 'react';
import { Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addMonths,
  subMonths,
  isValid,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export default function StudyCalendar({ sessions = [], onSelectSession }) {
  const { user } = useAuth();
  const weekStartsOn = user?.weekStartsOn ?? 1; // Default Monday (1)

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  // Group sessions by date string YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map = {};
    (sessions || []).forEach((s) => {
      if (!s?.date) return;
      const parsed = new Date(s.date);
      if (!isValid(parsed)) return;
      const d = format(parsed, 'yyyy-MM-dd');
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });
    return map;
  }, [sessions]);

  const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');
  const selectedDaySessions = sessionsByDate[selectedDateStr] || [];

  // Dynamic day labels respecting weekStartsOn setting
  const dayLabels = useMemo(() => {
    return weekStartsOn === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [weekStartsOn]);

  // Leading empty cells before the first day of the month
  const leadingBlanksCount = useMemo(() => {
    const startDay = getDay(monthStart); // 0 = Sun, 1 = Mon ...
    return (startDay - weekStartsOn + 7) % 7;
  }, [monthStart, weekStartsOn]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Calendar Grid */}
      <div className="card p-0 lg:col-span-2 rounded-xl overflow-hidden bg-[var(--surface)] border-[var(--line)]">
        <div className="flex flex-row items-center justify-between p-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shadow-2xs">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[var(--text)] font-heading">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary-soft)] rounded-lg font-semibold transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {dayLabels.map((d) => (
              <span key={d} className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider pb-2 font-mono">
                {d}
              </span>
            ))}

            {Array.from({ length: leadingBlanksCount }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 rounded-xl" />
            ))}

            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate[dateStr] || [];
              const totalFocus = daySessions.reduce((acc, s) => acc + (s.focusDuration || 0), 0);
              const isSelected = isSameDay(day, selectedDay);
              const isTodayDay = isSameDay(day, new Date());

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(day)}
                  className={`h-16 p-2 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-xs ring-1 ring-[var(--primary)]'
                      : totalFocus > 0
                      ? 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)]/60'
                      : 'border-transparent hover:border-[var(--line)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium leading-none ${
                        isTodayDay
                          ? 'text-white font-bold bg-[var(--primary)] w-5 h-5 rounded-full flex items-center justify-center text-[10px]'
                          : 'text-[var(--text)]'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  {totalFocus > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      <span className="text-[10px] text-[var(--primary)] font-mono font-bold">
                        {totalFocus}m
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="card p-4 rounded-xl bg-[var(--surface)] border-[var(--line)] flex flex-col justify-between">
        <div>
          <div className="border-b border-[var(--line)] pb-3 mb-3">
            <span className="text-xs text-[var(--muted)] font-mono">Selected Day</span>
            <h4 className="text-base font-bold text-[var(--text)] font-heading">
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </h4>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {selectedDaySessions.length === 0 ? (
              <p className="text-xs text-[var(--muted)] py-8 text-center">
                No focus sessions logged on this day.
              </p>
            ) : (
              selectedDaySessions.map((session) => (
                <div
                  key={session._id}
                  onClick={() => onSelectSession?.(session)}
                  className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] hover:border-[var(--primary)]/50 transition-all cursor-pointer text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text)] truncate">
                      {session.topic}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--primary)] font-bold">
                      {session.focusDuration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)]">
                      {session.category}
                    </span>
                    <span>·</span>
                    <span>{session.activityType}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--line)] text-xs text-[var(--muted)] flex justify-between">
          <span>Total for day</span>
          <span className="font-mono font-bold text-[var(--text)]">
            {formatDuration(selectedDaySessions.reduce((acc, s) => acc + (s.focusDuration || 0), 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
