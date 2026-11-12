import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Textarea = forwardRef(({ className, label, error, helperText, ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-text-primary shadow-2xs',
          'placeholder:text-text-muted resize-y',
          'transition-all duration-150',
          'focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-50',
          error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900',
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-danger animate-fade-in font-medium">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-text-muted">{helperText}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
