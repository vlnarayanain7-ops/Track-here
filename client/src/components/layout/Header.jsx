import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Flame,
  Sun,
  Moon,
  Laptop,
  Settings,
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

export default function Header({ onOpenCommandPalette, onQuickAdd }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => getTheme());

  const addMenuRef = useRef(null);
  const avatarMenuRef = useRef(null);

  // Timer
  const { isRunning, isPaused, elapsedTime, pauseTimer, resumeTimer, finishTimer } = useTimer();

  // Streak
  const { data: streakData } = useStreakData();
  const { data: analyticsData } = useAnalytics();
  const currentStreak = streakData?.currentStreak ?? analyticsData?.streaks?.currentStreak ?? 0;

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
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    { kind: 'goal', label: 'Subject / Goal' },
    { kind: 'mock', label: 'Mock test' },
    { kind: 'problem', label: 'Problem' },
  ];

  return (
    <header className="sticky top-0 z-30 h-14 bg-[var(--bg)] border-b border-[var(--line)] px-4 sm:px-8 flex items-center justify-between gap-3 select-none">
      {/* Brand on mobile (< 768px) where sidebar is hidden */}
      <div className="md:hidden flex items-center">
        <Link to="/" className="font-heading font-bold text-[17px] text-[var(--text)] tracking-tight">
          Track Here
        </Link>
      </div>

      {/* Right-aligned actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
        {/* Active Timer Pill */}
        {(isRunning || isPaused) && (
          <div
            onClick={() => navigate('/study')}
            className="flex items-center gap-2 h-9 px-3 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/30 text-[var(--primary)] cursor-pointer text-xs font-semibold shadow-2xs hover:brightness-105 transition-all"
            title="Focus session active — click to view timer"
          >
            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span className="font-mono tracking-tight font-bold">
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
                  className="p-1 hover:brightness-125 rounded"
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
                  className="p-1 hover:brightness-125 rounded"
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
                className="p-1 text-[var(--danger)] hover:brightness-125 rounded"
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
          className="btn-search w-9 h-9 rounded-lg border border-transparent hover:border-[var(--line)] hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Search (Ctrl K)"
          title="Search (Ctrl K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Streak chip (flame + number) */}
        <Link
          to="/progress"
          className="chipst flex items-center gap-1.5 h-9 px-3 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold text-xs transition-opacity hover:opacity-90"
          title={`${currentStreak}-day streak`}
          aria-label={`${currentStreak}-day streak`}
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>{currentStreak}</span>
        </Link>

        {/* Add menu */}
        <div className="relative" ref={addMenuRef}>
          <button
            type="button"
            onClick={() => setAddMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={addMenuOpen}
            className="btn-add h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          {addMenuOpen && (
            <div
              role="menu"
              className="card absolute right-0 mt-1.5 w-44 p-1 shadow-xl z-50 bg-[var(--surface)] border border-[var(--line)] rounded-xl animate-scale-in"
            >
              {quickAddKinds.map((item) => (
                <button
                  key={item.kind}
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] font-medium transition-colors"
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
            className="av w-9 h-9 rounded-full bg-[var(--text)] text-[var(--bg)] font-heading font-bold text-xs flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity border-0"
            aria-label="Account menu"
          >
            {user?.name ? user.name[0].toUpperCase() : 'N'}
          </button>

          {avatarMenuOpen && (
            <div
              role="menu"
              className="card absolute right-0 mt-1.5 w-60 p-1.5 shadow-xl z-50 bg-[var(--surface)] border border-[var(--line)] rounded-xl divide-y divide-[var(--line)] animate-scale-in"
            >
              {/* User info */}
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-[var(--text)] truncate">{user?.name || 'Scholar'}</p>
                <p className="text-[11px] text-[var(--muted)] truncate">{user?.email || ''}</p>
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
