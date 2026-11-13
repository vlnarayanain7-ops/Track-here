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
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[var(--bg)] border-t border-[var(--line)] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] select-none"
      aria-label="Mobile Navigation"
    >
      {MOBILE_TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex-1 h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
              isActive
                ? 'text-[var(--primary)] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn('w-4.5 h-4.5', isActive ? 'stroke-[var(--primary)]' : 'stroke-current')}
                aria-hidden="true"
              />
              <span className="leading-none">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileTabBar;
