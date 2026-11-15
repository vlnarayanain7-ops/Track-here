import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import { getTheme, setTheme } from '@/lib/theme';
import {
  X,
  AlertTriangle,
  BookOpen,
  Bell,
  Palette,
  User as UserIcon,
  Check,
  Edit2,
  Download,
  Trash2,
  Clock,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();

  // Save indicator
  const [savingState, setSavingState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const saveTimeoutRef = useRef(null);

  const markSaved = () => {
    setSavingState('saved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSavingState('idle'), 2500);
  };

  // Section 1: Study
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalValue, setGoalValue] = useState(user?.preparationType || user?.examName || 'Coding interviews');
  const [targetDateValue, setTargetDateValue] = useState(
    user?.targetExamDate
      ? new Date(user.targetExamDate).toISOString().split('T')[0]
      : user?.examDate
      ? new Date(user.examDate).toISOString().split('T')[0]
      : ''
  );
  const currentDailyTarget = `${Math.round((user?.dailyStudyGoal || 240) / 60)}h`;
  const [dailyTarget, setDailyTarget] = useState(
    ['2h', '3h', '4h', '6h'].includes(currentDailyTarget) ? currentDailyTarget : '4h'
  );
  const [weekStartsOn, setWeekStartsOn] = useState(user?.weekStartsOn === 0 ? 'Sun' : 'Mon');

  // Section 2: Reminders
  const [remindersOn, setRemindersOn] = useState(
    Boolean(user?.activeNotifications?.dailyReminder || user?.morningReminderActive || false)
  );
  const [morningTime, setMorningTime] = useState(user?.morningReminderTime || '07:00');
  const [eveningTime, setEveningTime] = useState(user?.eveningReminderTime || '21:00');

  // Section 3: Appearance
  const [themeValue, setThemeValue] = useState(() => {
    const t = getTheme();
    if (t === 'dark') return 'Dark';
    if (t === 'light') return 'Light';
    return 'System';
  });

  // Section 4: Account
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  // Sync initial user state
  useEffect(() => {
    if (user) {
      setGoalValue(user.preparationType || user.examName || 'Coding interviews');
      setTargetDateValue(
        user.targetExamDate
          ? new Date(user.targetExamDate).toISOString().split('T')[0]
          : user.examDate
          ? new Date(user.examDate).toISOString().split('T')[0]
          : ''
      );
      const hStr = `${Math.round((user.dailyStudyGoal || 240) / 60)}h`;
      setDailyTarget(['2h', '3h', '4h', '6h'].includes(hStr) ? hStr : '4h');
      setWeekStartsOn(user.weekStartsOn === 0 ? 'Sun' : 'Mon');
      setRemindersOn(Boolean(user.activeNotifications?.dailyReminder || user.morningReminderActive));
      setMorningTime(user.morningReminderTime || '07:00');
      setEveningTime(user.eveningReminderTime || '21:00');
      setNameValue(user.name || '');
    }
  }, [user]);

  // Generic autosave helper
  const saveProfileChange = async (fields) => {
    setSavingState('saving');
    try {
      await usersApi.updateProfile(fields);
      await checkAuth();
      markSaved();
    } catch {
      setSavingState('idle');
      toast.error('Failed to save changes');
    }
  };

  const saveSettingsChange = async (fields) => {
    setSavingState('saving');
    try {
      await usersApi.updateSettings(fields);
      await checkAuth();
      markSaved();
    } catch {
      setSavingState('idle');
      toast.error('Failed to save settings');
    }
  };

  // Study actions
  const handleSaveGoal = async () => {
    setEditingGoal(false);
    const trimmed = goalValue.trim() || 'Coding interviews';
    setGoalValue(trimmed);
    await saveProfileChange({ preparationType: trimmed, examName: trimmed });
  };

  const handleSaveTargetDate = async (val) => {
    setTargetDateValue(val);
    await saveProfileChange({
      targetExamDate: val ? new Date(val) : null,
      examDate: val ? new Date(val) : null,
    });
  };

  const handleSelectDailyTarget = async (tgt) => {
    setDailyTarget(tgt);
    const hours = parseInt(tgt, 10) || 4;
    await saveProfileChange({ dailyStudyGoal: hours * 60 });
  };

  const handleSelectWeekStartsOn = async (val) => {
    setWeekStartsOn(val);
    await saveSettingsChange({ weekStartsOn: val === 'Sun' ? 0 : 1 });
  };

  // Reminder actions
  const handleToggleReminders = async () => {
    const next = !remindersOn;
    if (next && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          toast.error('Browser notifications were not granted');
        }
      }
    }
    setRemindersOn(next);
    await saveSettingsChange({
      notificationsEnabled: next,
      morningReminderActive: next,
      activeNotifications: {
        ...(user?.activeNotifications || {}),
        dailyReminder: next,
        morning: next,
        evening: next,
      },
    });
  };

  const handleSaveMorningTime = async (val) => {
    setMorningTime(val);
    await saveSettingsChange({ morningReminderTime: val });
  };

  const handleSaveEveningTime = async (val) => {
    setEveningTime(val);
    await saveSettingsChange({ eveningReminderTime: val });
  };

  // Appearance actions
  const handleSelectTheme = (t) => {
    setThemeValue(t);
    if (t === 'System') {
      localStorage.removeItem('th-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      setTheme(t.toLowerCase());
    }
    saveSettingsChange({ theme: t === 'System' ? 'dark' : t.toLowerCase() });
  };

  // Account actions
  const handleSaveName = async () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(user?.name || '');
      return;
    }
    await saveProfileChange({ name: trimmed });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await usersApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trackhere-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await usersApi.importData(parsed);
      await checkAuth();
      toast.success('Data restored successfully');
    } catch {
      toast.error('Failed to restore data. Check JSON file format.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }
    setDeleting(true);
    try {
      await usersApi.deleteAccount({ password: deletePassword });
      toast.success('Account permanently deleted');
      await logout();
      navigate('/signin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="max-w-[680px] mx-auto px-4 sm:px-6 py-8 animate-fade-in text-[var(--tx)] space-y-7">
      {/* Header with Autosave status */}
      <div className="flex items-baseline justify-between border-b border-[var(--ln)] pb-4">
        <div>
          <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--tx)] m-0">Settings</h1>
          <p className="text-xs text-[var(--mu)] mt-1 flex items-center gap-2">
            <span>Changes save automatically.</span>
            {savingState === 'saving' && <span className="text-[var(--mu)] font-medium animate-pulse">Saving...</span>}
            {savingState === 'saved' && (
              <span className="text-[var(--pr)] font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* SECTION 1: STUDY */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--mu)]">
          <BookOpen className="w-4 h-4 text-[var(--pr)]" />
          <span>Study</span>
        </div>

        <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] shadow-xs divide-y divide-[var(--ln)] overflow-hidden">
          {/* Goal */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Goal</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Shown on your Today dashboard</div>
            </div>
            <div className="shrink-0">
              {editingGoal ? (
                <input
                  type="text"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  onBlur={handleSaveGoal}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveGoal();
                    if (e.key === 'Escape') setEditingGoal(false);
                  }}
                  autoFocus
                  className="h-9 px-3 rounded-xl border border-[var(--pr)] bg-[var(--sf)] text-xs font-medium text-[var(--tx)] focus:outline-none w-48 shadow-xs"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingGoal(true)}
                  className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[var(--ln)] bg-[var(--sf2)] hover:bg-[var(--sf)] hover:border-[var(--line)] text-xs font-medium text-[var(--tx)] transition-all cursor-pointer"
                  title="Click to edit goal"
                >
                  <span className="max-w-[150px] truncate">{goalValue || 'Set goal'}</span>
                  <Edit2 className="w-3 h-3 text-[var(--mu)] shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* Target Date */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Target date</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Optional exam or completion deadline</div>
            </div>
            <div className="shrink-0">
              <input
                type="date"
                value={targetDateValue}
                onChange={(e) => handleSaveTargetDate(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[var(--ln)] bg-[var(--sf2)] text-xs font-medium text-[var(--tx)] focus:border-[var(--pr)] focus:bg-[var(--sf)] focus:outline-none transition-all cursor-pointer"
                aria-label="Target date"
              />
            </div>
          </div>

          {/* Daily Target */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Daily target</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Focus hours target per day</div>
            </div>
            <div className="shrink-0">
              <div className="inline-flex items-center p-1 rounded-xl bg-[var(--sf2)] border border-[var(--ln)]" role="group" aria-label="Daily target">
                {['2h', '3h', '4h', '6h'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    aria-pressed={dailyTarget === h}
                    onClick={() => handleSelectDailyTarget(h)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                      dailyTarget === h
                        ? 'bg-[var(--sf)] text-[var(--tx)] shadow-xs font-semibold'
                        : 'text-[var(--mu)] hover:text-[var(--tx)]'
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Week starts on */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Week starts on</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Starting day in Timetable and Heatmap</div>
            </div>
            <div className="shrink-0">
              <div className="inline-flex items-center p-1 rounded-xl bg-[var(--sf2)] border border-[var(--ln)]" role="group" aria-label="Week starts on">
                {['Mon', 'Sun'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={weekStartsOn === d}
                    onClick={() => handleSelectWeekStartsOn(d)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                      weekStartsOn === d
                        ? 'bg-[var(--sf)] text-[var(--tx)] shadow-xs font-semibold'
                        : 'text-[var(--mu)] hover:text-[var(--tx)]'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: REMINDERS */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--mu)]">
          <Bell className="w-4 h-4 text-[var(--pr)]" />
          <span>Reminders</span>
        </div>

        <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] shadow-xs divide-y divide-[var(--ln)] overflow-hidden">
          {/* Daily reminders switch */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Daily reminders</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Morning plan prompt and evening review</div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                className="sw"
                role="switch"
                aria-checked={remindersOn}
                aria-label="Daily reminders"
                onClick={handleToggleReminders}
              />
            </div>
          </div>

          {/* Morning time */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Morning plan reminder</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Time for your daily intention check-in</div>
            </div>
            <div className="shrink-0">
              <input
                type="time"
                value={morningTime}
                onChange={(e) => handleSaveMorningTime(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[var(--ln)] bg-[var(--sf2)] text-xs font-medium text-[var(--tx)] focus:border-[var(--pr)] focus:bg-[var(--sf)] focus:outline-none transition-all cursor-pointer"
                aria-label="Morning reminder time"
              />
            </div>
          </div>

          {/* Evening time */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Evening review reminder</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Time to reflect and close out your day</div>
            </div>
            <div className="shrink-0">
              <input
                type="time"
                value={eveningTime}
                onChange={(e) => handleSaveEveningTime(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[var(--ln)] bg-[var(--sf2)] text-xs font-medium text-[var(--tx)] focus:border-[var(--pr)] focus:bg-[var(--sf)] focus:outline-none transition-all cursor-pointer"
                aria-label="Evening reminder time"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: APPEARANCE */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--mu)]">
          <Palette className="w-4 h-4 text-[var(--pr)]" />
          <span>Appearance</span>
        </div>

        <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] shadow-xs divide-y divide-[var(--ln)] overflow-hidden">
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Theme</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Choose your interface appearance</div>
            </div>
            <div className="shrink-0">
              <div className="inline-flex items-center p-1 rounded-xl bg-[var(--sf2)] border border-[var(--ln)]" role="group" aria-label="Theme">
                {['System', 'Light', 'Dark'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={themeValue === t}
                    onClick={() => handleSelectTheme(t)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                      themeValue === t
                        ? 'bg-[var(--sf)] text-[var(--tx)] shadow-xs font-semibold'
                        : 'text-[var(--mu)] hover:text-[var(--tx)]'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ACCOUNT */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--mu)]">
          <UserIcon className="w-4 h-4 text-[var(--pr)]" />
          <span>Account</span>
        </div>

        <div className="rounded-2xl border border-[var(--ln)] bg-[var(--sf)] shadow-xs divide-y divide-[var(--ln)] overflow-hidden">
          {/* Name */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Name</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Your display name across the app</div>
            </div>
            <div className="shrink-0">
              {editingName ? (
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  autoFocus
                  className="h-9 px-3 rounded-xl border border-[var(--pr)] bg-[var(--sf)] text-xs font-medium text-[var(--tx)] focus:outline-none w-44 shadow-xs"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-[var(--ln)] bg-[var(--sf2)] hover:bg-[var(--sf)] hover:border-[var(--line)] text-xs font-medium text-[var(--tx)] transition-all cursor-pointer"
                  title="Click to edit name"
                >
                  <span>{nameValue || 'Add name'}</span>
                  <Edit2 className="w-3 h-3 text-[var(--mu)] shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Email</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Registered account address</div>
            </div>
            <div className="shrink-0">
              <span className="font-mono text-xs text-[var(--mu)] bg-[var(--sf2)] px-2.5 py-1 rounded-lg border border-[var(--ln)]">
                {user?.email || '—'}
              </span>
            </div>
          </div>

          {/* Age group */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Age group</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Safety & privacy band</div>
            </div>
            <div className="shrink-0">
              <span className="text-xs font-medium text-[var(--mu)] bg-[var(--sf2)] px-2.5 py-1 rounded-lg border border-[var(--ln)]">
                {user?.ageBand === '13_17' ? '13 – 17' : '18+'}
              </span>
            </div>
          </div>

          {/* Your data (Export + small More link for restore) */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--tx)]">Your data</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Download full JSON archive or restore backup</div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[var(--ln)] bg-[var(--sf2)] hover:bg-[var(--sf)] hover:border-[var(--line)] text-xs font-medium text-[var(--tx)] transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[var(--mu)]" />
                <span>{exporting ? 'Exporting...' : 'Export data'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="text-xs text-[var(--mu)] hover:text-[var(--tx)] hover:underline px-2 py-1 cursor-pointer bg-transparent border-0"
                title="Restore from JSON backup"
              >
                {importing ? 'Restoring...' : 'Restore backup'}
              </button>
            </div>
          </div>

          {/* Delete account */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--danger)]">Delete account</div>
              <div className="text-xs text-[var(--mu)] mt-0.5">Permanently delete account and all data</div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/15 text-xs font-medium text-[var(--danger)] transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-[var(--danger)]" />
                <span>Delete account</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Account Password Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--sf)] border border-[var(--ln)] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-bold text-[var(--danger)]">
                <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
                <span>Delete Account</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="text-[var(--mu)] hover:text-[var(--tx)] p-1 rounded-lg hover:bg-[var(--sf2)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--mu)] leading-relaxed">
              This will permanently delete your account, study history, timetable, notes, tasks, and streaks. This action cannot be reversed.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-[var(--tx)] mb-1">
                  Confirm your password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-10 px-3 rounded-xl border border-[var(--ln)] bg-[var(--sf2)] text-xs text-[var(--tx)] focus:outline-none focus:border-[var(--danger)]"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-[var(--ln)] bg-[var(--sf2)] text-xs font-medium text-[var(--tx)] hover:bg-[var(--sf)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="h-9 px-4 rounded-xl bg-[var(--danger)] text-white text-xs font-medium hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {deleting ? 'Deleting...' : 'Delete permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
