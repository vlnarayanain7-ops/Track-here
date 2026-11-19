import { useId } from 'react';
export { default as Button } from './ui/Button';
export { default as Card } from './ui/Card';
export { default as Badge } from './ui/Badge';
export { default as EmptyState } from './ui/EmptyState';
export { default as Skeleton } from './ui/Skeleton';
export { default as Modal } from './ui/Dialog';

export function Field({ label, hint, error, id: customId, className = '', ...props }) {
  const generatedId = useId();
  const id = customId || generatedId;
  const descId = `${id}-d`;

  return (
    <label className={`field ${className}`.trim()} htmlFor={id} data-invalid={!!error}>
      {label}
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? descId : undefined}
        {...props}
      />
      {(error || hint) && (
        <small id={descId} className={error ? 'err' : ''} role={error ? 'alert' : undefined}>
          {error || hint}
        </small>
      )}
    </label>
  );
}

