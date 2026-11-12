import { cn } from '@/lib/utils';

export function Card({ className, variant = 'default', children, ...props }) {
  const variantStyles = {
    default: 'bg-card border-border shadow-card',
    glass: 'bg-card/75 backdrop-blur-xl border-border/70 shadow-elevated',
    elevated: 'bg-surface border-border shadow-elevated',
    interactive: 'bg-card border-border shadow-card hover:border-border-light hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer',
    subtle: 'bg-surface/40 border-border/50',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-200 text-text-primary',
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-sm sm:text-base font-semibold text-text-primary tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-xs text-text-secondary leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-4 sm:p-5 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center p-4 sm:p-5 pt-0 border-t border-border/40 mt-auto', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
