import Dialog from '@/components/ui/Dialog';
import Badge from '@/components/ui/Badge';
import { useProblem } from '@/hooks/useProblems';
import { formatDate, formatDuration } from '@/lib/utils';
import { Clock, Code2, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

export default function AttemptHistory({ isOpen, onClose, problem }) {
  const { data, isLoading } = useProblem(problem?._id);

  if (!problem) return null;

  const attempts = data?.attempts || [];

  const getOutcomeVariant = (outcome) => {
    switch (outcome) {
      case 'Solved independently':
        return 'success';
      case 'Solved with hints':
        return 'default';
      case 'Solved after viewing solution':
        return 'warning';
      default:
        return 'destructive';
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Attempt History — ${problem.name}`}
      className="max-w-2xl"
    >
      <div className="space-y-4 pt-2 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-secondary">
            No attempts recorded for this problem yet.
          </div>
        ) : (
          attempts.map((att, idx) => (
            <div
              key={att._id || idx}
              className="p-4 rounded-xl bg-surface/40 border border-border space-y-3"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    Attempt #{att.attemptNumber || idx + 1}
                  </span>
                  <Badge variant={getOutcomeVariant(att.outcome)} size="sm">
                    {att.outcome}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  {att.duration && (
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatDuration(att.duration)}
                    </span>
                  )}
                  <span>{formatDate(att.attemptedAt || att.createdAt)}</span>
                </div>
              </div>

              {/* Complexities */}
              {(att.timeComplexity || att.spaceComplexity) && (
                <div className="flex gap-4 text-xs font-mono bg-surface/60 px-3 py-1.5 rounded-lg border border-border/40">
                  {att.timeComplexity && (
                    <span>
                      <strong className="text-text-secondary">Time: </strong>
                      <span className="text-accent">{att.timeComplexity}</span>
                    </span>
                  )}
                  {att.spaceComplexity && (
                    <span>
                      <strong className="text-text-secondary">Space: </strong>
                      <span className="text-emerald-400">{att.spaceComplexity}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Approach */}
              {att.approach && (
                <div className="text-xs">
                  <span className="text-text-secondary font-medium block mb-0.5">Approach:</span>
                  <p className="text-text-primary leading-relaxed">{att.approach}</p>
                </div>
              )}

              {/* Mistakes */}
              {att.mistakes && (
                <div className="text-xs flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-amber-400 font-medium">Mistakes: </span>
                    <span className="text-text-secondary">{att.mistakes}</span>
                  </div>
                </div>
              )}

              {/* Learning */}
              {att.learning && (
                <div className="text-xs flex items-start gap-2 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-emerald-400 font-medium">Takeaway: </span>
                    <span className="text-text-secondary">{att.learning}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Dialog>
  );
}

