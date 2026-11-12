import { useState } from 'react';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { REVISION_FEEDBACKS } from '@/lib/constants';
import { useCompleteRevision, useDeleteRevision } from '@/hooks/useRevisions';
import { RotateCcw, Calendar, Trash2, History, ChevronDown, ChevronUp } from 'lucide-react';

export default function RevisionCard({ revision, onDelete }) {
  const [showHistory, setShowHistory] = useState(false);
  const completeMutation = useCompleteRevision();
  const deleteMutation = useDeleteRevision();

  const handleFeedback = (feedback) => {
    completeMutation.mutate({ id: revision._id, feedback });
  };

  const isOverdue =
    revision.dueDate && new Date(revision.dueDate) < new Date() && revision.status !== 'completed';

  const getTypeVariant = (type) => {
    switch (type) {
      case 'problem':
        return 'warning';
      case 'note':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="hover:border-border-light hover:-translate-y-0.5 transition-all duration-200 group">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={getTypeVariant(revision.type)} size="sm">
              {revision.type?.toUpperCase()}
            </Badge>
            {isOverdue && (
              <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                Overdue
              </span>
            )}
          </div>

          <button
            onClick={() => onDelete(revision._id)}
            className="p-1 text-text-secondary hover:text-rose-400 rounded transition-all opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{revision.title}</h3>
          {revision.linkedProblem && (
            <p className="text-xs text-text-secondary mt-0.5">
              Problem: {revision.linkedProblem.name} ({revision.linkedProblem.platform})
            </p>
          )}
          {revision.linkedNote && (
            <p className="text-xs text-text-secondary mt-0.5">
              Note: {revision.linkedNote.title}
            </p>
          )}
        </div>

        {/* Schedule meta */}
        <div className="flex items-center justify-between text-xs text-text-secondary pt-1 border-t border-border/40">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>Due: {formatRelativeDate(revision.dueDate)}</span>
          </div>
          <span>Interval: {revision.intervalDays} day{revision.intervalDays === 1 ? '' : 's'}</span>
        </div>

        {/* Feedback Options */}
        <div className="pt-2">
          <span className="text-[11px] font-medium text-text-secondary block mb-1.5">
            Log Revision Feedback:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {REVISION_FEEDBACKS.map((fb) => (
              <button
                key={fb.value}
                onClick={() => handleFeedback(fb.value)}
                disabled={completeMutation.isPending}
                className="px-2 py-1.5 rounded-lg border border-border bg-surface/40 hover:bg-surface text-[11px] font-medium text-text-primary hover:border-accent/40 transition-colors text-center truncate"
                title={fb.label}
              >
                {fb.value}
              </button>
            ))}
          </div>
        </div>

        {/* History Accordion if available */}
        {revision.history?.length > 0 && (
          <div className="pt-1 border-t border-border/40">
            <button
              onClick={() => setShowHistory((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
            >
              <History className="w-3 h-3" />
              <span>{revision.history.length} past review{revision.history.length === 1 ? '' : 's'}</span>
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1 bg-surface/30 p-2 rounded-lg text-[10px] text-text-secondary">
                {revision.history.map((h, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{formatDate(h.date)}</span>
                    <span className="text-text-primary font-medium">{h.feedback}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

