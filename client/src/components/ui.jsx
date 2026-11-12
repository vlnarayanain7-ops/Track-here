import { useEffect, useId, useRef } from 'react';

/**
 * @typedef {'blue'|'green'|'amber'|'rose'|'violet'|'cyan'|'orange'|'slate'} ColorKey
 */

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon = null,
  children,
  className = '',
  disabled,
  ...props
}) {
  const cls = [
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'ghost' && 'btn-ghost',
    variant === 'danger' && 'btn-danger',
    size === 'lg' && 'btn-lg',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {icon}
      {loading ? 'Working…' : children}
    </button>
  );
}

export function Card({ children, style, className = '', ...props }) {
  return (
    <section className={`card ${className}`.trim()} style={style} {...props}>
      {children}
    </section>
  );
}

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

export function Badge({ color = 'slate', children, style, className = '', ...props }) {
  return (
    <span
      className={`badge ${className}`.trim()}
      style={{
        color: `var(--c-${color})`,
        background: `var(--c-${color}-bg)`,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, text, action, className = '' }) {
  return (
    <div className={`empty ${className}`.trim()}>
      {icon}
      <h3>{title}</h3>
      {text && <p style={{ margin: 0, maxWidth: 420 }}>{text}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ w = '100%', h = 14, style, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width: w, height: h, ...style }}
      aria-hidden="true"
    />
  );
}

export function Modal({ open, onClose, title, children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`.trim()}
      onClose={onClose}
      aria-labelledby="modal-title"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 id="modal-title" style={{ fontSize: 20 }}>
          {title}
        </h2>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}

