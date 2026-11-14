import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useActiveTimer,
  useStartTimer,
  usePauseTimer,
  useResumeTimer,
  useFinishTimer,
  useCancelTimer,
} from './useStudySessions';

export function useTimer() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [session, setSession] = useState(null);

  const intervalRef = useRef(null);
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

  // Recover active timer on initial mount (e.g. page reload while timer is active)
  useEffect(() => {
    if (activeTimerQuery.data?.session && !hasRecoveredRef.current && !isRunning && !isPaused) {
      hasRecoveredRef.current = true;
      const s = activeTimerQuery.data.session;
      setSession(s);
      sessionRef.current = s;

      if (s.timerState?.status === 'running') {
        const serverStarted = s.timerState?.startedAt ? new Date(s.timerState.startedAt).getTime() : Date.now();
        const pausedSecs = s.timerState?.totalPausedDuration || 0;
        const initial = Math.max(0, Math.floor((Date.now() - serverStarted) / 1000) - pausedSecs);

        // If the recovered session is older than 24h, treat as stale
        if (initial < 24 * 3600) {
          accumulatedRef.current = initial;
          localStartRef.current = Date.now();
          setElapsedTime(initial);
          setIsRunning(true);
          setIsPaused(false);
        }
      } else if (s.timerState?.status === 'paused') {
        const pausedSecs = s.timerState?.accumulatedDuration || 0;
        accumulatedRef.current = pausedSecs;
        localStartRef.current = null;
        setElapsedTime(pausedSecs);
        setIsRunning(false);
        setIsPaused(true);
      }
    }
  }, [activeTimerQuery.data, isRunning, isPaused]);

  // Tick interval: strictly uses monotonic local time so clock skew never causes jumps
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (localStartRef.current) {
          const delta = Math.floor((Date.now() - localStartRef.current) / 1000);
          setElapsedTime(accumulatedRef.current + Math.max(0, delta));
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const startTimerFn = useCallback(async (data) => {
    // 1. Immediately reset to 0 and begin local tick
    accumulatedRef.current = 0;
    localStartRef.current = Date.now();
    setElapsedTime(0);
    setIsRunning(true);
    setIsPaused(false);

    try {
      const result = await startMutation.mutateAsync(data);
      const s = result?.data?.session || result?.session || result;
      setSession(s);
      sessionRef.current = s;
      return result;
    } catch (err) {
      // If 409 conflict, auto-cancel previous orphan and retry cleanly
      if (err.response?.status === 409 || err.message?.includes('active timer session')) {
        await cancelMutation.mutateAsync().catch(() => {});
        const result = await startMutation.mutateAsync(data);
        const s = result?.data?.session || result?.session || result;
        setSession(s);
        sessionRef.current = s;
        return result;
      }
      // Revert if start genuinely failed
      setIsRunning(false);
      setElapsedTime(0);
      throw err;
    }
  }, [startMutation, cancelMutation]);

  const pauseTimerFn = useCallback(async () => {
    const current = localStartRef.current
      ? accumulatedRef.current + Math.max(0, Math.floor((Date.now() - localStartRef.current) / 1000))
      : elapsedTime;

    accumulatedRef.current = current;
    localStartRef.current = null;
    setElapsedTime(current);
    setIsRunning(false);
    setIsPaused(true);

    const sId = sessionRef.current?._id || session?._id;
    if (sId) {
      const result = await pauseMutation.mutateAsync(sId);
      const updated = result?.data?.session || result?.session || result;
      setSession(updated);
      sessionRef.current = updated;
      return result;
    }
  }, [session, pauseMutation, elapsedTime]);

  const resumeTimerFn = useCallback(async () => {
    localStartRef.current = Date.now();
    setIsRunning(true);
    setIsPaused(false);

    const sId = sessionRef.current?._id || session?._id;
    if (sId) {
      const result = await resumeMutation.mutateAsync(sId);
      const updated = result?.data?.session || result?.session || result;
      setSession(updated);
      sessionRef.current = updated;
      return result;
    }
  }, [session, resumeMutation]);

  const finishTimerFn = useCallback(async (data = {}) => {
    const current = localStartRef.current
      ? accumulatedRef.current + Math.max(0, Math.floor((Date.now() - localStartRef.current) / 1000))
      : elapsedTime;

    const sId = sessionRef.current?._id || session?._id;

    accumulatedRef.current = 0;
    localStartRef.current = null;
    setElapsedTime(0);
    setIsRunning(false);
    setIsPaused(false);
    setSession(null);
    sessionRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (sId) {
      return await finishMutation.mutateAsync({
        id: sId,
        data: {
          ...data,
          focusDuration: Math.max(1, Math.round(current / 60)),
        },
      });
    }
  }, [session, finishMutation, elapsedTime]);

  const resetTimer = useCallback(async () => {
    accumulatedRef.current = 0;
    localStartRef.current = null;
    setElapsedTime(0);
    setIsRunning(false);
    setIsPaused(false);
    setSession(null);
    sessionRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Cancel any active timer session on the server
    await cancelMutation.mutateAsync().catch(() => {});
  }, [cancelMutation]);

  return {
    elapsedTime,
    isRunning,
    isPaused,
    session,
    isActive: isRunning || isPaused,
    startTimer: startTimerFn,
    pauseTimer: pauseTimerFn,
    resumeTimer: resumeTimerFn,
    finishTimer: finishTimerFn,
    resetTimer,
    isStarting: startMutation.isPending,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isFinishing: finishMutation.isPending,
  };
}

export default useTimer;
