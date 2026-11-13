import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTimer } from '@/hooks/useTimer';
import { useStudySessions } from '@/hooks/useStudySessions';
import { ACTIVITY_TYPES } from '@/lib/constants';
import SideSheet from '@/components/ui/SideSheet';
import SessionList from './SessionList';
import StudyCalendar from './StudyCalendar';
import SessionForm from './SessionForm';
import { formatTimerDisplay } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function StudyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // User's own subjects (no fake or hardcoded ones)
  const userSubjects = useMemo(() => {
    if (!user?.subjects || !Array.isArray(user.subjects)) return [];
    return user.subjects.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);
  }, [user]);

  const initialSubject = searchParams.get('subject') || searchParams.get('category') || userSubjects[0] || '';
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);

  useEffect(() => {
    const sub = searchParams.get('subject') || searchParams.get('category');
    if (sub && sub !== selectedSubject) {
      setSelectedSubject(sub);
    } else if (!selectedSubject && userSubjects.length > 0) {
      setSelectedSubject(userSubjects[0]);
    }
  }, [searchParams, userSubjects]);

  // Timer controls & state
  const {
    elapsedTime,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    resetTimer,
  } = useTimer();

  // Details state
  const [showDetails, setShowDetails] = useState(false);
  const [topic, setTopic] = useState('');
  const [activityType, setActivityType] = useState('Problem Solving');
  const [notes, setNotes] = useState('');

  // History sheet state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState('list');
  const [historyCategory, setHistoryCategory] = useState('');
  const [historyActivity, setHistoryActivity] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null);

  // Screen Wake Lock & Tab Title Timer
  useEffect(() => {
    let wakeLockSentinel = null;

    if (isRunning && !isPaused) {
      document.title = `${formatTimerDisplay(elapsedTime)} · Focus`;

      if ('wakeLock' in navigator) {
        navigator.wakeLock
          .request('screen')
          .then((lock) => {
            wakeLockSentinel = lock;
          })
          .catch(() => {});
      }
    } else {
      document.title = 'Focus · Track Here';
    }

    return () => {
      document.title = 'Track Here';
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isRunning, isPaused, elapsedTime]);

  // Study sessions data
  const { data, refetch } = useStudySessions({
    page: historyPage,
    limit: 50,
    category: historyCategory || undefined,
    activityType: historyActivity || undefined,
    search: historySearch || undefined,
  });

  const sessions = useMemo(() => {
    return data?.data?.sessions || data?.sessions || [];
  }, [data]);

  const total = data?.data?.pagination?.total || data?.pagination?.total || sessions.length;

  // Filter today's sessions using local date
  const todaySessions = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return sessions.filter((s) => {
      const d = s.date ? new Date(s.date) : s.startTime ? new Date(s.startTime) : null;
      if (!d || isNaN(d.getTime())) return false;
      return (
        d.getFullYear() === todayYear &&
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate
      );
    });
  }, [sessions]);

  // Timer actions
  const handleStart = async () => {
    try {
      await startTimer({
        category: selectedSubject || 'Focus',
        activityType,
        topic: topic.trim() || selectedSubject || 'Focus session',
        subtopic: notes.trim() || undefined,
      });
      toast.success('Focus timer started');
    } catch (err) {
      toast.error(err.message || 'Failed to start timer');
    }
  };

  const handlePause = async () => {
    try {
      await pauseTimer();
    } catch (err) {
      toast.error('Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      await resumeTimer();
    } catch (err) {
      toast.error('Failed to resume');
    }
  };

  const handleReset = () => {
    resetTimer();
    toast('Timer reset', { icon: '🔄' });
  };

  const handleFinish = async () => {
    if (elapsedTime < 60) {
      if (window.confirm('Session is under 1 minute. Do you want to finish and save it anyway?')) {
        await saveAndFinish();
      }
      return;
    }
    await saveAndFinish();
  };

  const saveAndFinish = async () => {
    try {
      await finishTimer({
        keyLearnings: notes.trim() || undefined,
      });
      toast.success('Focus session saved!');
      setTopic('');
      setNotes('');
      setShowDetails(false);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to finish session');
    }
  };

  // Ring calculation: 25 minutes = 1500 seconds, radius 108 -> circumference 679
  const targetSeconds = 25 * 60;
  const progress = Math.min(elapsedTime / targetSeconds, 1);
  const strokeDashoffset = Math.round(679 * (1 - progress));

  const formatDisplayTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-[880px] mx-auto px-4 sm:px-8 py-6">
      {/* Centered Focus Hero */}
      <div className="center">
        {/* Subject Chips */}
        <div className="chips">
          {userSubjects.length === 0 ? (
            <button
              type="button"
              onClick={() => navigate('/plan?tab=subjects')}
              className="chip"
            >
              + Add a subject
            </button>
          ) : (
            userSubjects.map((sub) => {
              const isSelected = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`chip ${isSelected ? 'on' : ''}`}
                >
                  {sub}
                </button>
              );
            })
          )}
        </div>

        {/* Ring Timer (240px, thin 6px stroke) */}
        <div className="timer-ring ring-0 shadow-none">
          <svg viewBox="0 0 240 240" aria-hidden="true">
            {/* Background track: neutral dim line */}
            <circle
              cx="120"
              cy="120"
              r="108"
              fill="none"
              stroke="var(--ln)"
              strokeWidth="6"
            />
            {/* Progress indicator: primary color */}
            <circle
              cx="120"
              cy="120"
              r="108"
              fill="none"
              stroke="var(--pr)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="679"
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 120 120)"
            />
          </svg>
          <div className="time">
            <b>{formatDisplayTime(elapsedTime)}</b>
            <span>of 25 min</span>
          </div>
        </div>

        {/* Action Buttons: 1 primary button, quiet secondaries */}
        <div className="acts">
          {!isRunning && !isPaused ? (
            <button
              type="button"
              onClick={handleStart}
              className="btn p lg"
            >
              Start
            </button>
          ) : isRunning ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="btn lg"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handlePause}
                className="btn p lg"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="btn lg"
              >
                Finish
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="btn lg"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleResume}
                className="btn p lg"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="btn lg"
              >
                Finish
              </button>
            </>
          )}
        </div>

        {/* Quiet line: 25 minutes keeps your streak · Add details */}
        <p className="note text-center">
          25 minutes keeps your streak ·{' '}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[var(--pr)] hover:underline font-medium bg-transparent border-0 p-0 cursor-pointer inline"
          >
            {showDetails ? 'Hide details' : 'Add details'}
          </button>
        </p>

        {/* Inline details (topic, activity type, notes) hidden until clicked */}
        {showDetails && (
          <div className="w-full max-w-[420px] p-4 rounded-xl border border-[var(--ln)] bg-[var(--sf)] space-y-3 animate-fade-in text-left">
            <div>
              <label className="block text-xs font-medium text-[var(--mu)] mb-1">
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Graph Algorithms or Chapter 4"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)] focus:outline-none focus:ring-2 focus:ring-[var(--pr)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--mu)] mb-1">
                Activity
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)] focus:outline-none focus:ring-2 focus:ring-[var(--pr)]"
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--mu)] mb-1">
                Notes / Key learnings
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you learn or practice?"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)] focus:outline-none focus:ring-2 focus:ring-[var(--pr)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Today's sessions section */}
      <div className="mt-8">
        <div className="sec">
          <h2 className="text-base font-semibold text-[var(--tx)]">Today's sessions</h2>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="btn g text-sm text-[var(--mu)] hover:text-[var(--tx)]"
          >
            History
          </button>
        </div>

        {todaySessions.length === 0 ? (
          <p className="note py-4 text-sm text-[var(--mu)]">
            No focus sessions logged today.
          </p>
        ) : (
          <div className="divide-y divide-[var(--ln)]">
            {todaySessions.map((s, idx) => (
              <div
                key={s._id || idx}
                className="row"
              >
                <span className="g">
                  {s.topic || 'Focus session'}
                  <span className="note"> · {s.category || s.subject}</span>
                </span>
                <b className="font-semibold text-sm">{s.duration}m</b>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Side Sheet */}
      <SideSheet
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Focus History"
      >
        <div className="space-y-4">
          {/* Top action row in sheet */}
          <div className="flex items-center justify-between gap-2 border-b border-[var(--ln)] pb-3">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setHistoryTab('list')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  historyTab === 'list'
                    ? 'bg-[var(--soft)] text-[var(--pr)]'
                    : 'text-[var(--mu)] hover:bg-[var(--sf2)]'
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('calendar')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  historyTab === 'calendar'
                    ? 'bg-[var(--soft)] text-[var(--pr)]'
                    : 'text-[var(--mu)] hover:bg-[var(--sf2)]'
                }`}
              >
                Calendar
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSessionToEdit(null);
                setIsFormOpen(true);
              }}
              className="btn text-xs"
            >
              + Log session
            </button>
          </div>

          {/* History content */}
          {historyTab === 'list' ? (
            <SessionList
              sessions={sessions}
              total={total}
              page={historyPage}
              onPageChange={setHistoryPage}
              category={historyCategory}
              onCategoryChange={setHistoryCategory}
              activityType={historyActivity}
              onActivityTypeChange={setHistoryActivity}
              search={historySearch}
              onSearchChange={setHistorySearch}
              onEdit={(s) => {
                setSessionToEdit(s);
                setIsFormOpen(true);
              }}
              onNewSession={() => {
                setSessionToEdit(null);
                setIsFormOpen(true);
              }}
            />
          ) : (
            <StudyCalendar
              sessions={sessions}
              onSelectSession={(s) => {
                setSessionToEdit(s);
                setIsFormOpen(true);
              }}
            />
          )}
        </div>
      </SideSheet>

      {/* Modal Dialog for manual log / edit session */}
      <SessionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSessionToEdit(null);
          refetch();
        }}
        sessionToEdit={sessionToEdit}
      />
    </div>
  );
}
