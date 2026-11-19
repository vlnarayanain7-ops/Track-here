import { reviewDate } from '@/lib/reviewSchedule';
import { useState } from 'react';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { useCompleteRevision, useDeleteRevision } from '@/hooks/useRevisions';
import { Calendar, Trash2, CheckCircle2, RotateCcw, Clock, History, ChevronDown, ChevronUp } from 'lucide-react';

export default function RevisionCard({ revision, onDelete }) {
  const [showHistory, setShowHistory] = useState(false);
  const completeMutation = useCompleteRevision();
  const deleteMutation = useDeleteRevision();

  const handleFeedback = async (feedback) => {
    try {
      await completeMutation.mutateAsync({ id: revision._id, feedback });
    } catch {
      // The mutation hook displays the error toast.
    }
  };

  const isOverdue =
    revision.dueDate && new Date(revision.dueDate) < new Date() && revision.status !== 'completed';

  const typeLabel = (revision.type || 'topic').toUpperCase();

  return (
    <div className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--line-strong)] hover:shadow-xs transition-all duration-200 group min-w-[260px]">
      {/* Top row: Type badge + Overdue + Delete action */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--line)]">
              {typeLabel}
            </span>
            {isOverdue && (
              <span className="text-[11px] font-medium text-[var(--danger)] bg-[var(--danger-soft)] px-2 py-0.5 rounded-md border border-[var(--danger)]/20">
                Overdue
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete ? onDelete(revision._id) : deleteMutation.mutate(revision._id)}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors cursor-pointer"
            title="Delete revision item"
            aria-label="Delete revision item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title & Linked Resources */}
        <h3 className="text-base font-semibold text-[var(--text)] font-heading leading-snug line-clamp-2">
          {revision.title}
        </h3>

        {revision.solution && <details className="mt-2 text-sm"><summary>Show solution</summary><p className="whitespace-pre-wrap break-words">{revision.solution}</p></details>}
        {revision.linkedProblem && (
          <p className="text-xs text-[var(--muted)] mt-1 truncate">
            Problem: <span className="text-[var(--text)]">{revision.linkedProblem.name}</span> ({revision.linkedProblem.platform})
          </p>
        )}
        {revision.linkedNote && (
          <p className="text-xs text-[var(--muted)] mt-1 truncate">
            Note: <span className="text-[var(--text)]">{revision.linkedNote.title}</span>
          </p>
        )}
      </div>

      {/* Meta & Actions */}
      <div className="mt-4 pt-3 border-t border-[var(--line)] space-y-3">
        {/* Schedule Meta: Due & Interval */}
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
            <span className="truncate font-medium">Due: {formatRelativeDate(revision.dueDate)}</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--muted)] shrink-0">
            <Clock className="w-3 h-3 text-[var(--muted)]" />
            <span>Interval: {revision.intervalDays}d</span>
          </div>
        </div>

        {/* Recall Actions: Remembered vs Hard */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleFeedback('Remembered')}
            disabled={completeMutation.isPending}
            className="h-9 px-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] hover:brightness-105 active:scale-98 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Remembered (Advance to next interval: 1d -> 3d -> 7d -> 14d -> 30d)"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Remembered ? {reviewDate(revision.intervalDays, 'Remembered')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleFeedback('Hard')}
            disabled={completeMutation.isPending}
            className="h-9 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] active:scale-98 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Hard / Forgot (Reset review interval back to 1 day)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
            <span>Hard ? {reviewDate(revision.intervalDays, 'Hard')}</span>
          </button>
        </div>

        {/* History Accordion if available */}
        {revision.history?.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHistory((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <History className="w-3 h-3" />
              <span>{revision.history.length} past review{revision.history.length === 1 ? '' : 's'}</span>
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1 bg-[var(--surface-2)] p-2.5 rounded-xl text-[11px] text-[var(--muted)]">
                {revision.history.slice(-3).map((h, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>{formatDate(h.date)}</span>
                    <span className="text-[var(--text)] font-medium">{h.feedback}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
