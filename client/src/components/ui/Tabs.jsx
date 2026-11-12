import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Tabs({
  tabs = [],
  defaultValue,
  value,
  onChange,
  className,
  variant = 'line', // 'line' | 'pill'
}) {
  const [internalTab, setInternalTab] = useState(defaultValue || tabs[0]?.value);
  const activeTab = value !== undefined ? value : internalTab;

  const handleChange = (newVal) => {
    if (value === undefined) {
      setInternalTab(newVal);
    }
    onChange?.(newVal);
  };

  const activeContent = tabs.find((t) => t.value === activeTab);

  return (
    <div className={className}>
      <div
        className={cn(
          'flex items-center overflow-x-auto no-scrollbar',
          variant === 'pill'
            ? 'p-1 rounded-xl bg-surface/70 border border-border/80 gap-1'
            : 'border-b border-border gap-2 sm:gap-4'
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleChange(tab.value)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap text-xs font-medium transition-all duration-200 select-none shrink-0',
                variant === 'pill'
                  ? cn(
                      'px-3.5 py-1.5 rounded-xl border',
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200/80 font-bold shadow-2xs'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface'
                    )
                  : cn(
                      'px-3 py-2.5 border-b-2 -mb-px',
                      isActive
                        ? 'border-emerald-700 text-emerald-800 font-bold'
                        : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                    )
              )}
            >
              {tab.icon && <tab.icon className="h-3.5 w-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-mono font-medium',
                    variant === 'pill'
                      ? isActive
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-card text-text-muted border border-border'
                      : isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-surface text-text-muted border border-border'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {activeContent?.content && <div className="mt-4 animate-fade-in">{activeContent.content}</div>}
    </div>
  );
}
