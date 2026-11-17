import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useQueryClient } from '@tanstack/react-query';
import { createStudySession, updateStudySession, deleteStudySession } from '@/api/studySessions';
import api from '@/api/axios';
import { enqueueOutbox, generateClientId } from '@/lib/outbox';
import { defaultSessionName } from '@/lib/sessionNames';
import toast from 'react-hot-toast';

import PomodoroTimer from './PomodoroTimer';
import TimerSettings, { loadPrefs, savePrefs } from './TimerSettings';
import HistoryDrawer from './HistoryDrawer';
import TodaySessions from './TodaySessions';
import SessionForm from './SessionForm';

export default function StudyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  // User's subjects
  const subjects = useMemo(() => {
    if (!user?.subjects || !Array.isArray(user.subjects)) return [];
    return user.subjects.map((s) =>
      typeof s === 'string' ? { id: s, name: s, color: 'c1' } : { ...s, id: s.id || s._id || s.name }
    );
  }, [user]);

  const subjectsById = useMemo(() => {
    const map = {};
    for (const s of subjects) {
      if (s.id) map[s.id] = s;
      if (s._id) map[s._id] = s;
      if (s.name) map[s.name] = s;
    }
    return map;
  }, [subjects]);

  // Pomodoro preferences from localStorage ('th-pomo-prefs')
  const [prefs, setPrefs] = useState(loadPrefs);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('focus');

  // Study sessions query
  const { data, refetch } = useStudySessions({
    page: 1,
    limit: 200,
  });

  const sessions = useMemo(() => {
    return data?.data?.sessions || data?.sessions || [];
  }, [data]);

  // Filter today's sessions
  const todaySessions = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return sessions.filter((s) => {
      const raw = s.startedAt || s.date || s.startTime;
      if (!raw) return false;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return false;
      return (
        d.getFullYear() === todayYear &&
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate
      );
    });
  }, [sessions]);

  // Heartbeat: every 60 seconds, only while focus phase is running and tab is visible
  useEffect(() => {
    let heartbeatTimer = null;
    heartbeatTimer = setInterval(async () => {
      if (
        currentPhase === 'focus' &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      ) {
        try {
          await api.post('/study-sessions/timer/heartbeat');
        } catch {
          // offline/background safe
        }
      }
    }, 60000);

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    };
  }, [currentPhase]);

  // STEP 15.3: Session saving rules
  const handleSaveFocusBlock = useCallback(
    async (snapshot) => {
      const durSec = snapshot.durationSec;
      if (!durSec || durSec < 60) {
        toast('Session too short to save (under 1 minute)', { icon: '⏱️' });
        return;
      }

      const focusMins = Math.round(durSec / 60);
      const sessionDate = snapshot.startedAt ? new Date(snapshot.startedAt) : new Date();
      const topicName = defaultSessionName(sessionDate, snapshot.subjectId);

      const payload = {
        topic: topicName,
        category: snapshot.subjectId || 'Focus',
        durationSec: durSec,
        focusDuration: focusMins,
        duration: focusMins,
        date: sessionDate.toISOString(),
        startedAt: sessionDate.toISOString(),
        source: 'timer',
        clientId: snapshot.clientId || generateClientId('pomo'),
        completed: Boolean(snapshot.completed),
      };

      try {
        await createStudySession(payload);
        toast.success(`Focus block saved automatically (${focusMins}m)`);
      } catch (err) {
        // Enqueue to offline outbox if offline or server unreachable
        try {
          await enqueueOutbox({
            endpoint: '/study-sessions',
            method: 'POST',
            payload,
          });
          toast.success(`Saved automatically on this device (${focusMins}m)`);
        } catch {
          toast.error('Could not save focus session');
        }
      }

      // Invalidate queries so streak, heatmap and history update immediately
      qc.invalidateQueries({ queryKey: ['studySessions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['streakData'] });
      refetch();
    },
    [qc, refetch]
  );

  // Rename session from History
  const handleRenameSession = async (id, newTopic) => {
    try {
      await updateStudySession(id, { topic: newTopic });
      toast.success('Session renamed');
      refetch();
      qc.invalidateQueries({ queryKey: ['studySessions'] });
    } catch {
      toast.error('Failed to rename session');
    }
  };

  // Delete session from History (called after 5s without undo)
  const handleDeleteSession = async (id) => {
    try {
      await deleteStudySession(id);
      refetch();
      qc.invalidateQueries({ queryKey: ['studySessions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['streakData'] });
    } catch {
      toast.error('Failed to delete session');
    }
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-6">
      {/* Pomodoro Timer Engine & UI */}
      <PomodoroTimer
        subjects={subjects}
        prefs={prefs}
        onSave={handleSaveFocusBlock}
        onOpenSettings={() => setSettingsOpen(true)}
        onPhaseChange={setCurrentPhase}
      />

      {/* Today's Sessions Section */}
      <TodaySessions
        sessions={todaySessions}
        subjectsById={subjectsById}
        onHistory={() => setHistoryOpen(true)}
      />

      {/* Timer Settings Popover */}
      <TimerSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={prefs}
        onChangePrefs={(newPrefs) => {
          setPrefs(newPrefs);
          savePrefs(newPrefs);
        }}
      />

      {/* Wide 520px History Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        subjects={subjects}
        onRename={handleRenameSession}
        onDelete={handleDeleteSession}
        onAddPastSession={() => {
          setSessionToEdit(null);
          setIsFormOpen(true);
        }}
        onStartFocus={() => {
          // Focus screen is active behind drawer
        }}
      />

      {/* Modal Dialog for manually logging / editing past sessions */}
      <SessionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSessionToEdit(null);
          refetch();
        }}
        sessionToEdit={sessionToEdit}
      />
    </div>
  );
}
