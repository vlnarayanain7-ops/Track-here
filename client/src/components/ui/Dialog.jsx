import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export default function Dialog({
  open,
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const isShown = open ?? isOpen ?? false;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isShown) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isShown, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  if (!isShown) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/35 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
    >
      <div
        ref={contentRef}
        className={cn(
          'relative w-full rounded-t-2xl sm:rounded-2xl border border-border bg-white shadow-dropdown',
          'max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up flex flex-col',
          sizes[size] || sizes.md,
          className
        )}
      >

        {(title || description) && (
          <div className="flex items-start justify-between p-4 sm:p-5 pb-2 shrink-0 border-b border-border/40">
            <div>
              {title && (
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors shrink-0 -mr-1"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
