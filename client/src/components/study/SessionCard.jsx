import { Edit2, Trash2, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatDuration, formatDate } from '@/lib/utils';

export default function SessionCard({ session, onEdit, onDelete }) {
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Physics':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'Chemistry':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'Mathematics':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'Botany':
        return 'text-green-800 bg-green-50 border-green-200';
      case 'Zoology':
        return 'text-rose-800 bg-rose-50 border-rose-200';
      case 'C++':
        return 'text-indigo-800 bg-indigo-50 border-indigo-200';
      case 'DSA':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'Competitive Programming':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      default:
        return 'text-purple-800 bg-purple-50 border-purple-200';
    }
  };

  return (
    <div className="group rounded-2xl border border-border bg-white p-5 hover:border-emerald-300 hover:shadow-xs transition-all duration-200 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold tracking-wide ${getCategoryColor(session.category)}`}
          >
            {session.category}
          </span>
          <Badge variant="outline" size="sm" className="font-mono text-[10px]">
            {session.activityType}
          </Badge>
          <span className="text-[11px] text-text-muted font-mono">
            {formatDate(session.date)}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(session)}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-stone-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(session._id)}
            className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Topic Title */}
      <div>
        <h3 className="text-sm font-bold text-text-primary leading-snug">
          {session.topic}
          {session.subtopic && (
            <span className="font-normal text-text-muted text-xs ml-2">
              / {session.subtopic}
            </span>
          )}
        </h3>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-3 border-t border-border/80 text-text-secondary">
        <div className="flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-text-muted">Focus:</span>
          <strong className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {formatDuration(session.focusDuration)}
          </strong>
        </div>

        {session.problemsSolved > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            <span>{session.problemsSolved} Solved</span>
          </div>
        )}
      </div>

      {/* Learnings & Reflections */}
      {session.keyLearnings && (
        <div className="p-3 rounded-xl bg-stone-50 border border-border/60 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary block mb-0.5">Key Learning:</span>
          <p className="line-clamp-2 leading-relaxed">{session.keyLearnings}</p>
        </div>
      )}
    </div>
  );
}
