import { useState } from 'react';
import Switch from '@/components/ui/Switch';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

export default function NotificationSettings() {
  const { user, checkAuth } = useAuth();
  const { isSubscribed, subscribe, unsubscribe } = useNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    !!user?.notificationsEnabled
  );
  const [morningTime, setMorningTime] = useState(user?.morningReminderTime || '07:00');
  const [eveningTime, setEveningTime] = useState(user?.eveningReminderTime || '21:00');
  const [morningActive, setMorningActive] = useState(
    user?.activeNotifications?.morning ?? true
  );
  const [eveningActive, setEveningActive] = useState(
    user?.activeNotifications?.evening ?? true
  );
  const [taskDeadlineActive, setTaskDeadlineActive] = useState(
    user?.activeNotifications?.taskDeadline ?? true
  );
  const [revisionActive, setRevisionActive] = useState(
    user?.activeNotifications?.revision ?? true
  );
  const [loading, setLoading] = useState(false);

  const handleTogglePush = async (enable) => {
    setNotificationsEnabled(enable);
    if (enable) {
      const ok = await subscribe();
      if (!ok) {
        setNotificationsEnabled(false);
      }
    } else {
      await unsubscribe();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.updateSettings({
        notificationsEnabled,
        morningReminderTime: morningTime,
        eveningReminderTime: eveningTime,
        activeNotifications: {
          morning: morningActive,
          evening: eveningActive,
          taskDeadline: taskDeadlineActive,
          revision: revisionActive,
        },
      });

      await checkAuth();
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-xl select-none">
      <div className="card p-5 bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--line)]">
          <Bell className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-bold font-heading text-[var(--text)] tracking-tight">
            Reminders &amp; Alerts
          </h2>
        </div>

        {/* Clean list of notification channels */}
        <div className="divide-y divide-[var(--line)]/60 text-sm">
          {/* 1. Morning Planning */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <span className="font-medium text-[var(--text)] block text-xs">
                Morning Plan Reminder
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                Daily prompt to set your top 3 priorities
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={morningTime}
                onChange={(e) => setMorningTime(e.target.value)}
                className="h-8 px-2 text-xs rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"
              />
              <Switch checked={morningActive} onChange={setMorningActive} aria-label="Morning Planning Reminder" />
            </div>
          </div>

          {/* 2. Evening Review */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <span className="font-medium text-[var(--text)] block text-xs">
                Evening Review Reminder
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                Evening prompt to log reflections &amp; score day
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={eveningTime}
                onChange={(e) => setEveningTime(e.target.value)}
                className="h-8 px-2 text-xs rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--text)]"
              />
              <Switch checked={eveningActive} onChange={setEveningActive} aria-label="Evening Review Reminder" />
            </div>
          </div>

          {/* 3. Revisions Due */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <span className="font-medium text-[var(--text)] block text-xs">
                Spaced Revision Alerts
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                Notify when flashcards or review items are due
              </span>
            </div>
            <Switch checked={revisionActive} onChange={setRevisionActive} aria-label="Revisions Due Reminder" />
          </div>

          {/* 4. Task Deadlines */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <span className="font-medium text-[var(--text)] block text-xs">
                Task Deadlines
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                Alerts when scheduled tasks approach their due date
              </span>
            </div>
            <Switch checked={taskDeadlineActive} onChange={setTaskDeadlineActive} aria-label="Task Deadlines Reminder" />
          </div>

          {/* 5. Browser Push */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <span className="font-medium text-[var(--text)] block text-xs">
                Browser Push Notifications
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                {isSubscribed ? 'Subscribed on this device' : 'Allow notifications in your browser'}
              </span>
            </div>
            <Switch checked={notificationsEnabled} onChange={handleTogglePush} aria-label="Browser Push Notifications" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary h-9 px-4 text-xs font-semibold rounded-lg"
          >
            {loading ? 'Saving...' : 'Save Notifications'}
          </button>
        </div>
      </div>
    </form>
  );
}
