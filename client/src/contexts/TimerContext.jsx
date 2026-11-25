import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePomodoro } from '@/hooks/usePomodoro';
import api from '@/api/axios';
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
  const owner = user?._id || user?.id;
  const remoteKey = 'th-verified-timer:' + owner;
  const onlineTimer = useRef(null);
  useEffect(() => {
    try { onlineTimer.current = JSON.parse(localStorage.getItem(remoteKey)); } catch { /* storage unavailable */ }
  }, [remoteKey]);
  const rememberRemote = useCallback(remote => {
    onlineTimer.current = remote;
    try {
      if (remote) localStorage.setItem(remoteKey, JSON.stringify(remote));
      else localStorage.removeItem(remoteKey);
    } catch { /* local timer state can reconnect by clientId */ }
    return remote;
  }, [remoteKey]);
  const requests = useRef(Promise.resolve());
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
      await requests.current;
      const remote = onlineTimer.current;
      if (remote?.clientId === snapshot.clientId) {
        try {
          await api.post('/study-sessions/timer/' + remote.id + '/finish', payload, { timeout: 5000, headers: { 'X-Account-Id': String(user._id || user.id) } });
          rememberRemote(null);
          setLastSaved(payload);
          window.dispatchEvent(new Event('th:outbox-changed'));
          toast.success('Focus session saved.');
          return;
        } catch {
          // Retry durably by clientId, including when the finish response was lost.
          rememberRemote(null);
        }
      }
      // Persist before advancing the timer. Every retry uses the same clientId.
      await enqueueOutbox({ endpoint: '/study-sessions', payload, ownerId: String(user._id || user.id) });
      setLastSaved({ ...payload, taskTitle: snapshot.taskTitle });
      toast.success('Session saved on this device. Sync status is in the header.');
    } catch (error) {
      toast.error('Could not save on this device. Timer paused; try Finish again.');
      throw error;
    }
  }, [user, rememberRemote]);
  const phaseEnd = useCallback(phase => {
    if (phase === 'too-short') { toast('Study for at least one minute to save a session.'); return; }
    if (prefs.sound) chime();
    if (prefs.notify && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(phase === 'focus' ? 'Focus complete. Take a break.' : 'Break complete. Ready to focus?'); } catch { /* unsupported browser */ }
    }
  }, [prefs]);
  const timer = usePomodoro({ prefs, onSave: save, onPhaseEnd: phaseEnd });
  const { phase, clientId, running } = timer.state;
  useEffect(() => {
    if (!owner) return;
    let disposed = false;
    const sync = async () => {
      if (disposed) return;
      const options = { timeout: 5000, headers: { 'X-Account-Id': String(owner) } };
      let remote = onlineTimer.current;
      if (remote && (remote.clientId !== clientId || phase !== 'focus')) {
        const endpoint = '/study-sessions/timer/' + remote.id + '/cancel';
        try { await api.post(endpoint, {}, options); }
        catch { await enqueueOutbox({ endpoint, ownerId: String(owner), clientId: remote.id }); }
        rememberRemote(null);
        remote = null;
      }
      if (!clientId || phase !== 'focus') return;
      if (!remote && !running) {
        const response = await api.get('/study-sessions/timer/active', options);
        const session = response.data.data.session;
        if (session?.clientId === clientId) remote = rememberRemote({ id: session._id, clientId, running: session.timerState.status === 'running' });
      }
      if (!remote && running) {
        const response = await api.post('/study-sessions/timer/start', { clientId }, options);
        const session = response.data.data.session;
        remote = rememberRemote({ id: session._id, clientId, running: session.timerState.status === 'running' });
      }
      if (!remote) return;
      const endpoint = '/study-sessions/timer/' + remote.id;
      if (remote.running !== running) {
        await api.post(endpoint + (running ? '/resume' : '/pause'), {}, options);
        rememberRemote({ ...remote, running });
      } else if (running) {
        await api.post(endpoint + '/heartbeat', {}, options);
      }
    };
    const schedule = () => { requests.current = requests.current.then(sync).catch(() => {}); };
    schedule();
    const interval = setInterval(schedule, 45000);
    return () => { disposed = true; clearInterval(interval); };
  }, [owner, clientId, phase, running, rememberRemote]);
  useEffect(() => {
    if (!timer.state.running) { document.title = 'Track Here'; return; }
    const seconds = Math.max(0, Math.ceil((timer.left ?? timer.elapsed) / 1000));
    document.title = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ${timer.state.phase === 'focus' ? 'Focus' : 'Break'} · Track Here`;
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
