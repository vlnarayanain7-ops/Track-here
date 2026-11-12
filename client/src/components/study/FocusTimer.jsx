import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Dialog from '@/components/ui/Dialog';
import Textarea from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { useTimer } from '@/hooks/useTimer';
import { DEFAULT_STUDY_CATEGORIES, ACTIVITY_TYPES } from '@/lib/constants';
import { formatTimerDisplay } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  Timer,
  BookOpen,
  Zap,
  Brain,
  Lightbulb,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FocusTimer({ onSessionSaved }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const userSubjects =
    user?.subjects && Array.isArray(user.subjects)
      ? user.subjects.map((s) => s.name)
      : [];

  const urlCategory = searchParams.get('category') || searchParams.get('subject');
  const initialCategory = urlCategory || (userSubjects.length > 0 ? userSubjects[0] : 'General Study');

  const {
    isRunning,
    isPaused,
    elapsedTime,
    session,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
  } = useTimer();

  const [category, setCategory] = useState(initialCategory);
  const [activityType, setActivityType] = useState('Problem Solving');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');

  // Update category if URL param changes
  useEffect(() => {
    if (urlCategory) {
      setCategory(urlCategory);
    }
  }, [urlCategory]);

  // Screen Wake Lock & Dynamic Title while Timer is Active
  useEffect(() => {
    let wakeLockSentinel = null;

    if (isRunning && !isPaused) {
      document.title = `${formatTimerDisplay(elapsedTime)} · Track Here`;

      if ('wakeLock' in navigator) {
        navigator.wakeLock
          .request('screen')
          .then((lock) => {
            wakeLockSentinel = lock;
          })
          .catch(() => {
            // Graceful fallback if wakeLock is denied or not supported
          });
      }
    } else {
      document.title = 'Track Here';
    }

    return () => {
      document.title = 'Track Here';
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isRunning, isPaused, elapsedTime]);

  // Finish modal state
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [problemsAttempted, setProblemsAttempted] = useState(0);
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [problemsSolvedIndependently, setProblemsSolvedIndependently] = useState(0);
  const [mistakes, setMistakes] = useState('');
  const [keyLearnings, setKeyLearnings] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const handleStart = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) {
      toast.error('Please enter a study topic first');
      return;
    }

    await startTimer({
      category,
      activityType,
      topic: topic.trim(),
      subtopic: subtopic.trim() || undefined,
    });
  };

  const handleOpenFinish = () => {
    setFinishModalOpen(true);
  };

  const handleConfirmFinish = async () => {
    setIsFinishing(true);
    try {
      await finishTimer({
        videoDuration: Number(videoDuration) || 0,
        problemsAttempted: Number(problemsAttempted) || 0,
        problemsSolved: Number(problemsSolved) || 0,
        problemsSolvedIndependently: Number(problemsSolvedIndependently) || 0,
        mistakes: mistakes.trim() || undefined,
        keyLearnings: keyLearnings.trim() || undefined,
        nextAction: nextAction.trim() || undefined,
      });
      setFinishModalOpen(false);
      setTopic('');
      setSubtopic('');
      onSessionSaved?.();
    } finally {
      setIsFinishing(false);
    }
  };

  const isActive = isRunning || isPaused;

  return (
    <>
      <div className="card p-6 sm:p-8 bg-[var(--surface)] border-[var(--line)] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Ring Timer (clamp 240 to 340px) */}
          <div className="flex flex-col items-center justify-center text-center">
            {/* Circular SVG Ring (clamp 240px to 340px) */}
            <div className="relative w-[clamp(240px,70vw,340px)] h-[clamp(240px,70vw,340px)] flex items-center justify-center mx-auto">
              <svg width="100%" height="100%" viewBox="0 0 300 300" className="block">
                <circle
                  cx="150"
                  cy="150"
                  r="125"
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="9"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="125"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={785.4}
                  strokeDashoffset={785.4 * (1 - Math.min(elapsedTime / 1500, 1))}
                  transform="rotate(-90 150 150)"
                  className="transition-all duration-300 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                <div className="text-4xl sm:text-5xl font-heading font-bold text-[var(--text)] tracking-tight font-mono">
                  {formatTimerDisplay(elapsedTime)}
                </div>
                {category && (
                  <span className="text-xs text-[var(--muted)] mt-1 truncate max-w-[180px]">
                    <strong className="text-[var(--text)]">{category}</strong>
                  </span>
                )}
                {elapsedTime >= 1500 ? (
                  <span className="mt-2 text-[10px] font-semibold text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-full border border-[var(--primary)]/30">
                    ✓ Streak Qualified (≥25m)
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--muted)] mt-2 font-medium">
                    25 minutes keeps your streak
                  </span>
                )}
              </div>
            </div>

            {/* Controls (Full width and 56px tall on phones) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 w-full">
              {!isActive ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="btn btn-primary w-full sm:w-auto sm:min-w-[220px] min-h-[56px] text-base font-semibold shadow-xs"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start session</span>
                </button>
              ) : (
                <>
                  {isRunning ? (
                    <button
                      type="button"
                      onClick={pauseTimer}
                      className="btn w-full sm:w-auto min-h-[56px] px-6 border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] font-semibold text-sm"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeTimer}
                      className="btn btn-primary w-full sm:w-auto min-h-[56px] px-6 text-sm font-semibold"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Resume</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenFinish}
                    className="btn btn-primary w-full sm:w-auto min-h-[56px] px-6 text-sm font-semibold"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Finish and save</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Session Details Form */}
          <div className="w-full bg-[var(--surface-2)] p-5 sm:p-6 rounded-2xl border border-[var(--line)]">
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider font-heading mb-4 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Session Details</span>
            </h3>

            <div className="space-y-4">
              {/* Subject Selection: Chips if <= 6, else dropdown; if empty, link to add */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
                  <span>Subject</span>
                  {userSubjects.length === 0 && (
                    <Link to="/subjects" className="text-[var(--primary)] hover:underline font-semibold">
                      + Add your first subject
                    </Link>
                  )}
                </div>

                {userSubjects.length > 0 && userSubjects.length <= 6 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {userSubjects.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => !isActive && setCategory(s)}
                        disabled={isActive}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          category === s
                            ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)] font-bold ring-1 ring-[var(--primary)]'
                            : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : userSubjects.length > 6 ? (
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isActive}
                  >
                    {userSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Activity Type"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  disabled={isActive}
                >
                  {ACTIVITY_TYPES.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Topic or Chapter"
                  placeholder="e.g. Dynamic Programming"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isActive}
                  required
                />
              </div>

              <Input
                label="Subtopic / Concept (Optional)"
                placeholder="e.g. Knapsack 0/1, Bellman-Ford"
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                disabled={isActive}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Complete Session Modal */}
      <Dialog
        isOpen={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        title="Session Completed — Log Outcomes"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-medium text-emerald-950">
            <span>Focused Duration:</span>
            <span className="text-base font-extrabold font-mono text-emerald-800">
              {formatTimerDisplay(elapsedTime)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Problems Attempted"
              type="number"
              min="0"
              value={problemsAttempted}
              onChange={(e) => setProblemsAttempted(e.target.value)}
            />
            <Input
              label="Problems Solved"
              type="number"
              min="0"
              value={problemsSolved}
              onChange={(e) => setProblemsSolved(e.target.value)}
            />
          </div>

          <Input
            label="Solved Independently (Solo)"
            type="number"
            min="0"
            value={problemsSolvedIndependently}
            onChange={(e) => setProblemsSolvedIndependently(e.target.value)}
          />

          <Textarea
            label="Key Learnings & Takeaways"
            placeholder="What concepts clicked? What should be remembered?"
            value={keyLearnings}
            onChange={(e) => setKeyLearnings(e.target.value)}
          />

          <Textarea
            label="Mistakes & Friction Points"
            placeholder="Where did you get stuck or make careless errors?"
            value={mistakes}
            onChange={(e) => setMistakes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setFinishModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmFinish} loading={isFinishing}>
              Save Session to Database
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
