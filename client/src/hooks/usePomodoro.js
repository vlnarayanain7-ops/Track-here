// src/hooks/usePomodoro.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { reduce, initialState, remainingMs, elapsedMs, focusSnapshot, MIN_SAVE_SEC, PRESETS, configFor } from '../lib/pomodoro';

import { getAccountSession } from '../lib/accountSession';
const storageKey = () => `th-pomo:${getAccountSession().ownerId}`;

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
};

const load = () => {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return initialState();
    const value = JSON.parse(raw);
    if (!value || !PRESETS[value.presetId] || !['focus', 'short', 'long'].includes(value.phase)) return initialState();
    return { ...initialState(value.presetId, value.custom), ...value, cfg: configFor(value.presetId, value.custom), accMs: Math.max(0, Number(value.accMs) || 0) };
  } catch {
    return initialState();
  }
};

export function usePomodoro({ prefs = {}, onSave, onPhaseEnd }) {
  const [state, setState] = useState(load);
  const [now, setNow] = useState(Date.now);
  const finishing = useRef(false);
  const [saving, setSaving] = useState(false);
  const handled = useRef(null); // never finish the same block twice

  const dispatch = useCallback((a) => {
    const current = Date.now();
    setNow(current);
    setState((s) => reduce(s, a, current));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(state));
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

  const complete = useCallback(async (automatic = false) => {
    if (finishing.current) return;
    const key = `${state.clientId}:${state.phase}`;
    if ((automatic || (state.phase === 'focus' && state.clientId)) && handled.current === key) return;
    if (state.phase === 'focus' && !state.firstStartedAt) return;
    finishing.current = true;
    setSaving(true);
    try {
      const current = Date.now();
      if (state.phase === 'focus' && state.firstStartedAt) {
        const snap = focusSnapshot(state, current, { completed: automatic });
        if (snap.durationSec >= MIN_SAVE_SEC) await onSave?.(snap);
        else onPhaseEnd?.('too-short');
      }
      handled.current = key;
      if (automatic) onPhaseEnd?.(state.phase);
      dispatch(state.presetId === 'stopwatch' ? { type: 'reset' } : {
        type: 'next', autoStart: automatic && (state.phase === 'focus' ? Boolean(prefs.autoBreak) : Boolean(prefs.autoFocus)), id: generateUUID(),
      });
    } catch {
      // Retain the snapshot and pause so a failed durable save can be retried.
      dispatch({ type: 'pause' });
    } finally {
      finishing.current = false;
      setSaving(false);
    }
  }, [state, onSave, onPhaseEnd, prefs.autoBreak, prefs.autoFocus, dispatch]);

  useEffect(() => {
    if (state.running && left !== null && left <= 0) void complete(true);
  }, [left, state.running, complete]);

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

  const finish = useCallback(() => complete(false), [complete]);

  return {
    state,
    saving,
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
