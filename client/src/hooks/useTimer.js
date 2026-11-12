import { useState, useEffect, useRef, useCallback } from 'react';
import { useActiveTimer, useStartTimer, usePauseTimer, useResumeTimer, useFinishTimer } from './useStudySessions';

export function useTimer() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [session, setSession] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const accumulatedRef = useRef(0);

  const getElapsedSeconds = useCallback((timerSession, now = new Date()) => {
    const timerState = timerSession?.timerState;
    if (!timerState?.startedAt) return 0;
    if (timerState.status === 'paused') return timerState.accumulatedDuration || 0;
    const elapsed = Math.floor((now - new Date(timerState.startedAt)) / 1000);
    return Math.max(0, elapsed - (timerState.totalPausedDuration || 0));
  }, []);

  const activeTimerQuery = useActiveTimer();
  const startMutation = useStartTimer();
  const pauseMutation = usePauseTimer();
  const resumeMutation = useResumeTimer();
  const finishMutation = useFinishTimer();

  // Recover active timer on mount
  useEffect(() => {
    if (activeTimerQuery.data?.session) {
      const s = activeTimerQuery.data.session;
      setSession(s);

      const accumulated = getElapsedSeconds(s);
      accumulatedRef.current = accumulated;

      if (s.timerState?.status === 'running') {
        const startedAt = new Date(s.timerState?.startedAt || s.startTime);
        startTimeRef.current = startedAt;
        setIsRunning(true);
        setIsPaused(false);
      } else if (s.timerState?.status === 'paused') {
        setIsRunning(false);
        setIsPaused(true);
        setElapsedTime(accumulated);
      }
    }
  }, [activeTimerQuery.data, getElapsedSeconds]);

  // Tick interval
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(getElapsedSeconds(session));
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
  }, [isRunning, isPaused, session, getElapsedSeconds]);

  const startTimerFn = useCallback(async (data) => {
    const result = await startMutation.mutateAsync(data);
    const s = result?.data?.session || result?.session || result;
    setSession(s);
    startTimeRef.current = new Date(s.timerState?.startedAt || s.startTime);
    accumulatedRef.current = 0;
    setElapsedTime(0);
    setIsRunning(true);
    setIsPaused(false);
    return result;
  }, [startMutation]);

  const pauseTimerFn = useCallback(async () => {
    if (!session?._id) return;
    const result = await pauseMutation.mutateAsync(session._id);
    const updatedSession = result?.data?.session || result?.session || result;
    setSession(updatedSession);
    accumulatedRef.current = getElapsedSeconds(updatedSession);
    setElapsedTime(accumulatedRef.current);
    setIsRunning(false);
    setIsPaused(true);
    return result;
  }, [session, pauseMutation, getElapsedSeconds]);

  const resumeTimerFn = useCallback(async () => {
    if (!session?._id) return;
    const result = await resumeMutation.mutateAsync(session._id);
    const updatedSession = result?.data?.session || result?.session || result;
    setSession(updatedSession);
    accumulatedRef.current = getElapsedSeconds(updatedSession);
    startTimeRef.current = new Date(updatedSession.timerState?.startedAt || session.timerState?.startedAt);
    setIsRunning(true);
    setIsPaused(false);
    return result;
  }, [session, resumeMutation, getElapsedSeconds]);

  const finishTimerFn = useCallback(async (data = {}) => {
    if (!session?._id) return;
    const result = await finishMutation.mutateAsync({ id: session._id, data });
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setSession(null);
    accumulatedRef.current = 0;
    startTimeRef.current = null;
    return result;
  }, [session, finishMutation]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setSession(null);
    accumulatedRef.current = 0;
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

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
