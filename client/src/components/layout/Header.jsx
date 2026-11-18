import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Flame,
  Sun,
  Moon,
  Laptop,
  Settings,
  Sun as TodayIcon,
  AlarmClock,
  ListTodo,
  FileText,
  BarChart3,
  LogOut,
  MessageSquarePlus,
  Clock,
  Pause,
  Play,
  Square,
} from 'lucide-react';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import { useStreakData, useAnalytics } from '@/hooks/useAnalytics';
import { useTimer } from '@/hooks/useTimer';
import { getTheme, setTheme } from '@/lib/theme';
import { cn, formatTimerDisplay } from '@/lib/utils';
import { getPendingOutboxCount } from '@/lib/outbox';

const NAV_ITEMS = [
  { to: '/',         label: 'Today',    Icon: TodayIcon },
  { to: '/study',    label: 'Focus',    Icon: AlarmClock },
  { to: '/plan',     label: 'Plan',     Icon: ListTodo },
  { to: '/notes',    label: 'Notes',    Icon: FileText },
  { to: '/progress', label: 'Progress', Icon: BarChart3 },
];

export default function Header({ onOpenCommandPalette, onQuickAdd }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => getTheme());
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingSync, setPendingSync] = useState(0);

  const addMenuRef = useRef(null);
  const avatarMenuRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const updateOutbox = async () => {
      const count = await getPendingOutboxCount();
      setPendingSync(count);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('th:outbox-changed', updateOutbox);
    updateOutbox();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('th:outbox-changed', updateOutbox);
    };
  }, []);

  // Timer
  const { isRunning, isPaused, elapsedTime, pauseTimer, resumeTimer, finishTimer } = useTimer();

  // Streak
  const { data: streakData } = useStreakData();
  const { data: analyticsData } = useAnalytics();
  const currentStreak = streakData?.currentStreak ?? analyticsData?.streaks?.currentStreak ?? 0;
  const isActiveToday = Boolean(
    streakData?.isActiveToday ??
    analyticsData?.streaks?.isActiveToday ??
    (analyticsData?.today?.studyMinutes >= 25)
  );
  const streakState = currentStreak === 0 ? 'idle' : isActiveToday ? 'lit' : 'risk';

  // Pop animation whenever streak updates (0 to 1, 1 to 2, or x to y)
  const [isPopping, setIsPopping] = useState(false);
  const prevStreakRef = useRef(null);

  useEffect(() => {
    if (prevStreakRef.current !== null && currentStreak !== prevStreakRef.current) {
      setIsPopping(true);
      const timer = setTimeout(() => setIsPopping(false), 600);
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = currentStreak;
  }, [currentStreak]);

  // Handle outside click & escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setAddMenuOpen(false);
      }
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAddMenuOpen(false);
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleThemeChange = (next) => {
    setTheme(next);
    setCurrentTheme(next);
  };

  const handleLogout = async () => {
    setAvatarMenuOpen(false);
    await logout();
    navigate('/signin');
  };

  const quickAddKinds = [
    { kind: 'task', label: 'Task' },
    { kind: 'session', label: 'Focus session' },
    { kind: 'note', label: 'Note' },
    { kind: 'goal', label: 'Subject' },
    { kind: 'problem', label: 'Problem' },
  ];

  return (
    <header className="sticky top-0 z-30 h-14 bg-[var(--bg)] border-b border-[var(--line)] px-4 sm:px-8 flex items-center justify-between gap-3 select-none">
      {/* Left: Brand + Nav tabs */}
      <div className="flex items-center gap-6">
        <Link to="/" className="font-heading font-bold text-[17px] text-[var(--text)] tracking-tight shrink-0">
          Track Here
        </Link>

        {/* Desktop nav tabs (hidden on mobile — MobileTabBar handles it) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right-aligned actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
        {/* Active Timer Pill */}
        {(isRunning || isPaused) && (
          <div
            onClick={() => navigate('/study')}
            className="flex items-center gap-2 h-8 px-2.5 rounded-[9px] bg-[var(--primary-soft)] text-[var(--primary)] cursor-pointer text-xs font-semibold shadow-2xs hover:brightness-105 transition-all"
            title="Focus session active — click to view timer"
          >
            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span className="font-mono tracking-tight font-bold text-xs">
              {formatTimerDisplay(elapsedTime)}
            </span>
            <div className="flex items-center gap-0.5 pl-1 border-l border-[var(--primary)]/30">
              {isRunning ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    pauseTimer();
                  }}
                  title="Pause"
                  className="p-1 hover:brightness-125 rounded-[6px]"
                >
                  <Pause className="w-3 h-3" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resumeTimer();
                  }}
                  title="Resume"
                  className="p-1 hover:brightness-125 rounded-[6px]"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  finishTimer();
                }}
                title="Finish"
                className="p-1 text-[var(--danger)] hover:brightness-125 rounded-[6px]"
              >
                <Square className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Search icon (opens Ctrl K) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="btn-search w-8 h-8 rounded-[9px] hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Search (Ctrl K)"
          title="Search (Ctrl K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Streak chip (3 states: idle, risk, lit) */}
        <Link
          to="/progress"
          className={cn(
            'flex items-center gap-1.5 h-8 px-2.5 rounded-[9px] text-xs font-bold transition-all cursor-pointer select-none',
            streakState === 'idle'
              ? 'text-[var(--muted)] hover:bg-[var(--surface-2)]'
              : 'text-[#F59E0B] hover:brightness-110',
            isPopping && 'scale-105'
          )}
          title={
            currentStreak === 0
              ? 'Start your streak today (25+ min)'
              : isActiveToday
              ? `${currentStreak}-day streak (kept today)`
              : `${currentStreak}-day streak (study 25 min to keep it)`
          }
          aria-label={`${currentStreak}-day streak`}
        >
          <Flame
            className={cn(
              'w-4 h-4 shrink-0',
              streakState === 'idle' ? 'text-[var(--muted)]' : 'text-[#F59E0B] fill-[#F59E0B]'
            )}
          />
          <span className="font-heading font-bold">{currentStreak}</span>
        </Link>

        {/* Add / New menu */}
        <div className="relative" ref={addMenuRef}>
          <button
            type="button"
            onClick={() => setAddMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={addMenuOpen}
            className="btn-add h-8 px-3 rounded-[9px] bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Quick Add (N)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New</span>
          </button>

          {addMenuOpen && (
            <div
              role="menu"
              className="card absolute right-0 mt-1.5 w-44 p-1 shadow-xl z-50 bg-[var(--surface)] border border-[var(--line)] rounded-[9px] animate-scale-in"
            >
              {quickAddKinds.map((item) => (
                <button
                  key={item.kind}
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-xs rounded-[6px] hover:bg-[var(--surface-2)] text-[var(--text)] font-medium transition-colors cursor-pointer"
                  onClick={() => {
                    setAddMenuOpen(false);
                    onQuickAdd?.(item.kind);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Avatar menu */}
        <div className="relative" ref={avatarMenuRef}>
          <button
            type="button"
            onClick={() => setAvatarMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={avatarMenuOpen}
            className="av w-8 h-8 rounded-[9px] bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] font-heading font-bold text-xs flex items-center justify-center cursor-pointer hover:border-[var(--muted)] transition-colors border-0"
            aria-label="Account menu"
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'LN'}
          </button>

          {avatarMenuOpen && (
            <div
              role="menu"
              className="card absolute right-0 mt-1.5 w-60 p-1.5 shadow-xl z-50 bg-[var(--surface)] border border-[var(--line)] rounded-[9px] divide-y divide-[var(--line)] animate-scale-in"
            >
              {/* User info */}
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-[var(--text)] truncate">{user?.name || 'Scholar'}</p>
                <p className="text-[11px] text-[var(--muted)] truncate">{user?.email || ''}</p>
              </div>

              {/* Offline ready / Sync status */}
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] bg-[var(--surface-2)]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      !isOnline || pendingSync > 0
                        ? 'bg-[var(--flame)] animate-pulse'
                        : 'bg-emerald-500'
                    )}
                  />
                  <span className="font-medium text-[var(--text)]">
                    {!isOnline || pendingSync > 0 ? 'Offline: changes will sync' : 'Offline ready'}
                  </span>
                </div>
                {pendingSync > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface)] text-[var(--muted)] font-mono">
                    {pendingSync} pending
                  </span>
                )}
              </div>

              {/* Theme selector: System, Light, Dark */}
              <div className="py-1.5 px-2">
                <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] font-heading mb-1">
                  Theme
                </p>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-colors',
                      currentTheme === 'system'
                        ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    )}
                  >
                    <Laptop className="w-3 h-3" />
                    <span>Auto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-colors',
                      currentTheme === 'light'
                        ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    )}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-colors',
                      currentTheme === 'dark'
                        ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    )}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              {/* Send feedback & Settings */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    setFeedbackOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2.5 font-medium transition-colors"
                >
                  <MessageSquarePlus className="w-4 h-4 text-[var(--muted)]" />
                  <span>Send feedback</span>
                </button>
                <Link
                  to="/settings"
                  onClick={() => setAvatarMenuOpen(false)}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2.5 font-medium transition-colors"
                >
                  <Settings className="w-4 h-4 text-[var(--muted)]" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Sign out */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-red-500/10 text-[var(--danger)] flex items-center gap-2.5 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
