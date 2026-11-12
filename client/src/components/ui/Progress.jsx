import { cn } from '@/lib/utils';

export default function Progress({
  value = 0,
  max = 100,
  className,
  size = 'md',
  showLabel = false,
  label,
  color,
}) {
  const percentage = Math.min(Math.max((value / (max || 1)) * 100, 0), 100);

  const heights = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-text-secondary mb-1.5 font-mono">
          <span className="text-[11px] text-text-muted">{label || `${value} / ${max}`}</span>
          <span className="font-semibold text-text-primary">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-stone-200/80 overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out shadow-2xs',
            color ||
              (percentage >= 100
                ? 'bg-emerald-600'
                : percentage >= 60
                ? 'bg-emerald-600'
                : percentage >= 30
                ? 'bg-amber-600'
                : 'bg-emerald-700')
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
