import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  Target,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Grid,
  List,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Dialog from '@/components/ui/Dialog';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useTimetableSlots, useCreateTimetableSlot, useDeleteTimetableSlot } from '@/hooks/useTimetable';
import { useStudySessions } from '@/hooks/useStudySessions';
import { ACTIVITY_TYPES } from '@/lib/constants';
import { formatDuration, cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';

const ALL_DAYS = [
  { index: 1, name: 'Monday', short: 'Mon' },
  { index: 2, name: 'Tuesday', short: 'Tue' },
  { index: 3, name: 'Wednesday', short: 'Wed' },
  { index: 4, name: 'Thursday', short: 'Thu' },
  { index: 5, name: 'Friday', short: 'Fri' },
  { index: 6, name: 'Saturday', short: 'Sat' },
  { index: 0, name: 'Sunday', short: 'Sun' },
];

const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 06:00 to 24:00

export default function TimetablePage({ isEmbedded = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userWeekStart = user?.weekStartsOn || 'Monday';
  const orderedDays = useMemo(() => {
    if (userWeekStart === 'Sunday') {
      return [
        { index: 0, name: 'Sunday', short: 'Sun' },
        { index: 1, name: 'Monday', short: 'Mon' },
        { index: 2, name: 'Tuesday', short: 'Tue' },
        { index: 3, name: 'Wednesday', short: 'Wed' },
        { index: 4, name: 'Thursday', short: 'Thu' },
        { index: 5, name: 'Friday', short: 'Fri' },
        { index: 6, name: 'Saturday', short: 'Sat' },
      ];
    }
    return ALL_DAYS;
  }, [userWeekStart]);

  const userSubjects = user?.subjects && Array.isArray(user.subjects)
    ? user.subjects.map((s) => s.name)
    : [];

  const subjectColorMap = useMemo(() => {
    const map = {};
    (user?.subjects || []).forEach((s) => {
      map[s.name] = s.color || 'var(--primary)';
    });
    return map;
  }, [user?.subjects]);

  const todayIndex = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [desktopViewMode, setDesktopViewMode] = useState('grid'); // 'grid' | 'list'

  // Slot form
  const [dayOfWeek, setDayOfWeek] = useState(todayIndex);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [subject, setSubject] = useState(userSubjects[0] || 'General Study');
  const [topic, setTopic] = useState('');
  const [activityType, setActivityType] = useState('Problem Solving');
  const [priority, setPriority] = useState('Medium');
  const [repeatWeekly, setRepeatWeekly] = useState(true);
  const [notes, setNotes] = useState('');

  // Queries
  const { data: slotsData, isLoading } = useTimetableSlots();
  const createSlotMutation = useCreateTimetableSlot();
  const deleteSlotMutation = useDeleteTimetableSlot();
  const { data: sessionsData } = useStudySessions({ limit: 10 });

  const allSlots = slotsData?.data?.slots || slotsData?.slots || [];
  const todaySessions = sessionsData?.data?.sessions || sessionsData?.sessions || [];

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map = {};
    ALL_DAYS.forEach((d) => {
      map[d.index] = allSlots.filter((s) => s.dayOfWeek === d.index);
    });
    return map;
  }, [allSlots]);

  // Examination countdown calculation
  let examDaysRemaining = null;
  if (user?.examDate) {
    examDaysRemaining = differenceInDays(new Date(user.examDate), new Date());
  }

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    await createSlotMutation.mutateAsync({
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      subject,
      topic: topic.trim() || undefined,
      activityType,
      priority,
      repeatWeekly,
      notes: notes.trim() || undefined,
    });
    setIsAddSlotOpen(false);
    setTopic('');
    setNotes('');
  };

  const handleDeleteSlot = async (slotId) => {
    await deleteSlotMutation.mutateAsync(slotId);
  };

  // Helper to calculate top/height percentage in a 06:00 - 24:00 (18 hours) grid
  const calculateSlotStyle = (start, end) => {
    const [startH, startM] = (start || '06:00').split(':').map(Number);
    const [endH, endM] = (end || '07:00').split(':').map(Number);

    const startMinutes = (startH - 6) * 60 + (startM || 0);
    const endMinutes = (endH - 6) * 60 + (endM || 0);
    const totalGridMinutes = 18 * 60; // 06:00 to 24:00 = 1080 mins

    const topPct = Math.max(0, Math.min(100, (startMinutes / totalGridMinutes) * 100));
    const durationMins = Math.max(30, endMinutes - startMinutes);
    const heightPct = Math.max(3.5, (durationMins / totalGridMinutes) * 100);

    return { top: `${topPct}%`, height: `${heightPct}%` };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      {!isEmbedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[var(--line)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center border border-[var(--primary)]/30 text-[var(--primary)] shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-heading">
                Weekly Timetable &amp; Routine
              </h1>
              <p className="text-[12px] text-[var(--muted)] mt-0.5">
                Plan your 7-day routine, allocate subject time slots, and compare planned vs actual focus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center bg-[var(--surface-2)] p-0.5 rounded-lg border border-[var(--line)]">
              <button
                onClick={() => setDesktopViewMode('grid')}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 font-medium',
                  desktopViewMode === 'grid'
                    ? 'bg-[var(--surface)] text-[var(--text)] shadow-2xs font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                )}
                title="Full Week Grid"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Week Grid</span>
              </button>
              <button
                onClick={() => setDesktopViewMode('list')}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 font-medium',
                  desktopViewMode === 'list'
                    ? 'bg-[var(--surface)] text-[var(--text)] shadow-2xs font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                )}
                title="Daily List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Day List</span>
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setDayOfWeek(selectedDay);
                setIsAddSlotOpen(true);
              }}
              icon={Plus}
              className="text-xs gap-1.5"
            >
              <span>Add Block</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-semibold text-[var(--muted)]">Weekly Time Allocation</span>
          <Button
            size="sm"
            onClick={() => {
              setDayOfWeek(selectedDay);
              setIsAddSlotOpen(true);
            }}
            icon={Plus}
            className="text-xs gap-1.5"
          >
            <span>Add Block</span>
          </Button>
        </div>
      )}

      {/* Target Examination Countdown Banner */}
      {user?.examDate && (
        <div className="p-4 rounded-2xl bg-[var(--warn-soft)] border border-[var(--warn)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--warn)]/20 border border-[var(--warn)]/30 flex items-center justify-center text-[var(--warn)] shrink-0 text-lg">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-[var(--warn)] font-bold">
                  Target Goal Countdown
                </span>
                {user.preparationType && (
                  <Badge variant="accent" size="sm" className="text-[10px]">
                    {user.preparationType}
                  </Badge>
                )}
              </div>
              <h2 className="text-base font-bold text-[var(--text)] font-heading">
                {user.examName || `${user.preparationType || 'Competitive'} Examination`}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Target Date: {format(new Date(user.examDate), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 sm:text-right shrink-0">
            <span className="text-3xl font-extrabold font-mono text-[var(--text)]">
              {examDaysRemaining !== null ? Math.max(0, examDaysRemaining) : '--'}
            </span>
            <span className="text-xs text-[var(--muted)] font-medium">days remaining</span>
          </div>
        </div>
      )}

      {/* Desktop Week Grid View (>= 1024px when desktopViewMode === 'grid') */}
      <div className="hidden lg:block">
        {desktopViewMode === 'grid' && (
          <div className="space-y-4">
            <div className="card p-4 overflow-x-auto">
              {/* Header Row: 7 Days */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 pb-3 border-b border-[var(--line)] text-center text-xs">
                <span className="text-[var(--muted)] font-mono text-[11px] self-end">Time</span>
                {orderedDays.map((d) => {
                  const isToday = todayIndex === d.index;
                  const dayCount = slotsByDay[d.index]?.length || 0;
                  return (
                    <div
                      key={d.index}
                      className={cn(
                        'p-2 rounded-xl border text-center transition-all',
                        isToday
                          ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-2xs'
                          : 'bg-[var(--surface-2)] border-[var(--line)] text-[var(--text)] font-semibold'
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{d.name}</span>
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                      </div>
                      <span className="text-[10px] text-[var(--muted)] font-normal font-mono block mt-0.5">
                        {dayCount} planned
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body: 06:00 to 24:00 with 18 Hour Rows */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 relative mt-2" style={{ height: '720px' }}>
                {/* Time Axis Labels */}
                <div className="relative h-full flex flex-col justify-between py-1 text-[11px] font-mono text-[var(--muted)]">
                  {HOURS.filter((_, idx) => idx % 2 === 0).map((h) => (
                    <span key={h} className="leading-none">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  ))}
                  <span className="leading-none">24:00</span>
                </div>

                {/* 7 Columns for Days */}
                {orderedDays.map((d) => {
                  const isToday = todayIndex === d.index;
                  const slots = slotsByDay[d.index] || [];

                  return (
                    <div
                      key={d.index}
                      className={cn(
                        'relative h-full rounded-xl border border-dashed transition-colors p-1',
                        isToday
                          ? 'bg-[var(--primary-soft)]/20 border-[var(--primary)]/40'
                          : 'bg-[var(--surface-2)]/40 border-[var(--line)]'
                      )}
                    >
                      {slots.map((slot) => {
                        const style = calculateSlotStyle(slot.startTime, slot.endTime);
                        const subColor = subjectColorMap[slot.subject] || 'var(--primary)';

                        return (
                          <div
                            key={slot._id}
                            style={{
                              top: style.top,
                              height: style.height,
                              borderColor: `${subColor}60`,
                              backgroundColor: `${subColor}18`,
                            }}
                            className="absolute left-1 right-1 rounded-lg border p-1.5 text-left text-[11px] overflow-hidden shadow-2xs group flex flex-col justify-between z-10 transition-transform hover:scale-[1.02]"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold truncate text-[var(--text)]" style={{ color: subColor }}>
                                  {slot.subject}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSlot(slot._id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--muted)] hover:text-[var(--danger)] rounded transition-opacity"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[10px] text-[var(--text)] font-medium truncate mt-0.5">
                                {slot.topic || slot.activityType}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[9px] font-mono text-[var(--muted)] pt-0.5 border-t border-[var(--line)]/40">
                              <span>
                                {slot.startTime}-{slot.endTime}
                              </span>
                              <span
                                onClick={() => navigate(`/study?subject=${encodeURIComponent(slot.subject)}`)}
                                className="cursor-pointer text-[var(--primary)] font-bold hover:underline"
                              >
                                Start →
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile/Tablet View (< 1024px or when in 'list' mode) */}
      <div className={cn('space-y-6', desktopViewMode === 'grid' && 'lg:hidden')}>
        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--line)]">
          {orderedDays.map((d) => {
            const isToday = todayIndex === d.index;
            const isSelected = selectedDay === d.index;
            const count = slotsByDay[d.index]?.length || 0;

            return (
              <button
                key={d.index}
                onClick={() => setSelectedDay(d.index)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 min-h-[44px]',
                  isSelected
                    ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-2xs font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                )}
              >
                <span>{d.name}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)]" title="Today" />
                )}
                {count > 0 && (
                  <span
                    className={cn(
                      'font-mono text-[10px] px-1.5 py-0.2 rounded',
                      isSelected ? 'bg-white/20 text-white' : 'bg-[var(--surface-2)] text-[var(--muted)]'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List of Slots for Selected Day */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text)] font-heading flex items-center gap-2">
              <span>{ALL_DAYS.find((d) => d.index === selectedDay)?.name}&apos;s Planned Schedule</span>
              <span className="text-xs text-[var(--muted)] font-normal font-mono">
                ({slotsByDay[selectedDay]?.length || 0} blocks)
              </span>
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDayOfWeek(selectedDay);
                setIsAddSlotOpen(true);
              }}
              icon={Plus}
              className="text-xs h-8 gap-1"
            >
              <span>Add Block</span>
            </Button>
          </div>

          {slotsByDay[selectedDay]?.length === 0 ? (
            <div className="card p-8 text-center space-y-3">
              <Clock className="w-8 h-8 text-[var(--muted)] mx-auto opacity-40" />
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                No study blocks scheduled for {ALL_DAYS.find((d) => d.index === selectedDay)?.name}. Add planned study slots to structure your day.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDayOfWeek(selectedDay);
                  setIsAddSlotOpen(true);
                }}
                icon={Plus}
                className="text-xs"
              >
                Schedule First Slot
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {slotsByDay[selectedDay].map((slot) => {
                const subColor = subjectColorMap[slot.subject] || 'var(--primary)';
                return (
                  <div
                    key={slot._id}
                    className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-center shrink-0">
                        <span className="block text-xs font-mono font-bold text-[var(--text)]">
                          {slot.startTime}
                        </span>
                        <span className="block text-[10px] font-mono text-[var(--muted)]">
                          to {slot.endTime}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded border"
                            style={{
                              backgroundColor: `${subColor}20`,
                              borderColor: `${subColor}40`,
                              color: subColor,
                            }}
                          >
                            {slot.subject}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] font-mono">
                            {slot.activityType}
                          </span>
                          {slot.priority === 'High' && (
                            <Badge variant="danger" size="sm" className="text-[10px]">
                              High Priority
                            </Badge>
                          )}
                        </div>

                        {slot.topic ? (
                          <p className="text-xs font-semibold text-[var(--text)] truncate">
                            {slot.topic}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--muted)]">General study session</p>
                        )}

                        {slot.notes && (
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/study?subject=${encodeURIComponent(slot.subject)}`)}
                        icon={Play}
                        className="text-xs h-8 px-3 gap-1"
                      >
                        <span>Start</span>
                      </Button>
                      <button
                        onClick={() => handleDeleteSlot(slot._id)}
                        className="p-2 text-[var(--muted)] hover:text-[var(--danger)] rounded-lg hover:bg-[var(--danger-soft)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Delete slot"
                        aria-label="Delete study slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Completed Focus Side Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text)] font-heading">
            Recent Completed Focus
          </h3>
          <span className="text-xs text-[var(--muted)] font-mono">Actual Activity</span>
        </div>

        <div className="card p-4 space-y-2.5">
          {todaySessions.length === 0 ? (
            <p className="text-xs text-[var(--muted)] py-6 text-center">
              No completed study sessions recorded yet today. Start a timer to log real focus!
            </p>
          ) : (
            todaySessions.slice(0, 5).map((s) => (
              <div
                key={s._id}
                className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-between text-xs"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    <span className="font-semibold text-[var(--text)] truncate">
                      {s.topic || s.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--muted)]">
                    {s.category} · {s.activityType}
                  </span>
                </div>
                <span className="font-mono text-[var(--primary)] font-bold shrink-0">
                  {formatDuration(s.focusDuration)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Slot Modal */}
      <Dialog
        open={isAddSlotOpen}
        onClose={() => setIsAddSlotOpen(false)}
        title="Schedule Study Block"
        size="sm"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-[var(--text)] block mb-1 font-heading">
              Day of Week
            </label>
            <Select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
            >
              {orderedDays.map((d) => (
                <option key={d.index} value={d.index}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text)] block mb-1 font-heading">
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text)] block mb-1 font-heading">
                End Time
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text)] block mb-1 font-heading">
                Subject
              </label>
              <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {userSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                {userSubjects.length === 0 && <option value="General Study">General Study</option>}
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text)] block mb-1 font-heading">
                Activity
              </label>
              <Select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                {ACTIVITY_TYPES.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
                <option value="Mock Test">Mock Test</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text)] block mb-1 font-heading">
              Topic or Chapter (optional)
            </label>
            <Input
              placeholder="e.g. Dynamic Programming, Graph Theory"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text)] block mb-1 font-heading">
              Priority
            </label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High Priority</option>
            </Select>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="repeatWeekly"
              checked={repeatWeekly}
              onChange={(e) => setRepeatWeekly(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--ring)]"
            />
            <label htmlFor="repeatWeekly" className="text-xs text-[var(--text)] cursor-pointer select-none">
              Repeat this block weekly
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text)] block mb-1 font-heading">
              Notes (optional)
            </label>
            <Input
              placeholder="e.g. Solve 3 hard problems"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddSlotOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Block
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
