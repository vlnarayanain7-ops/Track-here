import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(
  ({ className, label, error, helperText, options = [], placeholder, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'flex h-9 w-full rounded-xl border border-border bg-white px-3 py-1.5 text-xs text-text-primary shadow-2xs',
              'appearance-none cursor-pointer pr-8',
              'transition-all duration-150',
              'focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-50',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-text-muted bg-card">
                {placeholder}
              </option>
            )}
            {options.length > 0 &&
              options.map((opt) => {
                const value = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                return (
                  <option key={value} value={value} className="bg-card text-text-primary py-1">
                    {label}
                  </option>
                );
              })}
            {children}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        </div>
        {error && <p className="text-[11px] text-danger animate-fade-in font-medium">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-text-muted">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
