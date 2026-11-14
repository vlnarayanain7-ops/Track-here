import { useState } from 'react';
import { localISODate } from '@/lib/format';

const TARGETS = [2, 3, 4, 6];

export function MorningPlan({ defaultHours = 4, openTasks = [], onSave, saving, error, onDone }) {
  const [hours, setHours] = useState(defaultHours);
  const [top, setTop] = useState(['', '', '']);
  const [notes, setNotes] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    await onSave({
      date: localISODate(),
      targetHours: hours,
      priorities: top.map((s) => s.trim()).filter(Boolean),
      notes: notes.trim(),
    });
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="stack">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="fl">How long today?</legend>
        <div className="pills">
          {TARGETS.map((h) => (
            <button
              type="button"
              key={h}
              className={`chip ${hours === h ? 'on' : ''}`}
              aria-pressed={hours === h}
              onClick={() => setHours(h)}
            >
              {h}h
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <span className="fl">Top 3 for today</span>
        {top.map((v, i) => (
          <input
            key={i}
            className="input"
            list="open-tasks"
            maxLength={120}
            placeholder={['First', 'Second', 'Third'][i]}
            aria-label={`Priority ${i + 1}`}
            value={v}
            onChange={(e) =>
              setTop((t) => t.map((x, j) => (j === i ? e.target.value : x)))
            }
          />
        ))}
        <datalist id="open-tasks">
          {openTasks.map((t) => (
            <option key={t.id || t._id} value={t.title || t.text} />
          ))}
        </datalist>
      </div>

      <details>
        <summary className="note cursor-pointer">Add notes</summary>
        <textarea
          className="input area mt-2"
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="Notes"
        />
      </details>

      {error && (
        <p role="alert" className="note" style={{ color: 'var(--danger)' }}>
          Could not save. {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
        {saving ? 'Saving…' : 'Save plan'}
      </button>
    </form>
  );
}

export default MorningPlan;
