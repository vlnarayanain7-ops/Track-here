import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  FileText,
  Menu,
  X,
  Calendar,
  Layers,
  Award,
  Flame,
  RotateCcw,
  Sun,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileTabBar({ onQuickAdd }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const mainTabs = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/study', label: 'Study', icon: Timer },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/notes', label: 'Notes', icon: FileText },
  ];

  const moreItems = [
    { to: '/timetable', label: 'Timetable', icon: Calendar, color: 'text-amber-500' },
    { to: '/subjects', label: 'Syllabus & Goals', icon: Layers, color: 'text-emerald-500' },
    { to: '/practice', label: 'Practice & Tests', icon: Award, color: 'text-indigo-400' },
    { to: '/streaks', label: 'Streaks & Heatmap', icon: Flame, color: 'text-amber-400' },
    { to: '/revisions', label: 'Revision Queue', icon: RotateCcw, color: 'text-blue-400' },
    { to: '/accountability', label: 'Daily Journal', icon: Sun, color: 'text-amber-500' },
    { to: '/analytics', label: 'Statistics & Analytics', icon: BarChart3, color: 'text-emerald-400' },
    { to: '/settings', label: 'Settings', icon: Settings, color: 'text-slate-400' },
  ];

  return (
    <>
      {/* Floating "+" Quick Add Button (Above Tab Bar on Phones < 768px) */}
      <button
        type="button"
        onClick={() => onQuickAdd?.('task')}
        className="md:hidden fixed right-4 bottom-[calc(68px+env(safe-area-inset-bottom))] z-40 w-13 h-13 rounded-full bg-[var(--primary)] text-[var(--on-primary)] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Quick add task"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Bottom Tab Bar (< 768px) */}
      <nav
        className="tabbar md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--surface)] border-t border-[var(--line)] flex items-center justify-around px-2 pt-1 pb-[calc(6px+env(safe-area-inset-bottom))]"
        aria-label="Mobile Navigation"
      >
        {mainTabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive ? 'stroke-[var(--primary)]' : 'stroke-current')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* 5th Tab: "More" Sheet Trigger */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            'flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
            sheetOpen ? 'text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
          )}
          aria-label="More modules"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* "More" Bottom Sheet Modal on Phones */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="relative bg-[var(--surface)] border-t border-[var(--line)] rounded-t-3xl p-5 shadow-2xl z-10 max-h-[82vh] overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom))] animate-slide-up"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1 rounded-full bg-[var(--line)] mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
              <div>
                <h3 className="text-base font-heading font-bold text-[var(--text)] m-0">All Features</h3>
                <p className="text-[12px] text-[var(--muted)] m-0">Track Here Complete Suite</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Remaining Modules */}
            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map(({ to, label, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--primary)]/40 transition-colors active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center shrink-0">
                    <Icon className={cn('w-4 h-4', color)} />
                  </div>
                  <span className="text-[13px] font-medium text-[var(--text)] truncate">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileTabBar;

