import { NavLink, Link } from 'react-router-dom';
import {
  Sun as TodayIcon,
  AlarmClock,
  ListTodo,
  FileText,
  Flame,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: TodayIcon, end: true },
  { to: '/study', label: 'Focus', icon: AlarmClock },
  { to: '/plan', label: 'Plan', icon: ListTodo },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/progress', label: 'Progress', icon: Flame },
];

export default function Sidebar({ onClose }) {
  return (
    <aside
      className="sidebar w-[216px] bg-[var(--bg)] text-[var(--text)] flex flex-col h-full select-none shrink-0 border-r border-[var(--line)]"
    >
      {/* Brand */}
      <div className="px-[22px] pt-5 pb-5">
        <Link
          to="/"
          onClick={onClose}
          className="font-heading font-bold text-[18px] text-[var(--text)] tracking-tight"
        >
          Track Here
        </Link>
      </div>

      {/* Navigation — 5 items only */}
      <nav aria-label="Primary" className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'sidebar-nav flex items-center gap-[10px] h-10 px-[10px] rounded-[10px] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'
              )
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Spacer pushes Settings to bottom */}
        <div className="flex-1" />

        {/* Settings at bottom */}
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'sidebar-nav flex items-center gap-[10px] h-10 px-[10px] rounded-[10px] text-sm font-medium transition-colors mb-4',
              isActive
                ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                : 'text-[var(--muted)] hover:bg-[var(--surface-2)]'
            )
          }
        >
          <Settings className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
}
