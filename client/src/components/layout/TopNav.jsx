import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  Timer,
  CheckSquare,
  FileText,
  CalendarCheck,
  RotateCcw,
  Flame,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Plus,
  Bell,
  Play,
  Pause,
  Square,
  CheckCheck,
  Check,
  Layers,
  Calendar,
  Award,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTimer } from '@/hooks/useTimer';
import { useNotifications, useNotificationsList, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { useAnalytics } from '@/hooks/useAnalytics';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn, formatTimerDisplay, formatRelativeDate } from '@/lib/utils';

export default function TopNav({ onOpenCommandPalette, onQuickAdd }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dropdown states
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Refs for click outside
  const workspaceRef = useRef(null);
  const progressRef = useRef(null);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  // Timer
  const { isRunning, isPaused, elapsedTime, pauseTimer, resumeTimer, finishTimer } = useTimer();

  // Notifications
  const { unreadCount } = useNotifications();
  const { data: notifications = [] } = useNotificationsList({ limit: 8 });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Daily goal stats
  const { data: analyticsData } = useAnalytics();
  const todayMinutes = analyticsData?.today?.focusMinutes || 0;
  const goalMinutes = user?.dailyStudyGoal || 240;
  const goalPercent = Math.min(100, Math.round((todayMinutes / Math.max(1, goalMinutes)) * 100));

  // Exam countdown calculation
  const daysToExam = user?.examDate
    ? Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Close dropdowns on path change
  useEffect(() => {
    setWorkspaceOpen(false);
    setProgressOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target)) {
        setWorkspaceOpen(false);
      }
      if (progressRef.current && !progressRef.current.contains(e.target)) {
        setProgressOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isWorkspaceActive = ['/notes', '/accountability'].some((p) =>
    location.pathname.startsWith(p)
  );

  const isProgressActive = ['/revisions', '/streaks', '/analytics'].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <header className="sticky top-0 z-40 h-14 bg-nav/90 backdrop-blur-2xl border-b border-border/80 select-none">
      {/* 1px glowing line at very top */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand + Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-3 md:gap-5 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 py-1 px-1.5 rounded-xl hover:bg-surface/60 transition-colors shrink-0 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/40 flex items-center justify-center text-accent shadow-sm group-hover:border-accent transition-colors">
              <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-text-primary tracking-tight text-sm flex items-center gap-1.5">
                <span>Track Here</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-accent font-mono font-bold tracking-wider uppercase">
                  OS
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5',
                  isActive
                    ? 'bg-surface text-accent font-semibold shadow-xs border border-border/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                )
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/study"
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5',
                  isActive
                    ? 'bg-surface text-accent font-semibold shadow-xs border border-border/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                )
              }
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Study</span>
            </NavLink>

            <NavLink
              to="/subjects"
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5',
                  isActive
                    ? 'bg-surface text-accent font-semibold shadow-xs border border-border/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                )
              }
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Syllabus</span>
            </NavLink>

            <NavLink
              to="/timetable"
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5',
                  isActive
                    ? 'bg-surface text-accent font-semibold shadow-xs border border-border/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                )
              }
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timetable</span>
            </NavLink>

            <NavLink
              to="/practice"
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5',
                  isActive
                    ? 'bg-surface text-accent font-semibold shadow-xs border border-border/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                )
              }
            >
              <Award className="w-3.5 h-3.5" />
              <span>Practice</span>
            </NavLink>

            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5',
                  isActive
                    ? 'bg-surface text-accent font-semibold shadow-xs border border-border/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                )
              }
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks</span>
            </NavLink>

            {/* Workspace Dropdown */}
            <div className="relative" ref={workspaceRef}>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceOpen((prev) => !prev);
                  setProgressOpen(false);
                }}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5',
                  isWorkspaceActive || workspaceOpen
                    ? 'bg-surface text-accent font-semibold border border-border/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                )}
              >
                <span>Workspace</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform duration-200',
                    workspaceOpen && 'rotate-180 text-accent'
                  )}
                />
              </button>

              {workspaceOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-1.5 shadow-dropdown animate-scale-in z-50">
                  <Link
                    to="/notes"
                    onClick={() => setWorkspaceOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors',
                      location.pathname.startsWith('/notes')
                        ? 'bg-surface text-accent font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/70'
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-purple/10 border border-purple/30 flex items-center justify-center text-purple">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">Notes</div>
                      <div className="text-[10px] text-text-muted">Markdown & Rich-text notes</div>
                    </div>
                  </Link>
                  <Link
                    to="/accountability"
                    onClick={() => setWorkspaceOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mt-0.5',
                      location.pathname.startsWith('/accountability')
                        ? 'bg-surface text-accent font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/70'
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-success/10 border border-success/30 flex items-center justify-center text-success">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">Accountability</div>
                      <div className="text-[10px] text-text-muted">Morning plan & evening review</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Progress Dropdown */}
            <div className="relative" ref={progressRef}>
              <button
                type="button"
                onClick={() => {
                  setProgressOpen((prev) => !prev);
                  setWorkspaceOpen(false);
                }}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5',
                  isProgressActive || progressOpen
                    ? 'bg-surface text-accent font-semibold border border-border/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                )}
              >
                <span>Progress</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform duration-200',
                    progressOpen && 'rotate-180 text-accent'
                  )}
                />
              </button>

              {progressOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-1.5 shadow-dropdown animate-scale-in z-50">
                  <Link
                    to="/revisions"
                    onClick={() => setProgressOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors',
                      location.pathname.startsWith('/revisions')
                        ? 'bg-surface text-accent font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/70'
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-warning/10 border border-warning/30 flex items-center justify-center text-warning">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">Revisions</div>
                      <div className="text-[10px] text-text-muted">Spaced interval management</div>
                    </div>
                  </Link>
                  <Link
                    to="/streaks"
                    onClick={() => setProgressOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mt-0.5',
                      location.pathname.startsWith('/streaks')
                        ? 'bg-surface text-accent font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/70'
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">Streaks & Heatmap</div>
                      <div className="text-[10px] text-text-muted">Study consistency tracking</div>
                    </div>
                  </Link>
                  <Link
                    to="/analytics"
                    onClick={() => setProgressOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mt-0.5',
                      location.pathname.startsWith('/analytics')
                        ? 'bg-surface text-accent font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/70'
                    )}
                  >
                    <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">Analytics</div>
                      <div className="text-[10px] text-text-muted">Hours & topic breakdown</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Target Exam Countdown Pill */}
          {daysToExam !== null && daysToExam >= 0 && (
            <Link
              to="/timetable"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/25 text-xs text-accent hover:bg-accent/20 transition-all hover:border-accent/40 shadow-xs"
              title={`${user?.examName || 'Target Exam'}: ${daysToExam} days remaining`}
            >
              <Sparkles className="w-3 h-3 text-accent shrink-0 animate-pulse" />
              <span className="font-mono font-bold tracking-tight">{daysToExam}d</span>
              <span className="text-[11px] text-text-secondary truncate max-w-[90px]">
                {user?.examName || 'to Exam'}
              </span>
            </Link>
          )}

          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface/70 border border-border/80 text-text-muted hover:text-text-primary hover:border-border-light hover:bg-surface transition-colors text-xs"
            title="Search anything (⌘K / Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-secondary font-normal">Search...</span>
            <kbd className="px-1.5 py-0.2 rounded bg-card border border-border text-[10px] font-mono text-text-muted">
              ⌘K
            </kbd>
          </button>

          {/* Active Timer Pill */}
          {(isRunning || isPaused) && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-surface/90 border border-accent/40 text-xs shadow-glow-accent animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    isRunning ? 'bg-success' : 'bg-warning'
                  )}
                />
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    isRunning ? 'bg-success' : 'bg-warning'
                  )}
                />
              </span>
              <span className="font-mono font-bold text-text-primary tracking-tight">
                {formatTimerDisplay(elapsedTime)}
              </span>
              {isRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause timer"
                  className="p-1 hover:text-accent rounded transition-colors text-text-secondary hover:bg-card"
                >
                  <Pause className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  title="Resume timer"
                  className="p-1 hover:text-success rounded transition-colors text-text-secondary hover:bg-card"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => finishTimer()}
                title="Finish session"
                className="p-1 hover:text-danger rounded transition-colors text-text-secondary hover:bg-card"
              >
                <Square className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Daily Goal Mini Circular Ring */}
          <div
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface/50 border border-border/80 text-xs shadow-xs"
            title={`Today's Focus Goal: ${Math.round(todayMinutes / 60)}h ${todayMinutes % 60}m of ${Math.round(goalMinutes / 60)}h (${goalPercent}%)`}
          >
            <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 transform -rotate-90">
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-border"
                  fill="transparent"
                />
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={goalPercent >= 100 ? 'text-success' : 'text-accent'}
                  fill="transparent"
                  strokeDasharray={37.7}
                  strokeDashoffset={37.7 - (37.7 * Math.min(100, goalPercent)) / 100}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="font-mono text-[11px] text-text-secondary font-semibold">
              {goalPercent}%
            </span>
          </div>

          {/* Quick Add Button */}
          <Button
            size="xs"
            variant="outline"
            onClick={onQuickAdd}
            className="h-8 px-2.5 text-xs border-border/80 hover:border-accent/40 hover:bg-surface text-text-primary gap-1"
            title="Quick Add Task or Session"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline font-medium">Add</span>
          </Button>

          {/* Notifications Popover */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className={cn(
                'p-1.5 rounded-lg transition-colors relative',
                notificationsOpen
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              )}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent ring-2 ring-nav animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-dropdown z-50 overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="accent" size="xs">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsReadMutation.mutate();
                      }}
                      disabled={markAllAsReadMutation.isPending}
                      className="flex items-center gap-1 text-[11px] text-accent hover:underline font-medium"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-xs text-text-muted">
                      No notifications yet. You are all caught up!
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={cn(
                          'p-3 transition-colors flex items-start gap-2.5',
                          notif.read ? 'bg-transparent' : 'bg-accent/5'
                        )}
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-accent"
                          style={{ opacity: notif.read ? 0.2 : 1 }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-xs',
                              notif.read
                                ? 'text-text-secondary'
                                : 'font-medium text-text-primary'
                            )}
                          >
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">
                            {notif.body}
                          </p>
                          <span className="text-[10px] text-text-muted mt-1 block font-mono">
                            {formatRelativeDate(notif.createdAt)}
                          </span>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notif._id);
                            }}
                            title="Mark as read"
                            className="p-1 text-text-secondary hover:text-accent rounded transition-colors shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 border-t border-border bg-surface/30 text-center">
                  <Link
                    to="/settings"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] text-text-secondary hover:text-text-primary transition-colors font-medium"
                  >
                    Notification preferences →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-surface transition-colors"
              aria-label="User profile"
            >
              <Avatar name={user?.name || 'User'} size="sm" />
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-text-muted hidden sm:block transition-transform duration-200',
                  profileOpen && 'rotate-180 text-text-primary'
                )}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-card/95 backdrop-blur-xl p-1.5 shadow-dropdown animate-scale-in z-50">
                <div className="px-3 py-2.5 border-b border-border/70 mb-1">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {user?.name || 'Student'}
                  </p>
                  <p className="text-[11px] text-text-muted truncate font-mono mt-0.5">
                    {user?.email}
                  </p>
                  {user?.preparationType && (
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-medium">
                      🎯 {user.preparationType}
                    </span>
                  )}
                </div>

                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-text-muted" />
                  <span>Settings & Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
