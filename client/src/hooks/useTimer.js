import { useTimerContext } from '@/contexts/TimerContext';

/**
 * useTimer hook
 * Connects to the global TimerContext singleton.
 * Persists across page switches (Today, Progress, Plan, Notes, Settings, Study)
 * and auto-saves to backend when finished.
 */
export function useTimer() {
  return useTimerContext();
}

export default useTimer;
