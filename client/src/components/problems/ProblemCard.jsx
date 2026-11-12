import { ExternalLink, CheckCircle2, Clock, Calendar, History, Plus, Edit2, Trash2, Award } from 'lucide-react';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export default function ProblemCard({ problem, onLogAttempt, onViewHistory, onEdit, onDelete }) {
  const getDifficultyVariant = (diff) => {
    switch (diff) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'Hard':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getPlatformColor = (plat) => {
    switch (plat) {
      case 'LeetCode':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'Codeforces':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'CodeChef':
        return 'text-orange-800 bg-orange-50 border-orange-200';
      default:
        return 'text-purple-800 bg-purple-50 border-purple-200';
    }
  };

  const isSolved = problem.status === 'Solved';

  return (
    <Card className="hover:border-border-light hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Header: Platform, Difficulty, Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {problem.platform && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold font-mono ${getPlatformColor(
                  problem.platform
                )}`}
              >
                {problem.platform}
              </span>
            )}
            {problem.difficulty && (
              <Badge variant={getDifficultyVariant(problem.difficulty)} size="sm">
                {problem.difficulty}
              </Badge>
            )}
            {isSolved && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Solved</span>
              </span>
            )}
            {problem.solvedIndependently && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                <Award className="w-3 h-3 text-emerald-700" />
                <span>Solo</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(problem)}
              className="p-1.5 text-text-secondary hover:text-accent rounded-md transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(problem._id)}
              className="p-1.5 text-text-secondary hover:text-rose-400 rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Problem Name & Link */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary flex-1">
              {problem.name}
            </h3>
            {problem.url && (
              <a
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-accent p-1 shrink-0"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {problem.topic && (
            <p className="text-xs text-text-secondary mt-0.5">Topic: {problem.topic}</p>
          )}
        </div>

        {/* Tags */}
        {problem.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {problem.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] text-text-secondary bg-surface px-1.5 py-0.5 rounded border border-border/50"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Revision date if set */}
        {problem.nextRevisionDate && (
          <div className="flex items-center gap-1 text-[11px] text-text-secondary pt-1">
            <Calendar className="w-3 h-3 text-accent" />
            <span>Revise: {formatDate(problem.nextRevisionDate)}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <button
            onClick={() => onViewHistory(problem)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Attempts</span>
          </button>

          <button
            onClick={() => onLogAttempt(problem)}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Attempt</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

