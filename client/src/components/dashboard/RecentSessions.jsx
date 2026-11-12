import { Link } from 'react-router-dom';
import { ArrowRight, Timer, BookOpen } from 'lucide-react';
import { formatDuration, formatRelativeDate } from '@/lib/utils';

export default function RecentSessions({ sessions = [] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-text-primary">
            Recent Study Sessions
          </h2>
          {sessions.length > 0 && (
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              {sessions.length}
            </span>
          )}
        </div>
        <Link
          to="/study"
          className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold transition-colors"
        >
          <span>All history</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {sessions.length === 0 ? (
          <div className="py-8 flex flex-col items-center text-center gap-2">
            <p className="text-xs text-text-muted">No focus sessions logged yet today.</p>
            <Link to="/study" className="text-xs text-emerald-700 font-semibold hover:underline">
              Start your first session
            </Link>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session._id}
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-border hover:border-emerald-200 hover:shadow-2xs transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-semibold font-mono">
                    {session.category}
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">
                    {session.activityType}
                  </span>
                </div>
                <p className="text-xs font-bold text-text-primary truncate">
                  {session.topic}
                  {session.subtopic ? ` — ${session.subtopic}` : ''}
                </p>
              </div>

              <div className="text-right shrink-0 ml-3">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                  {formatDuration(session.focusDuration)}
                </span>
                <p className="text-[10px] text-text-muted font-mono mt-1">
                  {formatRelativeDate(session.date)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
