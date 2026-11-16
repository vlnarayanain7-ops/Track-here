// src/lib/pomodoro.js: pure state machine, fully testable
export const PRESETS = {
  classic:   { label: '25 / 5',  focus: 25, short: 5,  long: 15, every: 4 },
  deep:      { label: '50 / 10', focus: 50, short: 10, long: 20, every: 3 },
  marathon:  { label: '90 / 20', focus: 90, short: 20, long: 30, every: 2 },
  custom:    { label: 'Custom',  focus: 25, short: 5,  long: 15, every: 4 },
  stopwatch: { label: 'Stopwatch' },
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(n)) || lo));
export const normalizeCustom = c => ({ focus: clamp(c.focus, 5, 180), short: clamp(c.short, 1, 60), long: clamp(c.long, 5, 90), every: clamp(c.every, 2, 8) });
export const configFor = (presetId, custom) => (presetId === 'custom' ? normalizeCustom(custom ?? PRESETS.custom) : PRESETS[presetId]);
export const phaseMinutes = (cfg, phase) => cfg[phase === 'focus' ? 'focus' : phase === 'short' ? 'short' : 'long'];

export const initialState = (presetId = 'classic', custom) => ({
  presetId, custom: custom ?? null, cfg: configFor(presetId, custom), phase: 'focus',
  running: false, startedAt: null, accMs: 0, completedFocus: 0, firstStartedAt: null, clientId: null, subjectId: null,
});
export const elapsedMs = (s, now) => s.accMs + (s.running ? now - s.startedAt : 0);
export const plannedMs = s => (s.presetId === 'stopwatch' ? null : phaseMinutes(s.cfg, s.phase) * 60_000);
export const remainingMs = (s, now) => (s.presetId === 'stopwatch' ? null : Math.max(0, plannedMs(s) - elapsedMs(s, now)));
export const nextPhaseOf = (s, completed) => (s.phase === 'focus' ? (completed % s.cfg.every === 0 ? 'long' : 'short') : 'focus');

export function reduce(s, a, now = Date.now()) {
  switch (a.type) {
    case 'start': return s.running ? s : { ...s, running: true, startedAt: now, firstStartedAt: s.firstStartedAt ?? now, clientId: s.clientId ?? a.id };
    case 'pause': return s.running ? { ...s, running: false, accMs: s.accMs + (now - s.startedAt), startedAt: null } : s;
    case 'reset': return { ...s, running: false, startedAt: null, accMs: 0, firstStartedAt: null, clientId: null };
    case 'preset': return s.running ? s : { ...initialState(a.presetId, a.custom ?? s.custom), subjectId: s.subjectId };       // only while stopped
    case 'mode':   return s.running || s.presetId === 'stopwatch' ? s : { ...s, phase: a.phase, accMs: 0, firstStartedAt: null, clientId: null };
    case 'subject': return { ...s, subjectId: a.subjectId };
    case 'next': {                                                       // the caller has ALREADY saved the focus time
      const completed = s.phase === 'focus' ? s.completedFocus + 1 : s.phase === 'long' ? 0 : s.completedFocus;
      const phase = s.presetId === 'stopwatch' ? 'focus' : nextPhaseOf(s, completed);
      const auto = !!a.autoStart && s.presetId !== 'stopwatch';
      return { ...s, phase, completedFocus: completed, running: auto, startedAt: auto ? now : null, accMs: 0, firstStartedAt: auto ? now : null, clientId: auto ? a.id : null };
    }
    default: return s;
  }
}
// What to save for a focus phase (call BEFORE dispatching 'next' or 'reset'):
export function focusSnapshot(s, now, { completed }) {
  const planned = plannedMs(s), elapsed = elapsedMs(s, now);
  const ms = planned ? Math.min(elapsed, planned) : elapsed;           // never save more than the planned length
  return { clientId: s.clientId, startedAt: new Date(s.firstStartedAt ?? now - ms).toISOString(), durationSec: Math.round(ms / 1000), source: 'timer', subjectId: s.subjectId, completed };
}
export const MIN_SAVE_SEC = 60;
