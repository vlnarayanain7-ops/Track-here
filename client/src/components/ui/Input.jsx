import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(
  ({ className, label, error, helperText, icon: Icon, rightIcon: RightIcon, onRightIconClick, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'flex h-9 w-full rounded-xl border border-border bg-white px-3 py-1.5 text-xs text-text-primary shadow-2xs',
              'placeholder:text-text-muted',
              'transition-all duration-150',
              'focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-50',
              Icon && 'pl-9',
              RightIcon && 'pr-9',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900',
              className
            )}
            {...props}
          />
          {RightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors',
                !onRightIconClick && 'pointer-events-none'
              )}
            >
              <RightIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {error && <p className="text-[11px] text-danger animate-fade-in font-medium">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
