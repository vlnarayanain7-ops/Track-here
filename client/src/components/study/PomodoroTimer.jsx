import React, { useEffect } from 'react';
import { PRESETS } from '@/lib/pomodoro';
import { TimerRing } from './TimerRing';
import { usePomodoro } from '@/hooks/usePomodoro';
import { chime } from '@/lib/chime';

const MODES = [
  ['focus', 'Focus'],
  ['short', 'Short break'],
  ['long', 'Long break'],
];

const fmtClock = (ms) => {
  if (ms === null || ms === undefined || isNaN(ms)) return '00:00';
  const s = Math.ceil(ms / 1000);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function PomodoroTimer({
  subjects = [],
  prefs,
  onSave,
  onOpenSettings,
  onPhaseChange,
}) {
  const t = usePomodoro({
    prefs,
    onSave,
    onPhaseEnd: (ph) => {
      if (prefs?.sound) chime();
      if (
        prefs?.notify &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        ph !== 'too-short'
      ) {
        new Notification(
          ph === 'focus'
            ? 'Focus block done. Time for a break.'
            : 'Break over. Ready to focus?'
        );
      }
    },
  });

  const { state: s } = t;
  const stopwatch = s.presetId === 'stopwatch';
  const brk = s.phase !== 'focus';
  const ms = stopwatch ? t.elapsed : t.left;
  const clock = fmtClock(ms);

  useEffect(() => {
    onPhaseChange?.(s.phase);
  }, [s.phase, onPhaseChange]);

  // Tab Title
  useEffect(() => {
    if (s.running) {
      document.title = `${clock} · ${brk ? 'Break' : 'Focus'} · Track Here`;
    } else {
      document.title = 'Focus · Track Here';
    }
    return () => {
      document.title = 'Track Here';
    };
  }, [clock, s.running, brk]);

  // Keep screen awake while running
  useEffect(() => {
    let lock = null;
    if (s.running && 'wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          lock = l;
        })
        .catch(() => {});
    }
    return () => {
      lock?.release?.().catch(() => {});
    };
  }, [s.running]);

  // Keyboard shortcuts: Space (start/pause), R (reset), S (finish/skip)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        s.running ? t.pause() : t.start();
      }
      if (e.key === 'r' || e.key === 'R') {
        t.reset();
      }
      if (e.key === 's' || e.key === 'S') {
        t.finish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [s.running, t]);

  const cycle = s.cfg?.every ?? 4;
  const done = s.completedFocus % (cycle || 1);

  // Label under the clock
  const ringLabel = brk
    ? 'Step away for a moment'
    : stopwatch
    ? 'Stopwatch'
    : `Focus ${done + 1} of ${cycle}`;

  // Progress computation
  const targetDurationMs = s.cfg
    ? (s.cfg[s.phase === 'focus' ? 'focus' : s.phase === 'short' ? 'short' : 'long'] ?? 25) * 60_000
    : 25 * 60_000;
  const progress = stopwatch ? 0 : 1 - (t.left ?? 0) / (targetDurationMs || 1);

  return (
    <div className="center">
      {/* 1. Mode Switch on Top (Disabled while running) */}
      {!stopwatch && (
        <div className="seg" role="group" aria-label="Mode">
          {MODES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={s.phase === id}
              disabled={s.running}
              onClick={() => t.dispatch({ type: 'mode', phase: id })}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 2. Subject chips only in Focus mode */}
      {!brk && subjects.length > 0 && (
        <div className="chips">
          {subjects.map((x) => {
            const sid = x.id || x._id || x.name;
            const isSelected = s.subjectId === sid;
            return (
              <button
                key={sid}
                type="button"
                className={`chip ${isSelected ? 'on' : ''}`}
                aria-pressed={isSelected}
                onClick={() =>
                  t.dispatch({
                    type: 'subject',
                    subjectId: isSelected ? null : sid,
                  })
                }
              >
                {x.name}
              </button>
            );
          })}
        </div>
      )}
      {!brk && subjects.length === 0 && (
        <a href="/plan?tab=subjects" className="chip">
          + Add a subject
        </a>
      )}

      {/* 3. The Ring with big remaining time & quiet line */}
      <TimerRing
        label={ringLabel}
        clock={clock}
        progress={progress}
        tone={brk ? 'break' : 'focus'}
      />

      {/* 4. Cycle Dots */}
      {!stopwatch && (
        <div className="dots" aria-label={`Cycle: ${done} of ${cycle} done`}>
          {Array.from({ length: cycle }, (_, i) => (
            <i key={i} className={i < done ? 'on' : ''} />
          ))}
        </div>
      )}

      {/* 5. Action Buttons: Reset / Start or Pause / Finish (or Skip break) */}
      <div className="acts">
        <button
          type="button"
          className="btn btn-lg"
          onClick={t.reset}
          title="Reset timer (Press R)"
        >
          Reset
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={s.running ? t.pause : t.start}
          title={s.running ? 'Pause (Press Space)' : 'Start (Press Space)'}
        >
          {s.running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          className="btn btn-lg"
          onClick={t.finish}
          title={brk ? 'Skip break (Press S)' : 'Finish session (Press S)'}
        >
          {brk ? 'Skip break' : 'Finish'}
        </button>
      </div>

      {/* 6. Presets Row */}
      <div className="chips" role="group" aria-label="Preset">
        {Object.entries(PRESETS).map(([id, p]) => (
          <button
            key={id}
            type="button"
            className={`chip ${s.presetId === id ? 'on' : ''}`}
            aria-pressed={s.presetId === id}
            disabled={s.running}
            onClick={() =>
              t.dispatch({
                type: 'preset',
                presetId: id,
                custom: prefs?.custom,
              })
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 7. Quiet line with Timer settings link */}
      <p className="note text-center">
        25 minutes keeps your streak ·{' '}
        <button
          type="button"
          className="linklike inline"
          onClick={onOpenSettings}
        >
          Timer settings
        </button>
      </p>
    </div>
  );
}

export default PomodoroTimer;
