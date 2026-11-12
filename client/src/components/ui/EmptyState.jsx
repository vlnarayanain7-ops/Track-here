import { cn } from '@/lib/utils';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className,
  children,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center select-none', className)}>
      {Icon && (
        <div className="mb-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
            <Icon className="h-6 w-6 stroke-[1.75]" />
          </div>
        </div>
      )}
      {title && <h3 className="text-sm font-semibold text-text-primary tracking-tight mb-1">{title}</h3>}
      {description && (
        <p className="text-xs text-text-muted max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" icon={actionIcon} className="shadow-xs">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
