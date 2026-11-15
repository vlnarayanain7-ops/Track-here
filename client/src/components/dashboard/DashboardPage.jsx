import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Play, Plus, Check, Sun, Moon, RotateCcw, Target, Layers } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTasks, useCreateTask, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useRevisions } from '@/hooks/useRevisions';
import { useDailyPlan, useCreateDailyPlan } from '@/hooks/useDailyPlans';
import { useCreateDailyReview } from '@/hooks/useDailyReviews';
import { SideSheet } from '@/components/SideSheet';
import { MorningPlan } from '@/components/journal/MorningPlan';
import { EveningReview } from '@/components/journal/EveningReview';
import RevisionsPage from '@/components/revisions/RevisionsPage';
import { journalPrompt } from '@/lib/journalPrompt';
import { plural } from '@/lib/plural';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Side sheet states, reading from query params (?journal=morning|evening|journal, ?review=1)
  const [journalSheet, setJournalSheet] = useState(null); // 'morning' | 'evening' | 'journal' | null
  const [activeJournalTab, setActiveJournalTab] = useState('morning');
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [inlineTaskInput, setInlineTaskInput] = useState('');
  const [showInlineAdd, setShowInlineAdd] = useState(false);

  // Sync state with URL search params
  useEffect(() => {
    const journalParam = searchParams.get('journal');
    if (journalParam === 'morning' || journalParam === 'evening' || journalParam === 'journal') {
      setJournalSheet(journalParam);
      if (journalParam === 'morning' || journalParam === 'evening') {
        setActiveJournalTab(journalParam);
      }
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
  const { data: dailyPlanData } = useDailyPlan('today');

  const createTaskMutation = useCreateTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const createDailyPlanMutation = useCreateDailyPlan();
  const createDailyReviewMutation = useCreateDailyReview();

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
    return {
      title: 'Focus session',
      sub: 'Open timer · 25 min default',
      actionUrl: '/study',
    };
  }, [openTasks]);

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

  // Journal button prompt (only the button that fits the time of day)
  const todayPlan = dailyPlanData?.plan || dailyPlanData?.data?.plan || dailyPlanData;
  const promptKind = useMemo(() => {
    return journalPrompt({
      now: new Date(),
      hasPlan: Boolean(todayPlan && (todayPlan.intentions || todayPlan.topPriorities?.length)),
      hasReview: Boolean(analyticsData?.data?.todayReviewDone || analyticsData?.todayReviewDone),
    });
  }, [todayPlan, analyticsData]);

  // Inline Task Creation
  const handleInlineAdd = async (e) => {
    if (e.key === 'Enter' && inlineTaskInput.trim()) {
      e.preventDefault();
      try {
        await createTaskMutation.mutateAsync({
          title: inlineTaskInput.trim(),
          priority: 'Medium',
          status: 'Todo',
          dueDate: new Date(),
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
      {/* 1. Page Header: Greeting + Morning/Evening Review access */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--text)] m-0">
            {greeting}
          </h1>
          <p className="text-[13px] text-[var(--muted)] m-0 mt-0.5">
            {format(new Date(), 'EEEE, d MMMM')}
          </p>
        </div>

        {/* Quick Review & Journal shortcuts visible on main dashboard */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/?journal=morning"
            className="btn btn-ghost h-9 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Set today's priorities & focus"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Morning plan</span>
          </Link>
          <Link
            to="/?journal=evening"
            className="btn btn-ghost h-9 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Reflect on today's focus and score your progress"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evening review</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              if (promptKind === 'morning') {
                setActiveJournalTab('morning');
                openJournal('morning');
              } else if (promptKind === 'evening') {
                setActiveJournalTab('evening');
                openJournal('evening');
              } else {
                setActiveJournalTab('morning');
                openJournal('journal');
              }
            }}
            className="btn btn-ghost"
          >
            {promptKind === 'morning' ? 'Morning plan' : promptKind === 'evening' ? 'Evening review' : 'Journal'}
          </button>
        </div>
      </div>

      {/* Target Goal & Aligned Subjects (visible upon login so user immediately aligns studies) */}
      <div className="card bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-heading">
              Daily Target Goal
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--muted)]">
            {user?.examName ? user.examName : 'Daily Focus'} &middot; {formattedToday} of {formattedGoal} ({progressPct}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Aligned Subjects */}
        <div className="pt-2 border-t border-[var(--line)]/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Your Subjects
            </span>
            <Link
              to="/plan?tab=subjects"
              className="text-[11px] font-medium text-[var(--primary)] hover:underline"
            >
              Manage subjects &rarr;
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {user?.subjects && user.subjects.length > 0 ? (
              user.subjects.map((s) => {
                const col = s.color || 'var(--primary)';
                const colorVar = col.startsWith('--') ? `var(${col})` : col;
                return (
                  <Link
                    key={s.name}
                    to={`/study?subject=${encodeURIComponent(s.name)}`}
                    className="h-8 px-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--primary)]/50 text-xs font-medium text-[var(--text)] flex items-center gap-2 transition-colors cursor-pointer"
                    title={`Start focus session for ${s.name}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: colorVar }}
                    />
                    <span>{s.name}</span>
                    {s.chapters?.length > 0 && (
                      <span className="text-[10px] text-[var(--muted)]">
                        {s.chapters.length} ch
                      </span>
                    )}
                  </Link>
                );
              })
            ) : (
              <Link
                to="/plan?tab=subjects"
                className="text-xs text-[var(--muted)] hover:text-[var(--primary)] py-1"
              >
                + Add your subjects to align your daily plan
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. "UP NEXT" Card with ONE primary button */}
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

      {/* 3. One Thin Progress Line */}
      <div className="flex items-center gap-3 text-[13px] text-[var(--muted)] my-6">
        <span>Today {formattedToday} of {formattedGoal}</span>
        <div className="flex-1 h-1 rounded-full bg-[var(--line)] overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 4. Today List with inline add */}
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

        {/* Tasks List */}
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
          {openTasks.length === 0 && completedTasks.length === 0 && !showInlineAdd && (
            <div className="py-8 text-center text-xs text-[var(--muted)]">
              No tasks planned for today. Click &quot;Add task&quot; above or start a focus session.
            </div>
          )}
        </div>

        {/* 5. Revision Queue Line — Always visible and peaceful */}
        {dueRevisions.length > 0 ? (
          <p className="text-[13px] text-[var(--muted)] mt-5 flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{plural(dueRevisions.length, 'review')} due</span>
            <span>&middot;</span>
            <button
              type="button"
              onClick={openReview}
              className="text-[var(--primary)] hover:underline font-medium cursor-pointer"
            >
              Start review
            </button>
          </p>
        ) : (
          <p className="text-[12px] text-[var(--muted)] mt-5 flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Revision queue: all caught up</span>
            <span>&middot;</span>
            <button
              type="button"
              onClick={openReview}
              className="text-[var(--muted)] hover:text-[var(--text)] hover:underline font-medium cursor-pointer"
            >
              View queue
            </button>
          </p>
        )}
      </div>

      {/* Side Sheets */}
      {/* 1. Morning Plan / Evening Review Side Sheet */}
      <SideSheet
        open={Boolean(journalSheet)}
        onClose={closeJournalSheet}
        title={
          journalSheet === 'morning'
            ? 'Morning plan'
            : journalSheet === 'evening'
            ? 'Evening review'
            : activeJournalTab === 'morning'
            ? 'Morning plan'
            : 'Evening review'
        }
      >
        {journalSheet === 'journal' && (
          <div className="seg" role="group" aria-label="Journal mode">
            <button
              type="button"
              aria-pressed={activeJournalTab === 'morning'}
              onClick={() => setActiveJournalTab('morning')}
            >
              Morning
            </button>
            <button
              type="button"
              aria-pressed={activeJournalTab === 'evening'}
              onClick={() => setActiveJournalTab('evening')}
            >
              Evening
            </button>
          </div>
        )}

        {(journalSheet === 'morning' || (journalSheet === 'journal' && activeJournalTab === 'morning')) && (
          <MorningPlan
            defaultHours={Math.round((user?.dailyStudyGoal || 240) / 60)}
            openTasks={openTasks}
            onSave={async (data) => await createDailyPlanMutation.mutateAsync(data)}
            saving={createDailyPlanMutation.isPending}
            error={createDailyPlanMutation.error?.response?.data?.message}
            onDone={closeJournalSheet}
          />
        )}

        {(journalSheet === 'evening' || (journalSheet === 'journal' && activeJournalTab === 'evening')) && (
          <EveningReview
            focusMinutes={todayMinutes}
            tasksDone={completedTasks.length}
            onSave={async (data) => await createDailyReviewMutation.mutateAsync(data)}
            onCreateTask={async (tData) => await createTaskMutation.mutateAsync(tData)}
            saving={createDailyReviewMutation.isPending}
            error={createDailyReviewMutation.error?.response?.data?.message}
            onDone={closeJournalSheet}
          />
        )}
      </SideSheet>

      {/* 2. Revision Queue Side Sheet */}
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
