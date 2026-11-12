import { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStreakData, useAnalytics } from '@/hooks/useAnalytics';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import {
  Target,
  LayoutDashboard,
  Timer,
  CheckSquare,
  Calendar,
  Layers,
  FileText,
  Award,
  Flame,
  RotateCcw,
  Sun,
  BarChart3,
  Settings,
  LogOut,
  MessageSquarePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUPS = [
  {
    caption: 'WORKSPACE',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Study & Timer', path: '/study', icon: Timer },
      { name: 'Tasks & Projects', path: '/tasks', icon: CheckSquare },
      { name: 'Timetable', path: '/timetable', icon: Calendar },
      { name: 'Syllabus & Goals', path: '/subjects', icon: Layers },
      { name: 'Notes Workspace', path: '/notes', icon: FileText },
      { name: 'Practice & Tests', path: '/practice', icon: Award },
    ],
  },
  {
    caption: 'GROWTH & REVIEW',
    items: [
      { name: 'Streaks & Heatmap', path: '/streaks', icon: Flame },
      { name: 'Revision Queue', path: '/revisions', icon: RotateCcw },
      { name: 'Daily Journal', path: '/accountability', icon: Sun },
      { name: 'Statistics & Analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
];

export default function Sidebar({ className, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { data: streakData } = useStreakData();
  const { data: analyticsData } = useAnalytics();

  const currentStreak = streakData?.currentStreak ?? analyticsData?.streaks?.currentStreak ?? 0;
  const todayMinutes = analyticsData?.today?.studyMinutes || analyticsData?.today?.focusMinutes || 0;
  const isSafe = todayMinutes >= 25;

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  const userSubjects = user?.subjects && Array.isArray(user.subjects) ? user.subjects : [];
  const displayedSubjects = userSubjects.slice(0, 6);

  return (
    <aside
      className={cn(
        'w-64 bg-[var(--surface)] text-[var(--text)] flex flex-col h-full select-none shrink-0 border-r border-[var(--line)]',
        className
      )}
    >
      {/* Brand Header — Logo + Track Here (No Tagline) */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--line)] shrink-0">
        <Link to="/" onClick={onClose} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="font-heading font-bold text-[var(--text)] text-[19px] tracking-tight block">
            Track Here
          </span>
        </Link>
      </div>

      {/* Main Single Scroll Navigation Area */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {GROUPS.map((group) => (
          <div key={group.caption}>
            <p className="px-3 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider font-heading mb-1.5">
              {group.caption}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 min-h-[42px] rounded-[var(--r-md)] text-[13.5px] transition-colors',
                        isActive
                          ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                          : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] font-medium'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'w-4.5 h-4.5 shrink-0 transition-colors',
                            isActive ? 'stroke-[var(--primary)]' : 'stroke-current'
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Subjects Section — Single source of truth is Syllabus & Goals */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1.5">
            <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider font-heading">
              Subjects
            </p>
            <Link
              to="/subjects"
              onClick={onClose}
              className="text-[12px] font-semibold text-[var(--primary)] hover:underline"
            >
              Manage
            </Link>
          </div>

          {displayedSubjects.length > 0 ? (
            <div className="space-y-0.5">
              {displayedSubjects.map((s, idx) => (
                <div
                  key={s.name || idx}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  onClick={() => {
                    navigate(`/study?subject=${encodeURIComponent(s.name)}`);
                    if (onClose) onClose();
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: s.color || 'var(--primary)' }}
                  />
                  <span className="truncate">{s.name}</span>
                </div>
              ))}
              {userSubjects.length > 6 && (
                <Link
                  to="/subjects"
                  onClick={onClose}
                  className="block px-3 py-1 text-[12px] font-medium text-[var(--primary)] hover:underline"
                >
                  View all ({userSubjects.length}) →
                </Link>
              )}
            </div>
          ) : (
            <div className="px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-center my-1">
              <p className="text-[12px] text-[var(--muted)] mb-1.5">No subjects added</p>
              <Link
                to="/subjects"
                onClick={onClose}
                className="inline-flex items-center justify-center px-2.5 py-1 text-[12px] font-semibold text-[var(--primary)] bg-[var(--primary-soft)] hover:brightness-105 rounded-lg transition-colors"
              >
                + Add Subject
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Footer Area: Settings, Compact Streak Card, User Menu */}
      <div className="p-3 border-t border-[var(--line)] space-y-2.5 bg-[var(--surface)] shrink-0">
        {/* Settings Pinned Link */}
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 min-h-[40px] rounded-[var(--r-md)] text-[13.5px] transition-colors',
              isActive
                ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] font-medium'
            )
          }
        >
          <Settings className="w-4.5 h-4.5 shrink-0" aria-hidden="true" />
          <span>Settings</span>
        </NavLink>

        {/* Send Feedback Button */}
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            setFeedbackOpen(true);
          }}
          className="flex items-center gap-3 px-3 w-full min-h-[40px] rounded-[var(--r-md)] text-[13.5px] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] font-medium transition-colors cursor-pointer text-left"
        >
          <MessageSquarePlus className="w-4.5 h-4.5 shrink-0" aria-hidden="true" />
          <span>Send Feedback</span>
        </button>

        {/* Compact Streak Card */}
        <Link
          to="/streaks"
          onClick={onClose}
          className="bg-[var(--warn-soft)] border border-[var(--warn)]/30 rounded-xl p-2.5 flex gap-2.5 items-center transition-all cursor-pointer group shadow-2xs"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--warn)]/20 flex items-center justify-center shrink-0 text-[var(--warn)] group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <b className="font-heading text-[13px] text-[var(--text)] block tracking-tight">
                {currentStreak}-day streak
              </b>
              <span className="text-[11px] text-[var(--primary)] font-bold">View →</span>
            </div>
            <small className="block text-[12px] text-[var(--warn)] font-medium leading-tight mt-0.5">
              {streakData?.currentStreak > 0 || isSafe
                ? 'Keep it going'
                : 'Study 25 min to start'}
            </small>
          </div>
        </Link>

        {/* User Mini Profile & Sign Out */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
            title="Open Account Settings"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-heading font-bold text-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'N'}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text)] truncate">{user?.name || 'Scholar'}</p>
              <p className="text-[12px] text-[var(--muted)] truncate">{user?.email || ''}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)] rounded-lg hover:bg-[var(--danger-soft)] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </aside>
  );
}
