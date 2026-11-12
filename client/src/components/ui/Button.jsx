import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  default:
    'bg-emerald-700 text-white font-medium hover:bg-emerald-800 active:scale-[0.98] shadow-xs border border-emerald-800',
  outline:
    'border border-border bg-white text-text-primary hover:bg-surface hover:border-stone-300 active:scale-[0.98] shadow-2xs',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface hover:text-text-primary active:scale-[0.98]',
  destructive:
    'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-xs border border-rose-700',
  success:
    'bg-emerald-700 text-white font-medium hover:bg-emerald-800 active:scale-[0.98] shadow-xs border border-emerald-800',
  secondary:
    'bg-surface text-text-primary border border-border hover:bg-stone-200/60 active:scale-[0.98] shadow-2xs',
  warning:
    'bg-amber-600 text-white font-medium hover:bg-amber-700 active:scale-[0.98] shadow-xs border border-amber-700',
  accentSubtle:
    'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 active:scale-[0.98]',
};

const sizes = {
  xs: 'h-7 px-2.5 text-[11px] gap-1 rounded-md',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-xs font-medium gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm font-medium gap-2.5 rounded-xl',
  icon: 'h-9 w-9 p-0 rounded-lg',
  'icon-sm': 'h-8 w-8 p-0 rounded-lg',
  'icon-xs': 'h-7 w-7 p-0 rounded-md',
};

const Button = forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      loading = false,
      disabled,
      children,
      icon: Icon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center font-medium select-none transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          variants[variant] || variants.default,
          sizes[size] || sizes.md,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn('animate-spin shrink-0', size === 'xs' || size === 'icon-xs' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        ) : Icon ? (
          <Icon className={cn('shrink-0', size === 'xs' || size === 'icon-xs' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
