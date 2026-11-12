import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';
import { Bell, Shield } from 'lucide-react';

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
  const [quietHoursStart, setQuietHoursStart] = useState(user?.quietHoursStart || '23:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState(user?.quietHoursEnd || '07:00');
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
        quietHoursStart: quietHoursStart || null,
        quietHoursEnd: quietHoursEnd || null,
      });

      await checkAuth();
      toast.success('Notification preferences saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <span>Reminders &amp; Push Notifications</span>
        </CardTitle>
        <p className="text-xs text-text-secondary">
          Configure reminders for morning planning, evening review, and revision alerts. Note: Browser push notifications require explicit browser permission.
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSave} className="space-y-6 max-w-xl">
          {/* Master Push Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface/50 border border-border">
            <div>
              <span className="text-sm font-semibold text-text-primary block">
                Browser Push Notifications
              </span>
              <span className="text-xs text-text-secondary">
                {isSubscribed ? 'Device currently subscribed' : 'Opt-in for timely reminders'}
              </span>
            </div>
            <Switch checked={notificationsEnabled} onChange={handleTogglePush} aria-label="Browser Push Notifications" />
          </div>

          {/* Individual Alerts */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono block">
              Active Reminder Channels
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-border bg-surface/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">Morning Planning</span>
                  <Switch checked={morningActive} onChange={setMorningActive} aria-label="Morning Planning Reminder" />
                </div>
                <Input
                  type="time"
                  label="Reminder Time"
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">Evening Review</span>
                  <Switch checked={eveningActive} onChange={setEveningActive} aria-label="Evening Review Reminder" />
                </div>
                <Input
                  type="time"
                  label="Reminder Time"
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-primary block">Task Deadlines</span>
                  <span className="text-[11px] text-text-secondary">Alert for due tasks</span>
                </div>
                <Switch checked={taskDeadlineActive} onChange={setTaskDeadlineActive} aria-label="Task Deadlines Reminder" />
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-primary block">Revisions Due</span>
                  <span className="text-[11px] text-text-secondary">Spaced repetition alerts</span>
                </div>
                <Switch checked={revisionActive} onChange={setRevisionActive} aria-label="Revisions Due Reminder" />
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
                Quiet Hours (Do Not Disturb)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quiet Start"
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
              />
              <Input
                label="Quiet End"
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" loading={loading} size="sm" className="text-xs">
            Save Notification Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

