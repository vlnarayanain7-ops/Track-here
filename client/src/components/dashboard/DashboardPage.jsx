import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import {
  Play,
  Sun,
  Moon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Check,
  Target,
  FileText,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  RotateCcw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useAnalytics,
  useStreakData,
  useWeeklySummary,
  useHeatmapData,
} from '@/hooks/useAnalytics';
import { useTasks, useCreateTask, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useRevisions } from '@/hooks/useRevisions';
import { useNotes } from '@/hooks/useNotes';
import { useTimetableSlots } from '@/hooks/useTimetable';
import FirstRunChecklist from '../FirstRunChecklist';
import { formatDuration, cn, formatRelativeDate } from '@/lib/utils';
import { toLocalDateString } from '@/lib/date';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newQuickTaskTitle, setNewQuickTaskTitle] = useState('');
  const [selectedTaskSubject, setSelectedTaskSubject] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Queries from Real Backend API
  const { data: analyticsData } = useAnalytics();
  const { data: streakData } = useStreakData();
  const { data: weeklySummaryData } = useWeeklySummary();
  const { data: heatmapData } = useHeatmapData({ year: currentMonth.getFullYear() });
  const { data: tasksData } = useTasks({ limit: 30 });
  const { data: revisionsData } = useRevisions();
  const { data: notesData } = useNotes({ limit: 4 });

  // Timetable slots for today (dayOfWeek: 0 = Sunday, 1 = Monday, ...)
  const todayDayOfWeek = new Date().getDay();
  const { data: timetableData } = useTimetableSlots({ dayOfWeek: todayDayOfWeek });

  const createTaskMutation = useCreateTask();
  const updateTaskStatus = useUpdateTaskStatus();

  // Clean user subjects (filter out test data like "ss")
  const rawSubjects = user?.subjects && Array.isArray(user.subjects) ? user.subjects : [];
  const subjects = useMemo(() => {
    return rawSubjects.filter(
      (s) => s.name && s.name.trim().toLowerCase() !== 'ss' && s.name.trim() !== 'General Study'
    );
  }, [rawSubjects]);

  // Tasks
  const allTasks = tasksData?.data?.tasks || tasksData?.tasks || [];
  const openTasks = allTasks.filter((t) => t.status !== 'Completed');
  const completedTasks = allTasks.filter((t) => t.status === 'Completed');
  const nextUndoneTask = openTasks[0] || null;

  // Study Time & Progress
  const todayMinutes = analyticsData?.today?.studyMinutes || analyticsData?.today?.focusMinutes || 0;
  const goalMinutes = user?.dailyStudyGoal || 240; // Default 4 hours
  const goalProgressPct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

  // Streak & Weekly Time
  const currentStreak = streakData?.currentStreak ?? (analyticsData?.streaks?.currentStreak ?? 0);
  const weekMinutes = weeklySummaryData?.data?.totalMinutes ?? (weeklySummaryData?.totalMinutes ?? (analyticsData?.week?.studyMinutes || todayMinutes || 0));
  const weekHours = (weekMinutes / 60).toFixed(1);

  // Revisions & Notes
  const revisionsList = revisionsData?.data?.revisions || revisionsData?.revisions || [];
  const dueRevisions = revisionsList.filter((r) => r.status === 'pending' || !r.completed);
  const recentNotes = notesData?.data?.notes || notesData?.notes || [];

  // Today Timetable Schedule Slots
  const todaySlots = useMemo(() => {
    const slots = timetableData?.data?.slots || timetableData?.slots || [];
    return [...slots].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [timetableData]);

  // Exam Countdown calculation
  const daysToExam = user?.targetExamDate || user?.examDate
    ? Math.ceil((new Date(user.targetExamDate || user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const examLabel = user?.preparationType || user?.examName || 'Target Exam';

  // Dynamic greeting (Strictly NO emoji per prompt)
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const userName = user?.name ? user.name.split(' ')[0] : 'Scholar';

  // First-run status
  const isFirstRun =
    subjects.length === 0 &&
    allTasks.length === 0 &&
    todayMinutes === 0 &&
    recentNotes.length === 0;

  const firstRunSteps = [
    { done: subjects.length > 0, label: 'Add your subjects', to: '/subjects' },
    { done: allTasks.length > 0, label: 'Create your first task', to: '/tasks' },
    { done: todayMinutes >= 25 || currentStreak > 0, label: 'Run a 25-minute focus session', to: '/study' },
    { done: recentNotes.length > 0, label: 'Write your first note', to: '/notes' },
  ];

  // Subject Tracks with real weekly minutes
  const weeklyCategories = weeklySummaryData?.data?.categoryBreakdown || weeklySummaryData?.categoryBreakdown || [];
  const subjectTracks = useMemo(() => {
    return subjects.map((sub) => {
      const match = weeklyCategories.find(
        (c) => (c.category || '').toLowerCase() === (sub.name || '').toLowerCase()
      );
      const mins = match ? match.totalMinutes : 0;
      const hours = (mins / 60).toFixed(1);
      const pct = weekMinutes > 0 ? Math.min(100, Math.round((mins / weekMinutes) * 100)) : 0;
      return {
        ...sub,
        mins,
        hours,
        pct,
      };
    });
  }, [subjects, weeklyCategories, weekMinutes]);

  // Week starts on setting (0 = Sunday, 1 = Monday)
  const weekStartsOn = user?.weekStartsOn ?? 1;

  // Mini Calendar calculation (honors weekStartsOn)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn });
    const endDate = endOfWeek(monthEnd, { weekStartsOn });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth, weekStartsOn]);

  // Set of dates with genuine sessions
  const activeStudyDates = useMemo(() => {
    const set = new Set();
    const arr = heatmapData?.data || heatmapData || [];
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if ((item.minutes > 0 || item.count > 0) && item.date) {
          set.add(item.date);
        }
      }
    }
    return set;
  }, [heatmapData]);

  // Weekly bar data
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekStartsOn]);

  const dailyBreakdown = weeklySummaryData?.data?.dailyBreakdown || weeklySummaryData?.dailyBreakdown || [];
  const dailyFocusMins = useMemo(() => {
    const map = {};
    for (const item of dailyBreakdown) {
      if (item.date) map[item.date] = item.totalMinutes || 0;
    }
    return weekDays.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      return map[key] || 0;
    });
  }, [weekDays, dailyBreakdown]);

  // Toggle task completion
  const handleToggleTask = (task) => {
    const nextStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
    updateTaskStatus.mutate({ id: task._id, status: nextStatus });
  };

  // Inline add task
  const handleQuickAddTask = async (e) => {
    e.preventDefault();
    if (!newQuickTaskTitle.trim()) return;
    setIsAddingTask(true);
    try {
      await createTaskMutation.mutateAsync({
        title: newQuickTaskTitle.trim(),
        category: selectedTaskSubject || (subjects[0]?.name || 'General'),
        priority: 'Medium',
        status: 'Todo',
        dueDate: toLocalDateString(new Date()),
      });
      setNewQuickTaskTitle('');
    } finally {
      setIsAddingTask(false);
    }
  };

  const showHabitTracker = user?.preferences?.showHabits || false;

  return (
    <div className="space-y-6 animate-fade-in max-w-[1340px] mx-auto select-none pb-12">
      {/* ─── 1. HEADER (Greeting without emoji, subtitle, Morning/Evening buttons) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-heading font-bold tracking-tight text-[var(--text)]">
            Good {greetingTime}, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 flex flex-wrap items-center gap-2">
            <span>Focus on your high-priority items and maintain your rhythm.</span>
            {daysToExam !== null ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                {examLabel} · {daysToExam > 0 ? `${daysToExam} days remaining` : 'Target date today!'}
              </span>
            ) : (
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--primary-soft)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--line)] text-xs font-semibold transition-colors"
              >
                <span>Set target goal or exam date</span>
              </Link>
            )}
          </p>
        </div>

        {/* Secondary Journal Buttons (Start Focus moved to Hero Card) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/accountability?tab=morning"
            className="btn h-[40px] px-3.5 text-xs font-semibold border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)]"
          >
            <Sun className="w-3.5 h-3.5 text-[var(--warn)]" />
            <span>Morning Plan</span>
          </Link>
          <Link
            to="/accountability?tab=evening"
            className="btn h-[40px] px-3.5 text-xs font-semibold border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)]"
          >
            <Moon className="w-3.5 h-3.5 text-[var(--c-violet)]" />
            <span>Evening Review</span>
          </Link>
        </div>
      </div>

      {/* ─── 2. HERO CARD "UP NEXT" (Single place for today focus number & primary action) ─── */}
      <div className="card p-5 sm:p-6 bg-[var(--surface)] border-[var(--line)] shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Next Undone Task Info */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider font-heading">
                Up next
              </span>
              {nextUndoneTask?.category && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20 truncate">
                  {nextUndoneTask.category}
                </span>
              )}
              {nextUndoneTask?.estimatedDuration ? (
                <span className="text-[11px] text-[var(--muted)] font-mono">
                  ~{nextUndoneTask.estimatedDuration}m
                </span>
              ) : null}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-[var(--text)] truncate">
                {nextUndoneTask ? nextUndoneTask.title : 'Plan your day or start an open session'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5 line-clamp-1">
                {nextUndoneTask?.description || 'Pick a topic and lock in a 25-minute focus block.'}
              </p>
            </div>

            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    nextUndoneTask
                      ? `/study?topic=${encodeURIComponent(nextUndoneTask.title)}&subject=${encodeURIComponent(nextUndoneTask.category || '')}&action=start`
                      : '/study?action=start'
                  )
                }
                className="btn btn-primary btn-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start focus</span>
              </button>
              {nextUndoneTask && (
                <button
                  type="button"
                  onClick={() => handleToggleTask(nextUndoneTask)}
                  className="btn h-[52px] px-3.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
                  title="Mark task done"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark done</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Today's Focus Progress (Shown ONLY here) */}
          <div className="lg:w-72 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between text-xs text-[var(--muted)] font-semibold mb-2">
              <span>Today’s Focus Progress</span>
              <span>{goalProgressPct}%</span>
            </div>

            {/* Big number: e.g. "1h 20m / 4h" */}
            <div className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)] tracking-tight">
              {formatDuration(todayMinutes)}{' '}
              <span className="text-sm sm:text-base font-normal text-[var(--muted)] font-sans">
                / {formatDuration(goalMinutes)}
              </span>
            </div>

            {/* Segmented Progress Bar (4 segments for standard 4h rhythm) */}
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {[0, 1, 2, 3].map((idx) => {
                const segThreshold = (idx + 1) * 0.25;
                const fillRatio = Math.max(0, Math.min(1, (goalProgressPct / 100 - idx * 0.25) / 0.25));
                return (
                  <div
                    key={idx}
                    className="h-2 rounded-full bg-[var(--line)] overflow-hidden"
                  >
                    <div
                      className="h-full bg-[var(--primary)] transition-all duration-300"
                      style={{ width: `${fillRatio * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <span className="text-[11px] text-[var(--muted)] mt-2 font-medium">
              {todayMinutes >= goalMinutes
                ? 'Daily goal achieved! Great work.'
                : `${formatDuration(Math.max(0, goalMinutes - todayMinutes))} remaining to reach daily target`}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. STAT STRIP (One card, 4 cells, not 4 separate cards) ─── */}
      {isFirstRun ? (
        <FirstRunChecklist steps={firstRunSteps} />
      ) : (
        <div className="card p-0 bg-[var(--surface)] border-[var(--line)] shadow-xs divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)] grid grid-cols-2 lg:grid-cols-4">
          {/* Cell 1: Streak */}
          <div
            onClick={() => navigate('/streaks')}
            className="p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:bg-[var(--surface-2)]/60 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-[var(--muted)] font-semibold">
              <span className="group-hover:text-[var(--primary)] transition-colors">Current Streak</span>
              <Flame className="w-4 h-4 text-[var(--warn)]" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)]">
                {currentStreak > 0 ? `${currentStreak} days` : '0 days'}
              </span>
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {currentStreak > 0 ? 'Consistent rhythm' : 'Study 25 min to start streak'}
            </span>
          </div>

          {/* Cell 2: This week */}
          <div
            onClick={() => navigate('/analytics')}
            className="p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:bg-[var(--surface-2)]/60 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-[var(--muted)] font-semibold">
              <span className="group-hover:text-[var(--primary)] transition-colors">This Week</span>
              <Clock className="w-4 h-4 text-[var(--c-blue)]" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)]">
                {weekMinutes > 0 ? `${weekHours} hrs` : 'No study yet'}
              </span>
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {weekMinutes > 0 ? `${formatDuration(weekMinutes)} total recorded` : 'Log your first session'}
            </span>
          </div>

          {/* Cell 3: Tasks today */}
          <div
            onClick={() => navigate('/tasks')}
            className="p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:bg-[var(--surface-2)]/60 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-[var(--muted)] font-semibold">
              <span className="group-hover:text-[var(--primary)] transition-colors">Tasks Today</span>
              <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)]">
                {allTasks.length > 0 ? `${completedTasks.length} / ${allTasks.length}` : 'No tasks yet'}
              </span>
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {openTasks.length > 0 ? `${openTasks.length} pending items` : 'All tasks completed'}
            </span>
          </div>

          {/* Cell 4: Revisions due */}
          <div
            onClick={() => navigate('/revisions')}
            className="p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:bg-[var(--surface-2)]/60 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-[var(--muted)] font-semibold">
              <span className="group-hover:text-[var(--primary)] transition-colors">Revisions Due</span>
              <RotateCcw className="w-4 h-4 text-[var(--c-violet)]" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)]">
                {dueRevisions.length > 0 ? `${dueRevisions.length} due` : 'All caught up'}
              </span>
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {dueRevisions.length > 0 ? 'Spaced review ready' : 'No overdue flashcards'}
            </span>
          </div>
        </div>
      )}

      {/* ─── 4. TWO COLUMNS (Wide Left: Today, Subject Tracks, Weekly; Narrow Right: Calendar, Notes) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT WIDE COLUMN (8 cols on lg) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Module A: Today (Merged Schedule + Tasks with inline add) */}
          <div className="card p-5 sm:p-6 bg-[var(--surface)] border-[var(--line)] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-heading font-bold text-base text-[var(--text)]">
                  Today’s Focus & Routine
                </h3>
              </div>
              <Link to="/tasks" className="text-xs text-[var(--primary)] hover:underline font-semibold">
                Manage Tasks →
              </Link>
            </div>

            {/* Inline Quick Add Task */}
            <form onSubmit={handleQuickAddTask} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add task for today..."
                value={newQuickTaskTitle}
                onChange={(e) => setNewQuickTaskTitle(e.target.value)}
                className="flex-1 h-[44px] px-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] text-xs focus:border-[var(--primary)]"
              />
              {subjects.length > 0 && (
                <select
                  value={selectedTaskSubject}
                  onChange={(e) => setSelectedTaskSubject(e.target.value)}
                  className="h-[44px] px-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] text-xs hidden sm:block"
                >
                  <option value="">Subject</option>
                  {subjects.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                disabled={isAddingTask || !newQuickTaskTitle.trim()}
                className="btn btn-primary h-[44px] px-4 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Merged Items List */}
            <div className="space-y-2">
              {/* 1. Timetable Routine Slots for Today */}
              {todaySlots.map((slot) => (
                <div
                  key={slot._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/40 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-[var(--primary)] shrink-0">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span className="font-semibold text-[var(--text)] truncate">
                      {slot.subject}
                    </span>
                    {slot.topic && (
                      <span className="text-[var(--muted)] truncate hidden sm:inline">
                        · {slot.topic}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[var(--primary)] shrink-0 px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--line)]">
                    Scheduled
                  </span>
                </div>
              ))}

              {/* 2. Tasks for Today */}
              {allTasks.slice(0, 6).map((task) => (
                <div
                  key={task._id}
                  onClick={() => handleToggleTask(task)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    task.status === 'Completed'
                      ? 'border-transparent bg-[var(--surface-2)]/60 text-[var(--muted)]'
                      : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)]/60 text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        task.status === 'Completed'
                          ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                          : 'border-[var(--line)] bg-[var(--surface)]'
                      }`}
                    >
                      {task.status === 'Completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`font-medium truncate ${
                        task.status === 'Completed' ? 'line-through text-[var(--muted)]' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.category && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)]">
                        {task.category}
                      </span>
                    )}
                    {task.priority === 'High' && (
                      <span className="w-2 h-2 rounded-full bg-[var(--danger)]" title="High Priority" />
                    )}
                  </div>
                </div>
              ))}

              {todaySlots.length === 0 && allTasks.length === 0 && (
                <p className="text-xs text-[var(--muted)] text-center py-6">
                  No routine slots or tasks for today. Add one above to get going.
                </p>
              )}
            </div>
          </div>

          {/* Module B: Subject Tracks (Progress per subject with weekly time + Study button) */}
          <div className="card p-5 sm:p-6 bg-[var(--surface)] border-[var(--line)] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-heading font-bold text-base text-[var(--text)]">
                  Subject Tracks
                </h3>
              </div>
              <Link to="/subjects" className="text-xs text-[var(--primary)] hover:underline font-semibold">
                Syllabus & Goals →
              </Link>
            </div>

            {subjectTracks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-[var(--muted)] mb-3">No subjects created yet.</p>
                <Link to="/subjects" className="btn btn-primary text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add your first subject</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {subjectTracks.map((sub) => (
                  <div key={sub.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: `var(--c-${sub.color || 'blue'})` }}
                        />
                        <span className="font-semibold text-[var(--text)]">{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--muted)] font-mono text-[11px]">
                          {sub.mins > 0 ? `${sub.hours}h this week` : '0h this week'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/study?subject=${encodeURIComponent(sub.name)}&action=start`)
                          }
                          className="btn h-[28px] px-2.5 text-[11px] font-semibold border-[var(--line)] bg-[var(--surface-2)] hover:bg-[var(--primary)] hover:text-white"
                        >
                          Study
                        </button>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(5, sub.pct)}%`,
                          backgroundColor: `var(--c-${sub.color || 'blue'})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Module C: Weekly Progress Chart (with daily target line) */}
          <div className="card p-5 sm:p-6 bg-[var(--surface)] border-[var(--line)] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-[var(--text)]">
                Weekly Rhythm
              </h3>
              <span className="text-xs text-[var(--muted)] font-mono">
                Target: {(goalMinutes / 60).toFixed(0)}h / day
              </span>
            </div>

            <div className="h-40 flex items-end justify-between gap-2 pt-6 relative border-b border-[var(--line)] pb-2">
              {/* Daily Target Line at goalMinutes */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-[var(--primary)]/60 z-10 pointer-events-none"
                style={{ bottom: `${Math.min(90, (goalMinutes / 360) * 100)}%` }}
              >
                <span className="absolute right-0 -top-4 text-[10px] font-mono text-[var(--primary)]">
                  Goal {(goalMinutes / 60).toFixed(0)}h
                </span>
              </div>

              {weekDays.map((d, i) => {
                const mins = dailyFocusMins[i];
                const heightPct = Math.min(100, Math.round((mins / 360) * 100)); // Max 6h scale
                const isCurrent = isToday(d);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] text-[var(--muted)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {mins > 0 ? `${(mins / 60).toFixed(1)}h` : '0m'}
                    </span>
                    <div className="w-full max-w-[28px] bg-[var(--surface-2)] rounded-t-md h-full flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isCurrent ? 'bg-[var(--primary)]' : 'bg-[var(--primary)]/60'
                        }`}
                        style={{ height: `${Math.max(mins > 0 ? 8 : 0, heightPct)}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium font-mono ${
                        isCurrent ? 'text-[var(--primary)] font-bold' : 'text-[var(--muted)]'
                      }`}
                    >
                      {format(d, 'EEE')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── RIGHT NARROW COLUMN (4 cols on lg) ─── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mini Month Calendar (Honors weekStartsOn) */}
          <div className="card p-5 bg-[var(--surface)] border-[var(--line)] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-bold text-sm text-[var(--text)]">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)] min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date())}
                  className="text-[11px] text-[var(--primary)] px-2 font-semibold hover:underline"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1 rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)] min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <span key={i} className="text-[10px] font-mono text-[var(--muted)] font-semibold py-1">
                  {day}
                </span>
              ))}

              {calendarDays.map((d) => {
                const isCurMonth = isSameMonth(d, currentMonth);
                const isCurrent = isToday(d);
                const dateKey = format(d, 'yyyy-MM-dd');
                const hasSession = activeStudyDates.has(dateKey);

                return (
                  <div
                    key={d.toISOString()}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative ${
                      isCurrent
                        ? 'bg-[var(--primary)] text-white font-bold'
                        : isCurMonth
                        ? 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                        : 'text-[var(--muted)]/40'
                    }`}
                  >
                    <span>{format(d, 'd')}</span>
                    {hasSession && (
                      <span
                        className={`w-1 h-1 rounded-full absolute bottom-1 ${
                          isCurrent ? 'bg-white' : 'bg-[var(--primary)]'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Notes */}
          <div className="card p-5 bg-[var(--surface)] border-[var(--line)] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--c-blue)]" />
                <span>Recent Notes</span>
              </h3>
              <Link to="/notes" className="text-xs text-[var(--primary)] hover:underline font-semibold">
                All Notes →
              </Link>
            </div>

            <div className="space-y-2">
              {recentNotes.length === 0 ? (
                <p className="text-xs text-[var(--muted)] py-4 text-center">
                  No notes saved yet. Create a quick note in the Notes workspace.
                </p>
              ) : (
                recentNotes.slice(0, 4).map((n) => (
                  <Link
                    key={n._id}
                    to={`/notes?id=${n._id}`}
                    className="block p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] hover:border-[var(--primary)]/40 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[var(--text)] truncate">{n.title}</span>
                      <span className="text-[10px] text-[var(--muted)] font-mono shrink-0">
                        {formatRelativeDate(n.updatedAt || n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] line-clamp-1">
                      {n.contentMarkdown || 'Empty note'}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Habit Tracker (OPTIONAL: Only rendered if enabled in user preferences) */}
          {showHabitTracker && (
            <div className="card p-5 bg-[var(--surface)] border-[var(--line)] shadow-xs">
              <h3 className="font-heading font-bold text-sm text-[var(--text)] mb-2">
                Habit Consistency
              </h3>
              <p className="text-xs text-[var(--muted)] mb-3">
                Derived from verified sessions and tasks.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)]">
                  <span>Daily 25m Focus Block</span>
                  <span className={todayMinutes >= 25 ? 'text-[var(--primary)] font-bold' : 'text-[var(--muted)]'}>
                    {todayMinutes >= 25 ? '✓ Done' : `${todayMinutes}/25m`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface-2)]">
                  <span>Complete High-Priority Task</span>
                  <span className={completedTasks.length > 0 ? 'text-[var(--primary)] font-bold' : 'text-[var(--muted)]'}>
                    {completedTasks.length > 0 ? '✓ Done' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
