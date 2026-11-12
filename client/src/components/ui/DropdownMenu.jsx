import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function DropdownMenu({ trigger, items = [], align = 'right', className }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 min-w-[190px] rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-dropdown p-1.5',
            'animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item, i) => {
            if (item.separator) {
              return <div key={i} className="my-1 h-px bg-border/60" />;
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
                  'hover:bg-surface text-text-secondary hover:text-text-primary',
                  item.destructive && 'text-danger hover:text-danger hover:bg-danger/10',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
                {item.shortcut && (
                  <span className="ml-auto text-[10px] font-mono text-text-muted">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
