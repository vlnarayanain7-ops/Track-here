import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Play, Plus, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTasks, useCreateTask, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useRevisions } from '@/hooks/useRevisions';
import { useTimetableSlots } from '@/hooks/useTimetable';
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
  const { data: tasksData } = useTasks({ limit: 40 });
  const { data: revisionsData } = useRevisions();

  // Timetable slots for today (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const todayDayOfWeek = new Date().getDay();
  const { data: timetableData } = useTimetableSlots({ dayOfWeek: todayDayOfWeek });

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

  // Tasks & Merged Today items
  const allTasks = useMemo(() => {
    return tasksData?.data?.tasks || tasksData?.tasks || [];
  }, [tasksData]);

  const openTasks = useMemo(() => allTasks.filter((t) => t.status !== 'Completed'), [allTasks]);
  const completedTasks = useMemo(() => allTasks.filter((t) => t.status === 'Completed'), [allTasks]);

  // Timetable slots for today
  const todaySlots = useMemo(() => {
    return timetableData?.data?.slots || timetableData?.slots || [];
  }, [timetableData]);

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
    if (todaySlots.length > 0) {
      const s = todaySlots[0];
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
  }, [openTasks, todaySlots]);

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

  // Inline Task Creation
  const handleInlineAdd = async (e) => {
    if (e.key === 'Enter' && inlineTaskInput.trim()) {
      e.preventDefault();
      try {
        await createTaskMutation.mutateAsync({
          title: inlineTaskInput.trim(),
          priority: 'Medium',
          status: 'Todo',
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

      {/* 2. UP NEXT Card with ONE primary button */}
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

      {/* 3. Thin Progress Line */}
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

      {/* 4. Today Section (Merged list of today's tasks & timetable slots) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-[var(--text)] font-heading m-0">
            Today
          </h2>
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
              placeholder="Add a task and press Enter (Esc to cancel)..."
              className="w-full h-10 px-3.5 rounded-xl border border-[var(--primary)] bg-[var(--surface)] text-[var(--text)] text-sm outline-none shadow-sm font-normal"
            />
          </div>
        )}

        {/* Merged Items List */}
        <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
          {/* Open Tasks */}
          {openTasks.map((t) => (
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

          {/* Today's Timetable Slots */}
          {todaySlots.map((s, idx) => (
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
          {completedTasks.map((t) => (
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
          {openTasks.length === 0 && todaySlots.length === 0 && completedTasks.length === 0 && !showInlineAdd && (
            <div className="py-8 text-center text-xs text-[var(--muted)]">
              No tasks planned for today. Click &quot;Add task&quot; above or start a focus session.
            </div>
          )}
        </div>

        {/* 5. Quiet Review Line — ONLY when reviews are due */}
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
