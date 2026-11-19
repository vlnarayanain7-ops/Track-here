import { isValidElement } from 'react';
import EmptyIllustration from '@/components/brand/EmptyIllustration';
import { cn } from '@/lib/utils';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  illustration,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className,
  children,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center select-none', className)}>
      {illustration && <EmptyIllustration kind={illustration} className="w-32 h-auto mb-4" />}
      {isValidElement(Icon) ? Icon : Icon && (
        <div className="mb-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)] shadow-2xs">
            <Icon className="h-6 w-6 stroke-[1.75]" />
          </div>
        </div>
      )}
      {title && <h3 className="text-sm font-semibold text-text-primary tracking-tight mb-1">{title}</h3>}
      {(description || text) && (
        <p className="text-xs text-text-muted max-w-sm mb-4 leading-relaxed">
          {description || text}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" icon={actionIcon} className="shadow-xs">
          {actionLabel}
        </Button>
      )}
      {action}
      {children}
    </div>
  );
}
