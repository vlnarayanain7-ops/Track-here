import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-stone-100 text-stone-700 border-stone-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80 font-medium',
  destructive: 'bg-rose-50 text-rose-800 border-rose-200/80 font-medium',
  danger: 'bg-rose-50 text-rose-800 border-rose-200/80 font-medium',
  outline: 'bg-white text-stone-700 border-stone-200',
  accent: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-medium',
  purple: 'bg-indigo-50 text-indigo-800 border-indigo-200/80 font-medium',
  elevated: 'bg-white text-stone-800 border-stone-200 shadow-2xs',
};

const badgeSizes = {
  xs: 'px-1.5 py-0.2 text-[10px] font-mono leading-tight',
  sm: 'px-2 py-0.5 text-[11px] font-medium leading-normal',
  md: 'px-2.5 py-0.5 text-xs font-medium leading-normal',
};

export default function Badge({
  className,
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
