import React, { useEffect, useRef } from 'react';
import { PRESETS } from '@/lib/pomodoro';
import { TimerRing } from './TimerRing';
import { usePomodoro } from '@/hooks/usePomodoro';
import { chime } from '@/lib/chime';

const MODES = [
  ['focus', 'Focus'],
  ['short', 'Short break'],
  ['long', 'Long break'],
];

const fmtClock = (ms, up = false) => {
  if (ms === null || ms === undefined || isNaN(ms)) return '00:00';
  const total = Math.max(0, up ? Math.floor(ms / 1000) : Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600),
    m = Math.floor((total % 3600) / 60),
    s = total % 60;
  const mm = String(m).padStart(2, '0'),
    ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
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
  const clock = fmtClock(ms, stopwatch);

  // Sync custom preset updates while stopped (only when values actually change to avoid re-render loops)
  const customStr = JSON.stringify(prefs?.custom);
  const cfgStr = JSON.stringify(s.cfg);
  useEffect(() => {
    if (s.presetId === 'custom' && !s.running && prefs?.custom) {
      const p = prefs.custom;
      const c = s.cfg;
      if (!c || p.focus !== c.focus || p.short !== c.short || p.long !== c.long || p.every !== c.every) {
        t.dispatch({ type: 'preset', presetId: 'custom', custom: p });
      }
    }
  }, [prefs?.custom, s.presetId, s.running, customStr, cfgStr]);

  const handleModeChange = (id) => {
    if (s.phase === id) return;
    if (s.running) {
      t.pause();
    }
    t.dispatch({ type: 'mode', phase: id });
  };

  const handlePresetChange = (id) => {
    if (s.presetId === id) return;
    if (s.running) {
      t.pause();
    }
    t.dispatch({
      type: 'preset',
      presetId: id,
      custom: prefs?.custom,
    });
  };

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
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const curr = tRef.current;
      if (e.code === 'Space') {
        e.preventDefault();
        curr.state.running ? curr.pause() : curr.start();
      }
      if (e.key === 'r' || e.key === 'R') {
        curr.reset();
      }
      if (e.key === 's' || e.key === 'S') {
        curr.finish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      {/* 1. Mode Switch on Top */}
      {!stopwatch && (
        <div className="seg" role="group" aria-label="Mode">
          {MODES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={s.phase === id}
              onClick={() => handleModeChange(id)}
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
          title={
            s.running
              ? 'Pause (Press Space)'
              : s.accMs > 0
              ? 'Resume (Press Space)'
              : 'Start (Press Space)'
          }
        >
          {s.running ? 'Pause' : s.accMs > 0 ? 'Resume' : 'Start'}
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
            onClick={() => handlePresetChange(id)}
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
