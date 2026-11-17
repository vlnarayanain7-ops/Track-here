// src/components/study/TodaySessions.jsx: header with History at the right edge, one compact row per session
import React from 'react';
import { fmtSessionDuration } from '@/lib/sessions.js';

export function TodaySessions({ sessions = [], subjectsById = {}, onHistory }) {
  return (
    <section className="mt-8">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '24px 0 8px',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Today’s sessions</h2>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onHistory}
          style={{ cursor: 'pointer' }}
        >
          History
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="note py-2">No sessions yet today. Press Start to begin.</p>
      ) : (
        sessions.map((s) => {
          const sid = s.subjectId || s.category || s.subject;
          const subject = subjectsById[sid];
          const color = subject?.color || '1';
          const dotBg = color.startsWith('#')
            ? color
            : color.startsWith('c')
            ? `var(--${color}, var(--primary))`
            : `var(--c-${color}, var(--primary))`;

          return (
            <div
              key={s.id || s._id || s.clientId || Math.random()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderTop: '1px solid var(--line)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.topic || s.name || 'Focus session'}
                </div>
                {subject && (
                  <div
                    className="note"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    <i
                      className="dot"
                      style={{
                        background: dotBg,
                      }}
                    />
                    {subject.name || subject}
                  </div>
                )}
              </div>
              <b style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {fmtSessionDuration(s)}
              </b>
            </div>
          );
        })
      )}
    </section>
  );
}

export default TodaySessions;
