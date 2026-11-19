import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePomodoro } from '@/hooks/usePomodoro';
import { enqueueOutbox } from '@/lib/outbox';
import { defaultSessionName } from '@/lib/sessionNames';
import { loadPrefs, savePrefs } from '@/components/study/TimerSettings';
import { chime } from '@/lib/chime';
import toast from 'react-hot-toast';

const TimerContext = createContext(null);
export function TimerProvider({ children }) {
  const { user } = useAuth();
  return <AccountTimer key={user?._id || user?.id} user={user}>{children}</AccountTimer>;
}
function AccountTimer({ children, user }) {
  const [prefs, setPreferences] = useState(loadPrefs);
  const [lastSaved, setLastSaved] = useState(null);
  const save = useCallback(async snapshot => {
    const subject = user?.subjects?.find(s => (s.id || s._id || s.name || s) === snapshot.subjectId);
    const category = subject?.name || (typeof subject === 'string' ? subject : snapshot.subjectId) || 'Focus';
    const payload = {
      topic: (snapshot.taskTitle || defaultSessionName(new Date(snapshot.startedAt), category)).slice(0, 80),
      category, durationSec: snapshot.durationSec, focusDuration: Math.round(snapshot.durationSec / 60),
      date: snapshot.startedAt, startedAt: snapshot.startedAt, source: 'timer',
      clientId: snapshot.clientId, completed: snapshot.completed,
      ...(snapshot.taskId ? { linkedTask: snapshot.taskId } : {}),
    };
    try {
      // Persist before advancing the timer. Every retry uses the same clientId.
      await enqueueOutbox({ endpoint: '/study-sessions', payload, ownerId: String(user._id || user.id) });
      setLastSaved({ ...payload, taskTitle: snapshot.taskTitle });
      toast.success('Session saved on this device. Sync status is in the header.');
    } catch (error) {
      toast.error('Could not save on this device. Timer paused; try Finish again.');
      throw error;
    }
  }, [user]);
  const phaseEnd = useCallback(phase => {
    if (phase === 'too-short') { toast('Study for at least one minute to save a session.'); return; }
    if (prefs.sound) chime();
    if (prefs.notify && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(phase === 'focus' ? 'Focus complete. Take a break.' : 'Break complete. Ready to focus?'); } catch { /* unsupported browser */ }
    }
  }, [prefs]);
  const timer = usePomodoro({ prefs, onSave: save, onPhaseEnd: phaseEnd });
  useEffect(() => {
    if (!timer.state.running) { document.title = 'Track Here'; return; }
    const seconds = Math.max(0, Math.ceil((timer.left ?? timer.elapsed) / 1000));
    document.title = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} ? ${timer.state.phase === 'focus' ? 'Focus' : 'Break'} ? Track Here`;
    return () => { document.title = 'Track Here'; };
  }, [timer.state.running, timer.left, timer.elapsed, timer.state.phase]);
  const setPrefs = value => { setPreferences(value); savePrefs(value); };
  return <TimerContext.Provider value={{ ...timer, prefs, setPrefs, lastSaved, dismissSaved: () => setLastSaved(null),
    isRunning: timer.state.running, isPaused: !timer.state.running && timer.state.accMs > 0,
    elapsedTime: Math.floor(timer.elapsed / 1000), pauseTimer: timer.pause, resumeTimer: timer.start, finishTimer: timer.finish,
  }}>{children}</TimerContext.Provider>;
}
export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('TimerProvider is required');
  return context;
}
