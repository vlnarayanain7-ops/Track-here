import { useState, useEffect } from 'react';
import { localISODate, addDays, fmtDuration, plural } from '@/lib/format';

const MOODS = {
  Great: 'Great Flow',
  Good: 'Solid Progress',
  Okay: 'Average',
  Tough: 'Tough / Blocked',
};

export function EveningReview({
  focusMinutes = 0,
  tasksDone = 0,
  onSave,
  onCreateTask,
  saving,
  error,
  onDone,
  initialReview,
}) {
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');
  const [first, setFirst] = useState('');

  useEffect(() => {
    if (initialReview) {
      if (initialReview.mood) {
        const found = Object.keys(MOODS).find(
          (k) => MOODS[k] === initialReview.mood || k === initialReview.mood
        );
        if (found) setMood(found);
      }
      if (initialReview.reflection) setNote(initialReview.reflection);
      if (initialReview.tomorrowFirst) setFirst(initialReview.tomorrowFirst);
    }
  }, [initialReview]);

  const line = focusMinutes
    ? `You focused ${fmtDuration(focusMinutes)} and finished ${plural(tasksDone, 'task')}.`
    : 'No focus time logged today. That is okay.';

  const submit = async (e) => {
    e.preventDefault();
    try {
      await onSave({
        date: localISODate(),
        mood: mood ? MOODS[mood] : null,
        reflection: note.trim(),
        tomorrowFirst: first.trim(),
      });
      if (first.trim() && onCreateTask) {
        await onCreateTask({
          title: first.trim(),
          dueDate: localISODate(addDays(new Date(), 1)),
          priority: 'High',
        });
      }
      onDone?.();
    } catch {
      // handled
    }
  };

  return (
    <form onSubmit={submit} className="stack">
      <p className="note" style={{ margin: 0 }}>
        {line}
      </p>

      <div>
        <span className="fl">How did it go?</span>
        <div className="pills">
          {Object.keys(MOODS).map((m) => (
            <button
              type="button"
              key={m}
              className={`chip ${mood === m ? 'on' : ''}`}
              aria-pressed={mood === m}
              onClick={() => setMood(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="fl" htmlFor="ev-note">
          Anything to remember?
        </label>
        <textarea
          id="ev-note"
          className="input area"
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div>
        <label className="fl" htmlFor="ev-first">
          Tomorrow’s first task
        </label>
        <input
          id="ev-first"
          className="input"
          maxLength={120}
          placeholder="Creates a task for tomorrow"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="note" style={{ color: 'var(--danger)' }}>
          Could not save. {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
        {saving ? 'Saving…' : 'Save review'}
      </button>
    </form>
  );
}

export default EveningReview;
