import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import {
  Play,
  Plus,
  Check,
  Calendar as CalendarIcon,
  Target,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTasks, useCreateTask, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useRevisions } from '@/hooks/useRevisions';
import { useTimetableSlots } from '@/hooks/useTimetable';
import { useDailyPlan } from '@/hooks/useDailyPlans';
import SideSheet from '@/components/ui/SideSheet';
import MorningCheckIn from '@/components/accountability/MorningCheckIn';
import EveningReview from '@/components/accountability/EveningReview';
import RevisionsPage from '@/components/revisions/RevisionsPage';
import { plural } from '@/lib/plural';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Side sheet states, reading from query params (?journal=morning|evening, ?review=1)
  const [journalSheet, setJournalSheet] = useState(null); // 'morning' | 'evening' | null
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [inlineTaskInput, setInlineTaskInput] = useState('');
  const [showInlineAdd, setShowInlineAdd] = useState(false);

  // Calendar State: Week offset & selected date
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Sync state with URL search params
  useEffect(() => {
    const journalParam = searchParams.get('journal');
    if (journalParam === 'morning' || journalParam === 'evening') {
      setJournalSheet(journalParam);
    } else {
      setJournalSheet(null);
    }

    const reviewParam = searchParams.get('review');
    if (reviewParam === '1' || reviewParam === 'true') {
      setReviewSheetOpen(true);
    } else {
      setReviewSheetOpen(false);
    }
  }, [searchParams]);

  const closeJournalSheet = () => {
    setJournalSheet(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('journal');
    setSearchParams(newParams, { replace: true });
  };

  const closeReviewSheet = () => {
    setReviewSheetOpen(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('review');
    setSearchParams(newParams, { replace: true });
  };

  const openJournal = (kind) => {
    setJournalSheet(kind);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('journal', kind);
    setSearchParams(newParams);
  };

  const openReview = () => {
    setReviewSheetOpen(true);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('review', '1');
    setSearchParams(newParams);
  };

  // Queries
  const { data: analyticsData } = useAnalytics();
  const { data: tasksData } = useTasks({ limit: 60 });
  const { data: revisionsData } = useRevisions();
  const { data: timetableData } = useTimetableSlots(); // All slots across the week
  const { data: dailyPlanData } = useDailyPlan('today');

  const createTaskMutation = useCreateTask();
  const updateTaskStatus = useUpdateTaskStatus();

  // Time-based Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.name ? user.name.split(' ')[0] : 'Scholar';
    if (hour >= 5 && hour < 12) return `Good morning, ${name}`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [user]);

  // Tasks
  const allTasks = useMemo(() => {
    return tasksData?.data?.tasks || tasksData?.tasks || [];
  }, [tasksData]);

  const openTasks = useMemo(() => allTasks.filter((t) => t.status !== 'Completed'), [allTasks]);
  const completedTasks = useMemo(() => allTasks.filter((t) => t.status === 'Completed'), [allTasks]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return openTasks.filter((t) => t.dueDate && isBefore(startOfDay(new Date(t.dueDate)), today));
  }, [openTasks]);

  // All Timetable slots
  const allSlots = useMemo(() => {
    return timetableData?.data?.slots || timetableData?.slots || [];
  }, [timetableData]);

  // Calendar Week Days calculation
  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Items for the currently selected date
  const selectedDayOfWeek = selectedDate.getDay();
  const isSelectedDateToday = isToday(selectedDate);

  const displaySlots = useMemo(() => {
    return allSlots.filter((s) => s.dayOfWeek === selectedDayOfWeek);
  }, [allSlots, selectedDayOfWeek]);

  const displayTasks = useMemo(() => {
    if (isSelectedDateToday) {
      // For today: show all open tasks (due today, overdue, or untargeted)
      return openTasks;
    }
    // For other days: show tasks scheduled specifically for that date
    return allTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate));
  }, [allTasks, openTasks, isSelectedDateToday, selectedDate]);

  const displayCompletedTasks = useMemo(() => {
    if (isSelectedDateToday) {
      return completedTasks;
    }
    return completedTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate));
  }, [completedTasks, isSelectedDateToday, selectedDate]);

  // "Up next" calculation
  const nextUp = useMemo(() => {
    if (openTasks.length > 0) {
      const t = openTasks[0];
      return {
        title: t.title,
        sub: t.subject || (t.category ? `${t.category} task` : 'General task'),
        actionUrl: `/study?task=${t._id}${t.subject ? `&subject=${encodeURIComponent(t.subject)}` : ''}`,
      };
    }
    if (displaySlots.length > 0) {
      const s = displaySlots[0];
      return {
        title: s.subject || s.title || 'Study Session',
        sub: s.topic ? `${s.topic} · Scheduled` : 'Timetable slot',
        actionUrl: `/study?subject=${encodeURIComponent(s.subject || '')}`,
      };
    }
    return {
      title: 'Focus session',
      sub: 'Open timer · 25 min default',
      actionUrl: '/study',
    };
  }, [openTasks, displaySlots]);

  // Study Time Progress
  const todayMinutes =
    analyticsData?.data?.today?.studyMinutes ||
    analyticsData?.today?.studyMinutes ||
    analyticsData?.data?.today?.focusMinutes ||
    analyticsData?.today?.focusMinutes ||
    0;
  const goalMinutes = user?.dailyStudyGoal || 240; // Default 4 hours
  const progressPct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

  // Format today's time
  const formattedToday = useMemo(() => {
    if (todayMinutes < 60) return `${todayMinutes}m`;
    const h = Math.floor(todayMinutes / 60);
    const m = todayMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }, [todayMinutes]);

  const formattedGoal = useMemo(() => {
    const h = Math.round(goalMinutes / 60);
    return `${h}h`;
  }, [goalMinutes]);

  // Revisions Due
  const revisionsList = revisionsData?.data?.revisions || revisionsData?.revisions || [];
  const dueRevisions = revisionsList.filter((r) => r.status === 'pending' || !r.completed);

  // Target Exam Countdown
  const examInfo = useMemo(() => {
    if (!user?.examDate) return null;
    const examDate = new Date(user.examDate);
    const today = startOfDay(new Date());
    const target = startOfDay(examDate);
    const daysLeft = differenceInDays(target, today);
    return {
      name: user.examName || 'Target Exam',
      date: examDate,
      daysLeft,
    };
  }, [user?.examDate, user?.examName]);

  // Morning Intention
  const todayPlan = dailyPlanData?.plan || dailyPlanData?.data?.plan || dailyPlanData;
  const morningIntention = todayPlan?.intentions;

  // Inline Task Creation
  const handleInlineAdd = async (e) => {
    if (e.key === 'Enter' && inlineTaskInput.trim()) {
      e.preventDefault();
      try {
        await createTaskMutation.mutateAsync({
          title: inlineTaskInput.trim(),
          priority: 'Medium',
          status: 'Todo',
          dueDate: selectedDate,
        });
        setInlineTaskInput('');
        setShowInlineAdd(false);
        toast.success('Task added');
      } catch {
        toast.error('Failed to create task');
      }
    } else if (e.key === 'Escape') {
      setShowInlineAdd(false);
      setInlineTaskInput('');
    }
  };

  const handleToggleTask = (task) => {
    const isDone = task.status === 'Completed';
    updateTaskStatus.mutate({
      id: task._id,
      status: isDone ? 'Todo' : 'Completed',
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header: Greeting + Quiet Morning plan / Evening review buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--text)] m-0">
            {greeting}
          </h1>
          <p className="text-[13px] text-[var(--muted)] m-0 mt-0.5">
            {format(new Date(), 'EEEE, d MMMM')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openJournal('morning')}
            className="btn h-9 px-3.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] text-xs font-medium transition-colors"
          >
            Morning plan
          </button>
          <button
            type="button"
            onClick={() => openJournal('evening')}
            className="btn h-9 px-3.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] text-xs font-medium transition-colors"
          >
            Evening review
          </button>
        </div>
      </div>

      {/* 2. Key Reminders & Details User Needs to Remember */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Left Card: Target Exam Countdown */}
        <div className="card bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-heading">
              <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Target Exam</span>
            </div>
            {examInfo ? (
              <div className="mt-1">
                <p className="text-sm font-bold text-[var(--text)] font-heading truncate m-0">
                  {examInfo.name}
                </p>
                <p className="text-xs text-[var(--muted)] m-0 mt-0.5">
                  {examInfo.daysLeft > 0
                    ? `${plural(examInfo.daysLeft, 'day')} left · ${format(examInfo.date, 'MMM d, yyyy')}`
                    : examInfo.daysLeft === 0
                    ? `Today is exam day!`
                    : `Completed on ${format(examInfo.date, 'MMM d, yyyy')}`}
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <p className="text-xs text-[var(--muted)] m-0">No exam date configured</p>
                <Link
                  to="/settings"
                  className="text-xs font-medium text-[var(--primary)] hover:underline inline-block mt-0.5"
                >
                  Set target exam date &rarr;
                </Link>
              </div>
            )}
          </div>

          {examInfo && examInfo.daysLeft >= 0 && (
            <div className="shrink-0 text-right">
              <span className="text-xl font-extrabold font-mono text-[var(--primary)] block">
                {examInfo.daysLeft}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">
                days
              </span>
            </div>
          )}
        </div>

        {/* Right Card: Daily Focus, Reminders & Streak */}
        <div className="card bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-heading">
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Today&apos;s Focus & Alerts</span>
            </div>
            {todayMinutes >= 25 ? (
              <span className="text-[11px] font-medium text-[var(--primary)] flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                Streak safe
              </span>
            ) : (
              <span className="text-[11px] font-medium text-[var(--muted)]">
                {25 - todayMinutes}m to streak
              </span>
            )}
          </div>

          {/* Intention or Overdue / Due alert */}
          <div className="text-xs text-[var(--text)] space-y-1">
            {overdueTasks.length > 0 && (
              <p className="text-[var(--danger)] font-medium flex items-center gap-1.5 m-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{plural(overdueTasks.length, 'task')} overdue &middot; action needed</span>
              </p>
            )}

            {morningIntention ? (
              <p className="text-[var(--muted)] italic m-0 line-clamp-1">
                &ldquo;{morningIntention}&rdquo;
              </p>
            ) : (
              <p className="text-[var(--muted)] m-0">
                No morning intention set &middot;{' '}
                <button
                  type="button"
                  onClick={() => openJournal('morning')}
                  className="text-[var(--primary)] hover:underline font-medium cursor-pointer"
                >
                  Set intention
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Interactive Week Calendar Strip */}
      <div className="card bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-bold text-[var(--text)] font-heading uppercase tracking-wider">
              {format(weekStart, 'MMMM yyyy')}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="w-7 h-7 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Previous week"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setWeekOffset(0);
                  setSelectedDate(new Date());
                }}
                className="px-2 py-1 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-2)] text-[11px] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="w-7 h-7 rounded-lg border border-[var(--line)] hover:bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Next week"
              aria-label="Next week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <Link
              to="/plan?tab=week"
              className="text-[11px] text-[var(--muted)] hover:text-[var(--primary)] ml-2 transition-colors font-medium"
            >
              Full week &rarr;
            </Link>
          </div>
        </div>

        {/* 7-day strip */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => {
            const isCurrentDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            const dayDayOfWeek = day.getDay();
            const daySlots = allSlots.filter((s) => s.dayOfWeek === dayDayOfWeek);
            const dayTasks = allTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
            const hasActivity = daySlots.length > 0 || dayTasks.length > 0;

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer border',
                  isSelected
                    ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-2xs'
                    : isCurrentDay
                    ? 'bg-[var(--surface-2)] border-[var(--line)] text-[var(--text)] font-semibold'
                    : 'bg-transparent border-transparent hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                )}
              >
                <span className="text-[10px] uppercase tracking-wider font-heading block">
                  {format(day, 'EEE')}
                </span>
                <span className="text-sm font-mono mt-0.5 block">
                  {format(day, 'd')}
                </span>
                <span className="h-1.5 flex items-center justify-center mt-1">
                  {hasActivity && (
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]/60'
                      )}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. UP NEXT Card with ONE primary button */}
      <div className="card bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] font-heading block">
            UP NEXT
          </span>
          <h2 className="text-[22px] font-bold font-heading tracking-tight text-[var(--text)] mt-1 mb-0.5 truncate">
            {nextUp.title}
          </h2>
          <p className="text-[13px] text-[var(--muted)] m-0 truncate">
            {nextUp.sub}
          </p>
        </div>

        {/* The single primary button on this screen */}
        <button
          type="button"
          onClick={() => navigate(nextUp.actionUrl)}
          className="btn btn-primary h-11 px-5 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start focus</span>
        </button>
      </div>

      {/* 5. Thin Progress Line */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[13px] text-[var(--muted)]">
          <span>Today {formattedToday} of {formattedGoal}</span>
          <span className="font-mono text-xs">{progressPct}%</span>
        </div>
        <div className="w-full h-1 bg-[var(--line)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 6. Tasks & Timetable Merged Section for Selected Day */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--text)] font-heading m-0">
              {isSelectedDateToday ? 'Today' : format(selectedDate, 'EEEE, d MMMM')}
            </h2>
            {!isSelectedDateToday && (
              <button
                type="button"
                onClick={() => {
                  setWeekOffset(0);
                  setSelectedDate(new Date());
                }}
                className="text-xs text-[var(--primary)] hover:underline font-medium cursor-pointer"
              >
                (Back to Today)
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowInlineAdd(true)}
            className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-[var(--surface-2)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add task</span>
          </button>
        </div>

        {/* Inline Add Input */}
        {showInlineAdd && (
          <div className="mb-3">
            <input
              type="text"
              autoFocus
              value={inlineTaskInput}
              onChange={(e) => setInlineTaskInput(e.target.value)}
              onKeyDown={handleInlineAdd}
              onBlur={() => {
                if (!inlineTaskInput.trim()) setShowInlineAdd(false);
              }}
              placeholder={`Add task for ${isSelectedDateToday ? 'today' : format(selectedDate, 'MMM d')} (Enter to save, Esc to cancel)...`}
              className="w-full h-10 px-3.5 rounded-xl border border-[var(--primary)] bg-[var(--surface)] text-[var(--text)] text-sm outline-none shadow-sm font-normal"
            />
          </div>
        )}

        {/* Merged Items List */}
        <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
          {/* Open Tasks */}
          {displayTasks.map((t) => (
            <div key={t._id} className="flex items-center gap-3 py-3 group">
              <button
                type="button"
                onClick={() => handleToggleTask(t)}
                className="w-5 h-5 rounded-md border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)] text-transparent flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                aria-label={`Mark done: ${t.title}`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <span className="flex-1 text-sm text-[var(--text)] truncate">
                {t.title}
              </span>

              {t.subject && (
                <span className="text-[12px] text-[var(--muted)] shrink-0 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                  {t.subject}
                </span>
              )}
            </div>
          ))}

          {/* Timetable Slots for Selected Day */}
          {displaySlots.map((s, idx) => (
            <div key={s._id || idx} className="flex items-center gap-3 py-3 text-[var(--muted)] group">
              <div className="w-5 h-5 rounded-md border border-dashed border-[var(--line)] flex items-center justify-center shrink-0 text-[10px] font-mono">
                📅
              </div>

              <span className="flex-1 text-sm truncate">
                <span className="text-[var(--text)] font-medium">{s.subject || s.title}</span>
                {s.startTime && (
                  <span className="text-xs text-[var(--muted)] ml-2 font-mono">
                    {s.startTime} - {s.endTime}
                  </span>
                )}
              </span>

              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--muted)] font-medium">
                Scheduled
              </span>
            </div>
          ))}

          {/* Completed Tasks */}
          {displayCompletedTasks.map((t) => (
            <div key={t._id} className="flex items-center gap-3 py-3 opacity-60 group">
              <button
                type="button"
                onClick={() => handleToggleTask(t)}
                className="w-5 h-5 rounded-md border border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center shrink-0 cursor-pointer"
                aria-label={`Mark incomplete: ${t.title}`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <span className="flex-1 text-sm text-[var(--muted)] line-through truncate">
                {t.title}
              </span>

              {t.subject && (
                <span className="text-[12px] text-[var(--muted)] shrink-0">
                  {t.subject}
                </span>
              )}
            </div>
          ))}

          {/* Honest Empty State if completely empty */}
          {displayTasks.length === 0 && displaySlots.length === 0 && displayCompletedTasks.length === 0 && !showInlineAdd && (
            <div className="py-8 text-center text-xs text-[var(--muted)]">
              {isSelectedDateToday
                ? 'No tasks planned for today. Click "Add task" above or start a focus session.'
                : `No tasks or scheduled blocks for ${format(selectedDate, 'EEEE, d MMMM')}.`}
            </div>
          )}
        </div>

        {/* 7. Quiet Review Line — ONLY when reviews are due */}
        {dueRevisions.length > 0 && (
          <p className="text-[13px] text-[var(--muted)] mt-5">
            {plural(dueRevisions.length, 'review')} due &middot;{' '}
            <button
              type="button"
              onClick={openReview}
              className="text-[var(--primary)] hover:underline font-medium cursor-pointer"
            >
              Start review
            </button>
          </p>
        )}
      </div>

      {/* Side Sheets */}
      {/* 1. Morning Plan Side Sheet */}
      <SideSheet
        open={journalSheet === 'morning'}
        onClose={closeJournalSheet}
        title="Morning Plan"
      >
        <MorningCheckIn onComplete={closeJournalSheet} />
      </SideSheet>

      {/* 2. Evening Review Side Sheet */}
      <SideSheet
        open={journalSheet === 'evening'}
        onClose={closeJournalSheet}
        title="Evening Review"
      >
        <EveningReview onComplete={closeJournalSheet} />
      </SideSheet>

      {/* 3. Revision Queue Side Sheet */}
      <SideSheet
        open={reviewSheetOpen}
        onClose={closeReviewSheet}
        title="Revision Queue"
      >
        <RevisionsPage isSideSheet onComplete={closeReviewSheet} />
      </SideSheet>
    </div>
  );
}
