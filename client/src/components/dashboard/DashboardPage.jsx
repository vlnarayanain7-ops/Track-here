import SubjectLabel from '@/components/ui/SubjectLabel';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Play, Plus, Check, Sun, Moon, RotateCcw } from 'lucide-react';
import './dashboard.css';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTasks, useCreateTask, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useRevisions } from '@/hooks/useRevisions';
import { useDailyPlan, useCreateDailyPlan } from '@/hooks/useDailyPlans';
import { useDailyReview, useCreateDailyReview } from '@/hooks/useDailyReviews';
import { SideSheet } from '@/components/SideSheet';
import { MorningPlan } from '@/components/journal/MorningPlan';
import { EveningReview } from '@/components/journal/EveningReview';
import ReviewSheet from '@/components/revisions/ReviewSheet';
import ErrorLog from './ErrorLog';
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

  // Sync state with URL search params (supporting ?sheet=morning|evening|review and legacy ?journal=, ?review=1)
  useEffect(() => {
    const sheetParam = searchParams.get('sheet');
    const journalParam = searchParams.get('journal');
    const reviewParam = searchParams.get('review');

    if (sheetParam === 'morning' || journalParam === 'morning') {
      setJournalSheet('morning');
      setActiveJournalTab('morning');
      setReviewSheetOpen(false);
    } else if (sheetParam === 'evening' || journalParam === 'evening') {
      setJournalSheet('evening');
      setActiveJournalTab('evening');
      setReviewSheetOpen(false);
    } else if (sheetParam === 'review' || reviewParam === '1' || reviewParam === 'true') {
      setReviewSheetOpen(true);
      setJournalSheet(null);
    } else if (journalParam === 'journal') {
      setJournalSheet('journal');
      setReviewSheetOpen(false);
    } else {
      setJournalSheet(null);
      setReviewSheetOpen(false);
    }
  }, [searchParams]);

  const closeJournalSheet = () => {
    setJournalSheet(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('journal');
    newParams.delete('sheet');
    setSearchParams(newParams, { replace: true });
  };

  const closeReviewSheet = () => {
    setReviewSheetOpen(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('review');
    newParams.delete('sheet');
    setSearchParams(newParams, { replace: true });
  };

  const openJournal = (kind) => {
    setJournalSheet(kind);
    setActiveJournalTab(kind);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sheet', kind);
    setSearchParams(newParams);
  };

  const openReview = () => {
    setReviewSheetOpen(true);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sheet', 'review');
    setSearchParams(newParams);
  };

  // Queries
  const { data: analyticsData } = useAnalytics();
  const { data: tasksData } = useTasks({ limit: 60 });
  const { data: revisionsData } = useRevisions();
  const { data: dailyPlanData } = useDailyPlan('today');
  const { data: dailyReviewData } = useDailyReview('today');

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
  const revisionsList = Array.isArray(revisionsData) ? revisionsData : revisionsData?.data?.revisions || revisionsData?.revisions || [];
  const dueRevisions = revisionsList.filter(r => r.status !== 'completed' && (!r.dueDate || new Date(r.dueDate) <= new Date(new Date().setHours(23, 59, 59, 999))));

  // Goal & days left subtitle calculation
  const goal = user?.preparationType || user?.examName;
  const targetDateObj = user?.targetExamDate ? new Date(user.targetExamDate) : null;
  const daysLeft = targetDateObj && !isNaN(targetDateObj.getTime())
    ? Math.max(0, Math.ceil((targetDateObj - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const headerSubtitle = useMemo(() => {
    const dateStr = format(new Date(), 'EEEE, d MMMM');
    if (!goal || goal === 'Self Study' || goal === 'Custom') {
      return dateStr;
    }
    let goalPart = `Goal: ${goal}`;
    if (daysLeft !== null) {
      goalPart += ` · ${daysLeft === 0 ? 'Today' : `${daysLeft} days left`}`;
    }
    return `${dateStr} · ${goalPart}`;
  }, [goal, daysLeft]);

  // Check-ins status
  const rawPlan = dailyPlanData?.data || dailyPlanData;
  const todayPlan = rawPlan && rawPlan.plan !== undefined ? rawPlan.plan : rawPlan;
  const hasMorningPlan = Boolean(
    todayPlan && (
      todayPlan._id ||
      (Array.isArray(todayPlan.priorities) && todayPlan.priorities.length > 0) ||
      (Array.isArray(todayPlan.topPriorities) && todayPlan.topPriorities.length > 0) ||
      todayPlan.notes ||
      todayPlan.intentions
    )
  );

  const rawReview = dailyReviewData?.data || dailyReviewData;
  const todayReview = rawReview && rawReview.review !== undefined ? rawReview.review : rawReview;
  const hasEveningReview = Boolean(
    todayReview && (
      todayReview._id ||
      todayReview.reflection ||
      todayReview.mood ||
      todayReview.tomorrowFirst
    )
  );
  const timePeriod = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h >= 17) return 'evening';
    return 'review';
  }, []);

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
    <div className="today-dashboard">
      {/* 1. Page Header: Greeting + Goal / Days Left subtitle */}
      <div className="today-heading">
        <div>
          <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--tx)] m-0">
            {greeting}
          </h1>
          <p className="sub text-[13px] text-[var(--mu)] m-0 mt-0.5">
            {headerSubtitle}
          </p>
        </div>
      </div>

      {/* 2. UP NEXT Card */}
      <div className="today-overview">
      <section className="today-focus">
        <div className="today-focus-copy">
          <div className="today-eyebrow">Up next</div>
          <h2>{nextUp.title}</h2>
          <p>{nextUp.sub}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(nextUp.actionUrl)}
          className="today-start"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start focus</span>
        </button>
      </section>

      {/* 3. Focus progress bar */}
      <section className="today-goal" aria-label="Daily focus goal">
        <div className="today-card-label">Focus today <span>{progressPct}%</span></div>
        <div className="today-goal-value">{formattedToday}<span> / {formattedGoal}</span></div>
        <div className="today-meter" role="progressbar" aria-label="Daily focus goal" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progressPct}%` }} /></div>
        <Link to="/progress" className="today-progress-link">View activity</Link>
      </section>
      </div>

      <ErrorLog />

      {/* 4. Three Daily Check-ins */}
      <div className="today-section-title"><h2>Daily check-in</h2></div>
      <div className="today-checks" role="group" aria-label="Daily check-ins">
        <button
          type="button"
          data-tour="morning"
          onClick={() => openJournal('morning')}
          className={cn(
            'ck3',
            hasMorningPlan && 'done',
            timePeriod === 'morning' && 'now'
          )}
        >
          <span className="today-check-icon morning"><Sun size={21} /></span>
          <span>Morning plan</span>
          <small>{hasMorningPlan ? 'Done' : 'Set your plan'}</small>
        </button>
        <button
          type="button"
          data-tour="evening"
          onClick={() => openJournal('evening')}
          className={cn(
            'ck3',
            hasEveningReview && 'done',
            timePeriod === 'evening' && 'now'
          )}
        >
          <span className="today-check-icon evening"><Moon size={21} /></span>
          <span>Evening review</span>
          <small>{hasEveningReview ? 'Done' : 'Reflect on today'}</small>
        </button>
        <button
          type="button"
          data-tour="revisions" onClick={openReview}
          className={cn(
            'ck3',
            dueRevisions.length === 0 && 'done',
            timePeriod === 'review' && 'now'
          )}
        >
          <span className="today-check-icon review"><RotateCcw size={21} /></span>
          <span>Revision queue</span>
          <small>{dueRevisions.length > 0 ? `${dueRevisions.length} due` : 'All caught up'}</small>
        </button>
      </div>

      {/* 4. Today List with inline add */}
      <section className="today-tasks">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-[var(--text)] font-heading m-0">
            Tasks <span className="today-count">{openTasks.length} open</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowInlineAdd(true)}
            className="today-add-task"
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
              aria-label="New task title"
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
                  <SubjectLabel name={t.subject} color={user?.subjects?.find(s => s.name === t.subject)?.color} />
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
              No tasks yet. Add a task to get started.
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
      </section>

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
            initialPlan={todayPlan}
            onSave={async (data) => {
              await createDailyPlanMutation.mutateAsync(data);
              toast.success('Morning plan saved!');
            }}
            saving={createDailyPlanMutation.isPending}
            error={createDailyPlanMutation.error?.response?.data?.message}
            onDone={closeJournalSheet}
          />
        )}

        {(journalSheet === 'evening' || (journalSheet === 'journal' && activeJournalTab === 'evening')) && (
          <EveningReview
            focusMinutes={todayMinutes}
            tasksDone={completedTasks.length}
            initialReview={todayReview}
            onSave={async (data) => {
              await createDailyReviewMutation.mutateAsync(data);
              toast.success('Evening review saved!');
            }}
            onCreateTask={async (tData) => await createTaskMutation.mutateAsync(tData)}
            saving={createDailyReviewMutation.isPending}
            error={createDailyReviewMutation.error?.response?.data?.message}
            onDone={closeJournalSheet}
          />
        )}
      </SideSheet>

      {/* 2. Review (Revision Queue) Side Sheet */}
      <ReviewSheet
        isOpen={reviewSheetOpen}
        onClose={closeReviewSheet}
      />
    </div>
  );
}
