import { useState, useEffect } from 'react';
import { useDailyReview, useCreateDailyReview, useDailyReviews } from '@/hooks/useDailyReviews';
import { formatDuration } from '@/lib/utils';
import { toLocalDateString, formatLocalDateDisplay } from '@/lib/date';
import { Moon, Check, Clock, Target, Award, CheckSquare, Sparkles, AlertCircle, Smile, Meh, Frown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EveningReview() {
  const todayStr = toLocalDateString(new Date());

  const { data: reviewData } = useDailyReview('today');
  const { data: recentReviewsData } = useDailyReviews({ limit: 7 });
  const recentReviews = recentReviewsData?.data?.reviews || recentReviewsData?.reviews || [];
  const createReviewMutation = useCreateDailyReview();

  const existingReview = reviewData?.review;
  const liveStats = reviewData?.liveStats || {
    actualStudyTime: 0,
    completedTasks: [],
    problemsAttempted: 0,
    problemsSolved: 0,
    goalProgress: 0,
    dailyStudyGoal: 240,
  };

  const [mood, setMood] = useState('good');
  const [learnedNote, setLearnedNote] = useState('');
  const [difficultiesNote, setDifficultiesNote] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState(null);

  useEffect(() => {
    if (existingReview) {
      if (existingReview.learned) setLearnedNote(existingReview.learned);
      if (existingReview.difficulties) setDifficultiesNote(existingReview.difficulties);
      if (existingReview.tomorrowPlan) setTomorrowPlan(existingReview.tomorrowPlan);
      if (existingReview.updatedAt) {
        setLastSavedTime(new Date(existingReview.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }
  }, [existingReview]);

  const handleSave = async (e) => {
    e?.preventDefault();

    const payload = {
      date: todayStr,
      actualStudyTime: liveStats.actualStudyTime,
      problemsAttempted: liveStats.problemsAttempted,
      problemsSolved: liveStats.problemsSolved,
      goalProgress: liveStats.goalProgress,
      completedTasks: liveStats.completedTasks?.map((t) => t._id || t) || [],
      learned: learnedNote.trim() || undefined,
      difficulties: difficultiesNote.trim() || undefined,
      tomorrowPlan: tomorrowPlan.trim() || undefined,
      incompleteGoals: [],
    };

    try {
      await createReviewMutation.mutateAsync(payload);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success('Daily Journal logged! Great consistency today.');
    } catch (err) {
      toast.error('Failed to save daily journal.');
    }
  };

  // Recent 7 days strip
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = toLocalDateString(d);
    const hasEntry = Boolean(
      (dateKey === todayStr && (existingReview || lastSavedTime)) ||
      recentReviews.some((r) => toLocalDateString(new Date(r.date)) === dateKey)
    );
    const dayName = d.toLocaleDateString([], { weekday: 'narrow' });
    return { dateKey, dayName, isToday: dateKey === todayStr, hasEntry };
  });

  return (
    <div className="card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-[var(--text)] tracking-tight">
              Daily Reflection Journal
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Reflect on your study session, log what blocked you, and prep for tomorrow
            </p>
          </div>
        </div>

        {/* 7-Day Journal Consistency Strip */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
          {past7Days.map((day) => (
            <div
              key={day.dateKey}
              title={`${day.dateKey}: ${day.hasEntry ? 'Logged' : 'No entry'}`}
              className={`w-7 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono transition-all ${
                day.hasEntry
                  ? 'bg-[var(--primary)] text-[var(--on-primary)] font-bold shadow-2xs'
                  : day.isToday
                  ? 'border border-[var(--primary)] text-[var(--primary)] font-bold'
                  : 'bg-[var(--surface)] text-[var(--muted)]'
              }`}
            >
              <span>{day.dayName}</span>
              <span className="text-[8px] leading-none">{day.hasEntry ? '✓' : '·'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Performance Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-medium">Focus Time</span>
            <b className="text-xs font-heading font-bold text-[var(--text)]">
              {formatDuration(liveStats.actualStudyTime)}
            </b>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--surface)] text-[var(--primary)] border border-[var(--line)] flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-medium">Daily Goal</span>
            <b className="text-xs font-heading font-bold text-[var(--text)]">
              {liveStats.goalProgress}%
            </b>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--warn-soft)] text-[var(--warn)] flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-medium">Problems</span>
            <b className="text-xs font-heading font-bold text-[var(--text)]">
              {liveStats.problemsSolved} solved
            </b>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--surface)] text-[var(--primary)] border border-[var(--line)] flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-[var(--muted)] block font-medium">Tasks</span>
            <b className="text-xs font-heading font-bold text-[var(--text)]">
              {liveStats.completedTasks?.length || 0} done
            </b>
          </div>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block font-heading">
          How was your study day?
        </label>
        <div className="flex items-center gap-2">
          {[
            { id: 'great', label: 'Great Flow', icon: Smile, color: 'text-[var(--primary)]' },
            { id: 'good', label: 'Solid Progress', icon: Smile, color: 'text-[var(--primary)]' },
            { id: 'neutral', label: 'Average', icon: Meh, color: 'text-[var(--warn)]' },
            { id: 'tough', label: 'Tough / Blocked', icon: Frown, color: 'text-[var(--danger)]' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = mood === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMood(item.id)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--text)] shadow-2xs'
                    : 'bg-[var(--surface-2)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Structured Prompts */}
      <div className="space-y-4">
        {/* Prompt 1: What I Studied */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block font-heading">
            1. What I studied today
          </label>
          <textarea
            value={learnedNote}
            onChange={(e) => setLearnedNote(e.target.value)}
            rows={4}
            placeholder="Key concepts grasped, proofs derived, or topics covered today..."
            className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-all leading-relaxed font-sans resize-y"
          />
        </div>

        {/* Prompt 2: What Blocked Me */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block font-heading">
            2. What blocked me / difficulties faced
          </label>
          <textarea
            value={difficultiesNote}
            onChange={(e) => setDifficultiesNote(e.target.value)}
            rows={3}
            placeholder="Distractions, tricky edge cases, concepts that need revisiting, or time sinks..."
            className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-all leading-relaxed font-sans resize-y"
          />
        </div>

        {/* Prompt 3: Tomorrow's First Task */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block font-heading">
            3. Tomorrow’s first priority
          </label>
          <input
            type="text"
            value={tomorrowPlan}
            onChange={(e) => setTomorrowPlan(e.target.value)}
            placeholder="What is the very first topic or problem you will tackle tomorrow morning?"
            className="w-full h-11 px-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-all"
          />
        </div>
      </div>

      {/* Footer & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--line)]">
        <div className="text-[11px] text-[var(--muted)]">
          {lastSavedTime ? (
            <span>Saved today at {lastSavedTime}</span>
          ) : (
            <span>Saves to your daily timeline &amp; study history</span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={createReviewMutation.isPending}
          className="btn btn-primary h-11 px-6 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{createReviewMutation.isPending ? 'Saving...' : 'Save Daily Journal'}</span>
        </button>
      </div>
    </div>
  );
}
