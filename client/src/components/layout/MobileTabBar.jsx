import { NavLink } from 'react-router-dom';
import {
  Sun as TodayIcon,
  AlarmClock,
  ListTodo,
  FileText,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_TABS = [
  { to: '/', label: 'Today', icon: TodayIcon, end: true },
  { to: '/study', label: 'Focus', icon: AlarmClock },
  { to: '/plan', label: 'Plan', icon: ListTodo },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/progress', label: 'Progress', icon: Flame },
];

export function MobileTabBar() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[calc(64px+env(safe-area-inset-bottom))] bg-[var(--surface)] border-t border-[var(--line)] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] select-none"
      aria-label="Mobile Navigation"
    >
      {MOBILE_TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
              data-tour={`nav-${to === "/" ? "today" : to.slice(1)}`}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'touch-manipulation flex-1 min-w-0 h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
              isActive
                ? 'text-[var(--primary)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", isActive && "bg-[var(--primary-soft)]")}><Icon
                className={cn('w-5 h-5', isActive ? 'stroke-[var(--primary)]' : 'stroke-current')}
                aria-hidden="true"
              />
              </span><span className="leading-none">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileTabBar;
