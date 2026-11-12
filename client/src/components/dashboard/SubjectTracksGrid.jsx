import { Link } from 'react-router-dom';
import {
  BookOpen,
  Code,
  Calculator,
  Beaker,
  Brain,
  Microscope,
  Atom,
  Globe,
  FileText,
  Play,
  ArrowRight,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';
import { DEFAULT_STUDY_CATEGORIES } from '@/lib/constants';

const ICON_MAP = {
  BookOpen,
  Code,
  Calculator,
  Beaker,
  Brain,
  Microscope,
  Atom,
  Globe,
  FileText,
};

function CircularProgress({ value, color = '#15803D', size = 44, strokeWidth = 3.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAE7E1"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          fill="none"
        />
      </svg>
      <span className="absolute text-[11px] font-mono font-bold text-text-primary">
        {Math.round(clampedValue)}%
      </span>
    </div>
  );
}

export default function SubjectTracksGrid({ subjects = [], categoryStats = [] }) {
  const displaySubjects = Array.isArray(subjects) ? subjects : [];

  if (displaySubjects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Subjects &amp; Learning Tracks
            </h2>
            <span className="text-xs text-text-muted font-mono">(0)</span>
          </div>
          <Link
            to="/subjects"
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
          >
            <span>+ Add Subject</span>
          </Link>
        </div>
        <div className="p-8 rounded-2xl border border-dashed border-border bg-white text-center">
          <p className="text-xs text-text-muted mb-2">No subjects configured yet.</p>
          <Link
            to="/subjects"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAF3EC] text-[#216E39] text-xs font-semibold hover:bg-[#D5EBDC] transition-colors"
          >
            + Add Your First Subject
          </Link>
        </div>
      </div>
    );
  }

  const statsMap = new Map();
  categoryStats.forEach((cat) => {
    const key = cat.category || cat.name || cat._id;
    if (key) statsMap.set(key.toLowerCase(), cat);
  });

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight text-text-primary flex items-center gap-2">
          <span>Subjects &amp; Learning Tracks</span>
          <span className="text-xs text-text-muted font-normal font-mono">
            ({displaySubjects.length})
          </span>
        </h2>
        <Link
          to="/subjects"
          className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Manage Syllabus</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displaySubjects.map((sub, idx) => {
          const Icon = ICON_MAP[sub.icon] || BookOpen;
          const subColor = sub.color || '#16A34A';
          const stats = statsMap.get(sub.name?.toLowerCase());

          const totalFocusMinutes = stats?.totalMinutes || 0;
          const sessionCount = stats?.sessionCount || 0;

          // Genuine chapters calculation
          const chapters = sub.chapters || [];
          const totalChapters = chapters.length;
          const completedChapters = chapters.filter(
            (c) => (typeof c === 'object' ? c.status === 'Completed' : false)
          ).length;

          const progressPct =
            totalChapters > 0
              ? Math.round((completedChapters / totalChapters) * 100)
              : totalFocusMinutes > 0
              ? Math.min(100, Math.round((totalFocusMinutes / 600) * 100))
              : 0;

          return (
            <div
              key={sub.name || idx}
              className="rounded-2xl border border-border bg-card p-5 hover:border-emerald-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Top Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${subColor}15`,
                        borderColor: `${subColor}30`,
                        color: subColor,
                      }}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary group-hover:text-emerald-900 transition-colors">
                        {sub.name}
                      </h3>
                      <p className="text-[11px] text-text-muted font-medium">
                        {totalChapters > 0
                          ? `${completedChapters}/${totalChapters} chapters done`
                          : 'Custom syllabus track'}
                      </p>
                    </div>
                  </div>

                  <CircularProgress value={progressPct} color={subColor} />
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, progressPct)}%`,
                      backgroundColor: subColor,
                    }}
                  />
                </div>

                {/* Stats Info */}
                <div className="flex items-center justify-between text-xs text-text-secondary py-1 border-t border-border/60">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-text-muted" />
                    <span>{formatDuration(totalFocusMinutes)} focused</span>
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">
                    {sessionCount} session{sessionCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-1">
                <Link
                  to={`/study?category=${encodeURIComponent(sub.name)}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface hover:bg-emerald-50 text-text-primary hover:text-emerald-800 border border-border hover:border-emerald-200 text-xs font-semibold transition-all duration-150"
                >
                  <Play className="w-3 h-3 fill-current text-emerald-700" />
                  <span>Study {sub.name}</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
