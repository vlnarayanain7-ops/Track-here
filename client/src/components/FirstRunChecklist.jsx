import { Link } from 'react-router-dom';
import { Card } from './ui';
import { Check, ArrowRight } from 'lucide-react';

export function FirstRunChecklist({ steps = [] }) {
  const done = steps.filter((s) => s.done).length;
  const total = steps.length || 4;
  const pct = Math.round((done / total) * 100);

  return (
    <Card className="p-5 sm:p-6 mb-6 border-[var(--primary)]/30 bg-[var(--surface)] shadow-xs">
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-[var(--text)]">Get set up</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Complete these quick steps to get the most out of Track Here</p>
        </div>
        <span className="text-xs font-semibold text-[var(--muted)] font-mono">
          {done} of {total}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-2 rounded-full bg-[var(--line)] overflow-hidden my-3.5"
      >
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-1.5 mt-2">
        {steps.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs sm:text-sm font-medium ${
              s.done
                ? 'bg-[var(--surface-2)]/60 border-transparent text-[var(--muted)]'
                : 'bg-[var(--surface)] border-[var(--line)] text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  s.done
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                    : 'border border-[var(--line)] text-transparent'
                }`}
              >
                {s.done ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
              </div>
              <span className={s.done ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'}>
                {s.label}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--muted)] shrink-0" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default FirstRunChecklist;

