import { cn } from '@/lib/utils';

export default function Switch({ checked, onChange, label, description, disabled, className }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center justify-between gap-3 cursor-pointer select-none group',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <div className="text-xs font-medium text-text-primary group-hover:text-text-primary transition-colors">{label}</div>}
          {description && <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{description}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        tabIndex={0}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 pointer-events-none items-center',
          checked
            ? 'bg-emerald-600 shadow-2xs'
            : 'bg-stone-200 border border-stone-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
