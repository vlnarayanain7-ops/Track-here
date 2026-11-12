import { cn, getInitials } from '@/lib/utils';

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-14 w-14 text-base',
};

export default function Avatar({ src, name, size = 'md', className, status }) {
  const statusColors = {
    online: 'bg-success ring-card',
    busy: 'bg-danger ring-card',
    away: 'bg-warning ring-card',
    offline: 'bg-text-muted ring-card',
  };

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={cn(
            'rounded-full object-cover ring-1 ring-border/80 shadow-xs',
            sizes[size] || sizes.md,
            className
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-accent/20 via-surface to-purple/20 text-accent font-semibold flex items-center justify-center font-mono',
            'ring-1 ring-accent/30 shadow-xs select-none transition-transform duration-200',
            sizes[size] || sizes.md,
            className
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 shadow-xs',
            statusColors[status] || statusColors.online
          )}
        />
      )}
    </div>
  );
}
