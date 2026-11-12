import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Timer,
  CheckSquare,
  FileText,
  Code2,
  CalendarCheck,
  Flame,
  RotateCcw,
  BarChart3,
  Settings,
  PlusCircle,
  Sun,
  Moon,
  ExternalLink,
  X,
  Layers,
  Calendar,
  Award,
} from 'lucide-react';
import * as searchApi from '@/api/search';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Live search debounced
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.globalSearch({ q: query.trim() });
        setResults(res.data || res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (path) => {
    onClose();
    navigate(path);
  };

  const navigationCommands = [
    { label: 'Dashboard', path: '/', icon: BarChart3 },
    { label: 'Study Tracker & Focus Timer', path: '/study', icon: Timer },
    { label: 'Syllabus & Chapter Manager', path: '/subjects', icon: Layers },
    { label: 'Weekly Timetable & Schedule', path: '/timetable', icon: Calendar },
    { label: 'Practice & Mock Tests', path: '/practice', icon: Award },
    { label: 'Task Manager', path: '/tasks', icon: CheckSquare },
    { label: 'Notes Workspace', path: '/notes', icon: FileText },
    { label: 'Problem Journal', path: '/practice?tab=problems', icon: Code2 },
    { label: 'Morning Plan Check-In', path: '/accountability?tab=morning', icon: Sun },
    { label: 'Evening Review', path: '/accountability?tab=evening', icon: Moon },
    { label: 'Study Streaks & Heatmap', path: '/streaks', icon: Flame },
    { label: 'Revision Queue', path: '/revisions', icon: RotateCcw },
    { label: 'Analytics & Weekly Summary', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const quickActions = [
    { label: 'Start Focus Timer', path: '/study?action=timer', icon: Timer },
    { label: 'Log Study Session', path: '/study?action=log', icon: PlusCircle },
    { label: 'Log Mock Test Scorecard', path: '/practice', icon: Award },
    { label: 'Create New Task', path: '/tasks?action=new', icon: CheckSquare },
    { label: 'Create New Note', path: '/notes?action=new', icon: FileText },
    { label: 'Record Problem Attempt', path: '/practice?tab=problems', icon: Code2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-white border border-border rounded-2xl shadow-dropdown overflow-hidden z-10 flex flex-col max-h-[75vh] animate-slide-down">
        {/* Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0">
            <Search className={`w-4 h-4 ${loading ? 'text-emerald-700 animate-pulse' : 'text-stone-500'} transition-colors duration-200`} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search sessions, tasks, notes..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-stone-100 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] text-text-muted font-mono">
            ESC
          </kbd>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-2 space-y-4 text-xs">
          {/* If search query has results */}
          {results ? (
            <div className="space-y-3">
              {results.sessions?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 block mb-1.5 font-mono">
                    Study Sessions
                  </span>
                  {results.sessions.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => navigateTo('/study')}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface/70 text-left transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                          <Timer className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-text-primary font-medium truncate">{s.topic}</span>
                        <span className="text-text-muted text-[11px]">({s.category})</span>
                      </div>
                      <span className="text-text-secondary font-mono bg-surface/50 px-1.5 py-0.5 rounded">{s.focusDuration}m</span>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 block mb-1.5 font-mono">
                    Tasks
                  </span>
                  {results.tasks.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => navigateTo('/tasks')}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface/70 text-left transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-md bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-text-primary font-medium truncate">{t.title}</span>
                      </div>
                      <span className="text-text-muted bg-surface/50 px-1.5 py-0.5 rounded">{t.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.notes?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 block mb-1.5 font-mono">
                    Notes
                  </span>
                  {results.notes.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => navigateTo('/notes')}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface/70 text-left transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-md bg-sky-400/10 border border-sky-400/20 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                        <span className="text-text-primary font-medium truncate">{n.title}</span>
                      </div>
                      <span className="text-text-muted font-mono bg-surface/50 px-1.5 py-0.5 rounded">{n.folder}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.problems?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 block mb-1.5 font-mono">
                    Problems
                  </span>
                  {results.problems.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => navigateTo('/problems')}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface/70 text-left transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-md bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                          <Code2 className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <span className="text-text-primary font-medium truncate">{p.name}</span>
                      </div>
                      <span className="text-text-muted font-mono bg-surface/50 px-1.5 py-0.5 rounded">{p.platform}</span>
                    </button>
                  ))}
                </div>
              )}

              {(!results.sessions?.length &&
                !results.tasks?.length &&
                !results.notes?.length &&
                !results.problems?.length) && (
                <div className="py-12 text-center">
                  <Search className="w-8 h-8 text-text-muted/30 mx-auto mb-3" />
                  <p className="text-text-secondary">No matches found for &quot;{query}&quot;</p>
                  <p className="text-[10px] text-text-muted mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          ) : (
            /* Default: Quick Actions & Navigation */
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 block mb-1.5 font-mono">
                  Quick Actions
                </span>
                <div className="space-y-0.5">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => navigateTo(action.path)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface/70 text-text-primary text-left transition-all duration-200 group"
                      >
                        <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:border-accent/40 transition-colors duration-200">
                          <Icon className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="font-medium flex-1">{action.label}</span>
                        <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border/30 pt-3">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 block mb-1.5 font-mono">
                  Navigation
                </span>
                <div className="space-y-0.5">
                  {navigationCommands.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.label}
                        onClick={() => navigateTo(cmd.path)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface/70 text-text-secondary hover:text-text-primary text-left transition-all duration-200 group"
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 group-hover:text-accent transition-colors duration-200" />
                        <span className="font-medium">{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-border/40 bg-surface/20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-background border border-border/50 font-mono">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-background border border-border/50 font-mono">↓</kbd>
              <span className="ml-0.5">navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-background border border-border/50 font-mono">↵</kbd>
              <span className="ml-0.5">select</span>
            </span>
          </div>
          <span className="text-[10px] text-text-muted">
            {loading ? 'Searching...' : 'Type to search'}
          </span>
        </div>
      </div>
    </div>
  );
}
