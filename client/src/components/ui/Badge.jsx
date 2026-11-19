import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--line)]',
  success: 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--line)] font-medium',
  warning: 'bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--line)]',
  destructive: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--line)]',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--line)]',
  outline: 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)]',
  accent: 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--line)] font-medium',
  purple: 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--line)] font-medium',
  elevated: 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-2xs',
};

const badgeSizes = {
  xs: 'px-1.5 py-0.2 text-[10px] font-mono leading-tight',
  sm: 'px-2 py-0.5 text-[11px] font-medium leading-normal',
  md: 'px-2.5 py-0.5 text-xs font-medium leading-normal',
};

export default function Badge({
  className,
  color,
  style,
  variant = 'default',
  size = 'sm',
  dot = false,
  dotColor,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors select-none font-sans',
        badgeVariants[variant] || badgeVariants.default,
        badgeSizes[size] || badgeSizes.sm,
        className
      )}
      style={{ ...(color ? { color: `var(--c-${color})`, background: `var(--c-${color}-bg)` } : {}), ...style }}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColor ||
              (variant === 'success'
                ? 'bg-success'
                : variant === 'warning'
                ? 'bg-warning'
                : variant === 'danger' || variant === 'destructive'
                ? 'bg-danger'
                : variant === 'purple'
                ? 'bg-purple'
                : 'bg-accent')
          )}
        />
      )}
      {children}
    </span>
  );
}
