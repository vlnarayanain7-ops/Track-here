import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Play,
  Pause,
  Square,
  Clock,
  Target,
  Sun,
  Moon,
  MessageSquarePlus,
} from 'lucide-react';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import { useTimer } from '@/hooks/useTimer';
import { useNotifications, useNotificationsList, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { getTheme, toggleTheme } from '@/lib/theme';
import { cn, formatTimerDisplay, formatRelativeDate } from '@/lib/utils';

export default function Header({ onOpenSidebar, onOpenCommandPalette, onQuickAdd }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => getTheme());
  const notificationsRef = useRef(null);
  const quickAddRef = useRef(null);

  // Timer
  const { isRunning, isPaused, elapsedTime, pauseTimer, resumeTimer, finishTimer } = useTimer();

  // Notifications
  const { unreadCount } = useNotifications();
  const { data: notifications = [] } = useNotificationsList({ limit: 6 });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Handle outside click & escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) {
        setQuickAddOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setQuickAddOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleThemeToggle = () => {
    const next = toggleTheme();
    setCurrentTheme(next);
  };

  const quickAddKinds = [
    { kind: 'task', label: 'Task' },
    { kind: 'note', label: 'Note' },
    { kind: 'goal', label: 'Goal' },
    { kind: 'session', label: 'Focus session' },
    { kind: 'mock', label: 'Mock test' },
    { kind: 'problem', label: 'Problem' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--surface)] border-b border-[var(--line)] px-3 sm:px-6 flex items-center justify-between gap-3 select-none">
      {/* Left: Mobile Menu / Brand + Search Field */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg">
        {/* Menu Drawer Toggle on < 1024px */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Tile on < 768px */}
        <Link to="/" className="md:hidden flex items-center gap-2 font-heading font-bold text-base text-[var(--text)] shrink-0 mr-1">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <Target className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="truncate">Track Here</span>
        </Link>

        {/* Desktop / Tablet Full Search Field (opens Command Palette on Ctrl/Cmd+K) */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex w-full items-center justify-between px-3.5 h-[44px] rounded-[var(--r-md)] bg-[var(--surface)] border-[1.5px] border-[var(--line)] hover:border-[var(--primary)] hover:bg-[var(--surface-2)] text-[var(--muted)] transition-all duration-150 text-[13.5px] group text-left"
          aria-label="Search (Ctrl K)"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors shrink-0" />
            <span className="text-[var(--muted)] font-normal truncate">
              Search notes, tasks, problems
            </span>
          </div>
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--line)] text-[11px] font-mono text-[var(--muted)] shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        {/* Phone Icon-Only Search Button (< 768px) */}
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Search notes, tasks, problems"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Right Controls: Timer Pill + Quick Add + Notifications + Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Running Timer Pill — Visible only when timer is running/paused */}
        {(isRunning || isPaused) && (
          <div
            onClick={() => navigate('/study')}
            className="flex items-center gap-2 sm:gap-2.5 h-[44px] px-3 sm:px-4 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/40 text-[var(--primary)] cursor-pointer shadow-xs transition-all hover:brightness-105"
            title="Focus session active — click to view timer"
          >
            <Clock className="w-4 h-4 text-[var(--primary)] shrink-0 animate-pulse" />
            <span className="font-heading font-bold text-xs sm:text-sm tracking-tight">
              {formatTimerDisplay(elapsedTime)}
            </span>
            <div className="flex items-center gap-1 pl-1 border-l border-[var(--primary)]/30">
              {isRunning ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    pauseTimer();
                  }}
                  title="Pause timer"
                  aria-label="Pause timer"
                  className="p-1 hover:brightness-125 rounded"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resumeTimer();
                  }}
                  title="Resume timer"
                  aria-label="Resume timer"
                  className="p-1 hover:brightness-125 rounded"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  finishTimer();
                }}
                title="Finish and save session"
                aria-label="Finish and save session"
                className="p-1 text-[var(--danger)] hover:brightness-125 rounded"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Add Dropdown Menu (Hidden on phones < 768px where floating "+" button is used) */}
        <div className="relative hidden md:block" ref={quickAddRef}>
          <button
            type="button"
            onClick={() => setQuickAddOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={quickAddOpen}
            className="btn btn-primary h-[44px] text-[13.5px] font-semibold"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Quick add</span>
          </button>

          {quickAddOpen && (
            <div
              role="menu"
              className="card absolute right-0 mt-2 w-48 p-1.5 shadow-2xl z-50 animate-scale-in"
              style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              {quickAddKinds.map((item) => (
                <button
                  key={item.kind}
                  role="menuitem"
                  className="btn btn-ghost w-full justify-start text-[13px] font-medium min-h-[38px] px-3"
                  onClick={() => {
                    setQuickAddOpen(false);
                    onQuickAdd?.(item.kind);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell with Red Dot */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="w-[44px] h-[44px] rounded-[var(--r-md)] border-[1.5px] border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors relative flex items-center justify-center cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[var(--danger)] border-2 border-[var(--surface)]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="card absolute right-0 mt-2 w-80 p-3 shadow-2xl z-50 animate-scale-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--text)] font-heading">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-[12px] text-[var(--primary)] hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] py-6 text-center">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.read && markAsReadMutation.mutate(n._id)}
                      className={cn(
                        'p-2.5 rounded-xl text-xs transition-colors cursor-pointer border',
                        n.read
                          ? 'bg-[var(--surface-2)] border-transparent text-[var(--muted)]'
                          : 'bg-[var(--primary-soft)] border-[var(--primary)]/30 text-[var(--text)] font-medium'
                      )}
                    >
                      <p className="line-clamp-1">{n.title || n.message}</p>
                      <span className="text-[11px] text-[var(--muted)] font-mono">{formatRelativeDate(n.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Send Feedback Button */}
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="hidden sm:flex w-[44px] h-[44px] rounded-[var(--r-md)] border-[1.5px] border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors items-center justify-center cursor-pointer shadow-2xs"
          title="Send Beta Feedback"
          aria-label="Send Beta Feedback"
        >
          <MessageSquarePlus className="w-4.5 h-4.5" />
        </button>

        {/* 1-Click Theme Switcher (Light / Dark) */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className="w-[44px] h-[44px] rounded-[var(--r-md)] border-[1.5px] border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          title={`Switch to ${currentTheme === 'dark' ? 'Light (White)' : 'Dark'} Theme`}
          aria-label={`Switch to ${currentTheme === 'dark' ? 'Light (White)' : 'Dark'} Theme`}
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-[var(--warn)] hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors" />
          )}
        </button>

        {/* User Avatar Menu */}
        <Link
          to="/settings"
          className="w-[44px] h-[44px] rounded-full bg-[var(--surface-2)] border border-[var(--line)] text-[var(--primary)] font-heading font-bold flex items-center justify-center text-sm shadow-xs hover:border-[var(--primary)] transition-all shrink-0"
          title={user?.name || 'Account Settings'}
          aria-label="Account Settings"
        >
          {user?.name ? user.name[0].toUpperCase() : 'N'}
        </Link>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
