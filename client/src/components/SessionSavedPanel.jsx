import { useState } from 'react';
import { fmtSessionDuration } from '@/lib/sessions.js';

export function SessionSavedPanel({ session, subjects = [], onSave, onSkip }) {
  const [name, setName] = useState(session?.topic || '');
  const [subjectId, setSubjectId] = useState(session?.category || '');

  return (
    <section className="saved" aria-live="polite">
      <b>Session saved · {fmtSessionDuration(session)}</b>
      <span className="note">Named automatically. Rename it if you like.</span>
      <input
        className="input"
        value={name}
        maxLength={80}
        onChange={(e) => setName(e.target.value)}
        aria-label="Session name"
      />
      {subjects.length > 0 && (
        <select
          className="input"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          aria-label="Subject"
        >
          <option value="">No subject</option>
          {subjects.map((s) => {
            const val = s.name || s;
            return (
              <option key={s.id || s._id || val} value={val}>
                {val}
              </option>
            );
          })}
        </select>
      )}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={onSkip}>
          Skip
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            onSave({
              topic: name.trim() || session?.topic,
              category: subjectId || 'Focus',
            })
          }
        >
          Save
        </button>
      </div>
    </section>
  );
}

export default SessionSavedPanel;
