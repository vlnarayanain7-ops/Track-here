import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  FileText,
  MoreHorizontal,
  X,
  Code2,
  CalendarCheck,
  RotateCcw,
  Flame,
  BarChart3,
  Settings,
  Search,
  Layers,
  Calendar,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileNav({ onOpenCommandPalette }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const mainLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Study', path: '/study', icon: Timer },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Notes', path: '/notes', icon: FileText },
  ];

  const moreLinks = [
    { name: 'Syllabus & Tracks', path: '/subjects', icon: Layers, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/80' },
    { name: 'Weekly Schedule', path: '/tasks?tab=timetable', icon: Calendar, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200/80' },
    { name: 'Practice & Tests', path: '/practice', icon: Award, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200/80' },
    { name: 'Analytics & Streaks', path: '/analytics', icon: BarChart3, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/80' },
    { name: 'Settings & Profile', path: '/settings', icon: Settings, color: 'text-stone-700', bg: 'bg-stone-50 border-stone-200' },
  ];

  return (
    <>
      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-stone-900/35 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative bg-card border-t border-border/80 rounded-t-3xl p-5 shadow-dropdown animate-slide-up z-10 max-h-[80vh] overflow-y-auto pb-8">
            {/* Grab handle indicator */}
            <div className="w-12 h-1 rounded-full bg-border mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
              <div>
                <span className="text-sm font-semibold text-text-primary">All Modules</span>
                <p className="text-[11px] text-text-muted">Track Here Navigation Hub</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenCommandPalette?.();
              }}
              className="w-full mb-4 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-text-secondary hover:border-accent/40 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-accent" />
                <span>Search modules, topics, notes...</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-card border border-border text-text-muted">
                ⌘K
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-surface/50 border border-border/70 hover:border-border-light hover:bg-surface transition-all active:scale-[0.98]"
                  >
                    <div className={cn('w-7 h-7 rounded-lg border flex items-center justify-center shrink-0', item.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', item.color)} />
                    </div>
                    <span className="text-xs font-medium text-text-primary truncate">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-nav/95 backdrop-blur-2xl border-t border-border/80 flex items-center justify-around px-2 z-30 select-none pb-[env(safe-area-inset-bottom)]">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-[10px] font-medium transition-all duration-150 active:scale-95 relative',
                  isActive
                    ? 'text-accent font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-4 h-4', isActive && 'stroke-[2.2]')} />
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-accent absolute -bottom-1" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-[10px] font-medium transition-all duration-150 active:scale-95',
            menuOpen ? 'text-accent font-semibold' : 'text-text-muted hover:text-text-primary'
          )}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
