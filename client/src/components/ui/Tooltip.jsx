import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function Tooltip({ children, content, side = 'top', className }) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2.5',
  };

  const arrowPositions = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-border-light',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-border-light',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-border-light',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-border-light',
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {isVisible && content && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-text-primary',
            'bg-elevated border border-border-light/70 rounded-lg shadow-dropdown',
            'whitespace-nowrap pointer-events-none animate-scale-in',
            positions[side],
            className
          )}
        >
          {content}
          {/* Arrow */}
          <span
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowPositions[side]
            )}
          />
        </div>
      )}
    </div>
  );
}
