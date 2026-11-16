import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  useActiveTimer,
  useStartTimer,
  usePauseTimer,
  useResumeTimer,
  useFinishTimer,
  useCancelTimer,
} from '@/hooks/useStudySessions';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/api/axios';
import { enqueueOutbox, generateClientId } from '@/lib/outbox';

const TimerContext = createContext(null);
const LOCAL_STORAGE_KEY = 'trackhere_active_timer_v2';

function readStoredTimer() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeStoredTimer(data) {
  try {
    if (!data) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Ignore quota issues
  }
}

export function TimerProvider({ children }) {
  const qc = useQueryClient();

  // Internal state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [session, setSession] = useState(null);

  const localStartRef = useRef(null);
  const accumulatedRef = useRef(0);
  const sessionRef = useRef(null);
  const hasRecoveredRef = useRef(false);

  const activeTimerQuery = useActiveTimer();
  const startMutation = useStartTimer();
  const pauseMutation = usePauseTimer();
  const resumeMutation = useResumeTimer();
  const finishMutation = useFinishTimer();
  const cancelMutation = useCancelTimer();

  // 1. Initial hydration from LocalStorage for instant zero-latency paint
  useEffect(() => {
    const stored = readStoredTimer();
    if (stored && stored.startedAt) {
      const now = Date.now();
      const ageHours = (now - stored.lastTick) / 3600000;
      // Stale if > 24 hours
      if (ageHours < 24) {
        let initialElapsed = stored.accumulatedDuration || 0;
        if (stored.isRunning && !stored.isPaused && stored.localStart) {
          const delta = Math.max(0, Math.floor((now - stored.localStart) / 1000));
          initialElapsed += delta;
        }

        accumulatedRef.current = stored.accumulatedDuration || 0;
        localStartRef.current = stored.isRunning && !stored.isPaused ? (stored.localStart || now) : null;
        setElapsedTime(initialElapsed);
        setIsRunning(Boolean(stored.isRunning));
        setIsPaused(Boolean(stored.isPaused));
        if (stored.session) {
          setSession(stored.session);
          sessionRef.current = stored.session;
        }
      } else {
        writeStoredTimer(null);
      }
    }
  }, []);

  // 2. Synchronize / reconcile with Server Active Timer on initial mount
  useEffect(() => {
    // Only perform initial mount recovery once
    if (hasRecoveredRef.current) return;
    if (!activeTimerQuery.isSuccess) return;

    const s = activeTimerQuery.data?.data?.session ?? activeTimerQuery.data?.session;
    hasRecoveredRef.current = true;

    if (s && !isRunning && !isPaused) {
      setSession(s);
      sessionRef.current = s;

      if (s.timerState?.status === 'running') {
        const serverStarted = s.timerState?.startedAt ? new Date(s.timerState.startedAt).getTime() : Date.now();
        const pausedSecs = s.timerState?.totalPausedDuration || 0;
        const initial = Math.max(0, Math.floor((Date.now() - serverStarted) / 1000) - pausedSecs);

        if (initial < 24 * 3600) {
          accumulatedRef.current = initial;
          localStartRef.current = Date.now();
          setElapsedTime(initial);
          setIsRunning(true);
          setIsPaused(false);

          writeStoredTimer({
            startedAt: serverStarted,
            accumulatedDuration: initial,
            localStart: Date.now(),
            lastTick: Date.now(),
            isRunning: true,
            isPaused: false,
            session: s,
          });
        }
      } else if (s.timerState?.status === 'paused') {
        const pausedSecs = s.timerState?.accumulatedDuration || 0;
        accumulatedRef.current = pausedSecs;
        localStartRef.current = null;
        setElapsedTime(pausedSecs);
        setIsRunning(false);
        setIsPaused(true);

        writeStoredTimer({
          startedAt: Date.now(),
          accumulatedDuration: pausedSecs,
          localStart: null,
          lastTick: Date.now(),
          isRunning: false,
          isPaused: true,
          session: s,
        });
      }
    } else if (!s) {
      // Server confirmed NO active session on mount: clear any stale ghost timer from localStorage
      if (!sessionRef.current?._id?.startsWith('session_local_')) {
        accumulatedRef.current = 0;
        localStartRef.current = null;
        setElapsedTime(0);
        setIsRunning(false);
        setIsPaused(false);
        setSession(null);
        sessionRef.current = null;
        writeStoredTimer(null);
      }
    }
  }, [activeTimerQuery.data, activeTimerQuery.isSuccess]);

  // 3. Monotonic tick interval
  useEffect(() => {
    let intervalId = null;

    if (isRunning && !isPaused) {
      intervalId = setInterval(() => {
        if (localStartRef.current) {
          const delta = Math.floor((Date.now() - localStartRef.current) / 1000);
          const currentTotal = accumulatedRef.current + Math.max(0, delta);
          setElapsedTime(currentTotal);

          // Update local storage snapshot periodically
          writeStoredTimer({
            startedAt: localStartRef.current,
            accumulatedDuration: accumulatedRef.current,
            localStart: localStartRef.current,
            lastTick: Date.now(),
            isRunning: true,
            isPaused: false,
            session: sessionRef.current,
          });
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, isPaused]);

  // 3b. Heartbeat every 60 seconds while the timer is running and the tab is visible
  useEffect(() => {
    let heartbeatId = null;

    if (isRunning && !isPaused) {
      heartbeatId = setInterval(async () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          try {
            const res = await api.post('/study-sessions/timer/heartbeat');
            if (res.data?.autoClosed) {
              setIsRunning(false);
              setIsPaused(false);
              writeStoredTimer(null);
              toast.success('Timer reached the 6-hour limit and was safely saved.');
              qc.invalidateQueries({ queryKey: ['studySessions'] });
              qc.invalidateQueries({ queryKey: ['analytics'] });
            }
          } catch {
            // Network error / offline: safe, retried or synced when back online
          }
        }
      }, 60000);
    }

    return () => {
      if (heartbeatId) clearInterval(heartbeatId);
    };
  }, [isRunning, isPaused, qc]);

  // 4. Timer Actions
  const startTimer = useCallback(async (data) => {
    hasRecoveredRef.current = true;
    accumulatedRef.current = 0;
    localStartRef.current = Date.now();
    setElapsedTime(0);
    setIsRunning(true);
    setIsPaused(false);

    writeStoredTimer({
      startedAt: Date.now(),
      accumulatedDuration: 0,
      localStart: Date.now(),
      lastTick: Date.now(),
      isRunning: true,
      isPaused: false,
      session: null,
    });

    try {
      const result = await startMutation.mutateAsync(data);
      const s = result?.data?.session || result?.session || result;
      setSession(s);
      sessionRef.current = s;

      writeStoredTimer({
        startedAt: Date.now(),
        accumulatedDuration: 0,
        localStart: Date.now(),
        lastTick: Date.now(),
        isRunning: true,
        isPaused: false,
        session: s,
      });

      return result;
    } catch (err) {
      if (err.response?.status === 409 || err.message?.includes('active timer session')) {
        await cancelMutation.mutateAsync().catch(() => {});
        const result = await startMutation.mutateAsync(data);
        const s = result?.data?.session || result?.session || result;
        setSession(s);
        sessionRef.current = s;
        return result;
      }

      if (!err.response || !navigator.onLine) {
        // Device-only fallback: run timer fully offline
        const localSession = {
          _id: generateClientId('session_local'),
          isTimerSession: true,
          category: data?.category || 'Focus',
          topic: data?.topic || 'Focus session',
          timerState: { status: 'running', startedAt: new Date().toISOString() },
        };
        setSession(localSession);
        sessionRef.current = localSession;
        writeStoredTimer({
          startedAt: Date.now(),
          accumulatedDuration: 0,
          localStart: Date.now(),
          lastTick: Date.now(),
          isRunning: true,
          isPaused: false,
          session: localSession,
        });
        return { data: { session: localSession } };
      }

      setIsRunning(false);
      setElapsedTime(0);
      writeStoredTimer(null);
      throw err;
    }
  }, [startMutation, cancelMutation]);

  const pauseTimer = useCallback(async () => {
    const current = localStartRef.current
      ? accumulatedRef.current + Math.max(0, Math.floor((Date.now() - localStartRef.current) / 1000))
      : elapsedTime;

    accumulatedRef.current = current;
    localStartRef.current = null;
    setElapsedTime(current);
    setIsRunning(false);
    setIsPaused(true);

    writeStoredTimer({
      startedAt: Date.now(),
      accumulatedDuration: current,
      localStart: null,
      lastTick: Date.now(),
      isRunning: false,
      isPaused: true,
      session: sessionRef.current,
    });

    const sId = sessionRef.current?._id || session?._id;
    if (sId) {
      const result = await pauseMutation.mutateAsync(sId);
      const updated = result?.data?.session || result?.session || result;
      if (updated) {
        setSession(updated);
        sessionRef.current = updated;
      }
      return result;
    }
  }, [session, pauseMutation, elapsedTime]);

  const resumeTimer = useCallback(async () => {
    localStartRef.current = Date.now();
    setIsRunning(true);
    setIsPaused(false);

    writeStoredTimer({
      startedAt: Date.now(),
      accumulatedDuration: accumulatedRef.current,
      localStart: Date.now(),
      lastTick: Date.now(),
      isRunning: true,
      isPaused: false,
      session: sessionRef.current,
    });

    const sId = sessionRef.current?._id || session?._id;
    if (sId) {
      const result = await resumeMutation.mutateAsync(sId);
      const updated = result?.data?.session || result?.session || result;
      if (updated) {
        setSession(updated);
        sessionRef.current = updated;
      }
      return result;
    }
  }, [session, resumeMutation]);

  const finishTimer = useCallback(async (data = {}) => {
    hasRecoveredRef.current = true;
    const current = localStartRef.current
      ? accumulatedRef.current + Math.max(0, Math.floor((Date.now() - localStartRef.current) / 1000))
      : elapsedTime;

    const sId = sessionRef.current?._id || session?._id;
    const focusMins = current >= 20 ? Math.max(1, Math.round(current / 60)) : Math.floor(current / 60);

    // Reset client state immediately
    accumulatedRef.current = 0;
    localStartRef.current = null;
    setElapsedTime(0);
    setIsRunning(false);
    setIsPaused(false);
    setSession(null);
    sessionRef.current = null;
    writeStoredTimer(null);
    qc.setQueryData(['activeTimer'], { success: true, data: { session: null } });

    if (sId && !sId.startsWith('session_local_')) {
      try {
        const res = await finishMutation.mutateAsync({
          id: sId,
          data: {
            ...data,
            focusDuration: focusMins,
          },
        });

        // Immediately invalidate and refetch all streak, session, and analytics queries
        await Promise.all([
          qc.invalidateQueries({ queryKey: ['activeTimer'] }),
          qc.invalidateQueries({ queryKey: ['studySessions'] }),
          qc.invalidateQueries({ queryKey: ['analytics'] }),
          qc.invalidateQueries({ queryKey: ['analytics', 'streaks'] }),
          qc.invalidateQueries({ queryKey: ['analytics', 'heatmap'] }),
          qc.invalidateQueries({ queryKey: ['streakData'] }),
          qc.invalidateQueries({ queryKey: ['dailyReview'] }),
          qc.invalidateQueries({ queryKey: ['studyStats'] }),
        ]);
        // Force synchronous refetch of streak queries so the UI flame and counter update instantly
        qc.refetchQueries({ queryKey: ['analytics', 'streaks'] });
        qc.refetchQueries({ queryKey: ['analytics'] });

        toast.success(`Focus session saved! ${focusMins}m logged.`);
        return res;
      } catch {
        // Fall through to save via Outbox if server is asleep or network is offline
      }
    }

    // Offline outbox save: guaranteed persistence on device
    try {
      await enqueueOutbox({
        endpoint: '/study-sessions',
        method: 'POST',
        payload: {
          ...data,
          category: data?.category || sessionRef.current?.category || 'Focus',
          topic: data?.topic || sessionRef.current?.topic || 'Focus session',
          focusDuration: focusMins,
          durationSec: current,
          source: 'timer',
          date: new Date().toISOString(),
          clientId: generateClientId('timer'),
        },
      });
      toast.success(`Saved on this device (${focusMins}m). Changes will sync.`);
      return { ok: true, offline: true };
    } catch {
      toast.error('Failed to save focus session');
    }
  }, [session, finishMutation, elapsedTime, qc]);

  const resetTimer = useCallback(async () => {
    hasRecoveredRef.current = true;
    accumulatedRef.current = 0;
    localStartRef.current = null;
    setElapsedTime(0);
    setIsRunning(false);
    setIsPaused(false);
    setSession(null);
    sessionRef.current = null;
    writeStoredTimer(null);

    qc.setQueryData(['activeTimer'], { success: true, data: { session: null } });
    await cancelMutation.mutateAsync().catch(() => {});
    qc.invalidateQueries({ queryKey: ['activeTimer'] });
  }, [cancelMutation, qc]);

  const value = {
    elapsedTime,
    isRunning,
    isPaused,
    session,
    isActive: isRunning || isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    resetTimer,
    isStarting: startMutation.isPending,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isFinishing: finishMutation.isPending,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimerContext() {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return ctx;
}
