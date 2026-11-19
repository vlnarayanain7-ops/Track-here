import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dialog({ open, isOpen, onClose, title, description, children, className, size = 'md', sheet = false }) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const shown = open ?? isOpen ?? false;
  useEffect(() => {
    const dialog = ref.current;
    if (!shown) { if (dialog.open) dialog.close(); return; }
    const trigger = document.activeElement;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus?.();
    };
  }, [shown]);
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', full: 'max-w-4xl' };
  return <dialog ref={ref} aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Dialog'} aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); onClose?.(); }}
    onClick={event => { if (event.target === ref.current) { const r = ref.current.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose?.(); } }}
    className={cn('app-dialog', sheet && 'app-dialog-sheet', sizes[size], className)}>
    {shown && <><header className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5">
      <div>{title && <h2 id={titleId} className="text-lg font-semibold">{title}</h2>}{description && <p id={descriptionId} className="text-sm text-[var(--muted)] mt-1">{description}</p>}</div>
      <button type="button" className="btn btn-ghost shrink-0" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
    </header><div className="p-5 overflow-y-auto">{children}</div></>}
  </dialog>;
}
