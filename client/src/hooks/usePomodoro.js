// src/hooks/usePomodoro.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { reduce, initialState, remainingMs, elapsedMs, focusSnapshot, MIN_SAVE_SEC } from '../lib/pomodoro';

const KEY = 'th-pomo';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
};

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : initialState();
  } catch {
    return initialState();
  }
};

export function usePomodoro({ prefs = {}, onSave, onPhaseEnd }) {
  const [state, setState] = useState(load);
  const [now, setNow] = useState(Date.now);
  const handled = useRef(null); // never finish the same block twice

  const dispatch = useCallback((a) => {
    const current = Date.now();
    setNow(current);
    setState((s) => reduce(s, a, current));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // ignore quota issues
    }
  }, [state]);

  useEffect(() => {
    if (!state.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [state.running]);

  const left = remainingMs(state, now);

  useEffect(() => {
    if (!state.running || left === null || left > 0) return;
    const key = `${state.clientId}:${state.phase}`;
    if (handled.current === key) return;
    handled.current = key;

    const current = Date.now();
    if (state.phase === 'focus') {
      onSave?.(focusSnapshot(state, current, { completed: true }));
    }
    onPhaseEnd?.(state.phase); // chime, notification, toast
    dispatch({
      type: 'next',
      autoStart: state.phase === 'focus' ? Boolean(prefs.autoBreak) : Boolean(prefs.autoFocus),
      id: generateUUID(),
    });
  }, [left, state.running, state.phase, state.clientId, prefs.autoBreak, prefs.autoFocus, onSave, onPhaseEnd, dispatch]);

  const start = useCallback(() => {
    const current = Date.now();
    setNow(current);
    dispatch({ type: 'start', id: generateUUID() });
  }, [dispatch]);

  const pause = useCallback(() => {
    const current = Date.now();
    setNow(current);
    dispatch({ type: 'pause' });
  }, [dispatch]);

  const reset = useCallback(() => {
    const current = Date.now();
    setNow(current);
    dispatch({ type: 'reset' });
  }, [dispatch]);

  const finish = useCallback(() => {
    // "Finish" in focus, "Skip" in a break
    const t = Date.now();
    setNow(t);
    if (state.phase === 'focus' && state.firstStartedAt) {
      const snap = focusSnapshot(state, t, { completed: false });
      if (snap.durationSec >= MIN_SAVE_SEC) {
        onSave?.(snap);
      } else {
        onPhaseEnd?.('too-short');
      }
    }
    if (state.presetId === 'stopwatch') {
      dispatch({ type: 'reset' });
    } else {
      dispatch({ type: 'next', autoStart: false, id: generateUUID() });
    }
  }, [state, onSave, onPhaseEnd, dispatch]);

  return {
    state,
    now,
    left,
    elapsed: elapsedMs(state, now),
    dispatch,
    start,
    finish,
    pause,
    reset,
  };
}
