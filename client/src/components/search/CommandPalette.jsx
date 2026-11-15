import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Timer,
  CheckSquare,
  FileText,
  Calendar,
  Layers,
  Settings,
  PlusCircle,
  Sun,
  Moon,
  RotateCcw,
  BarChart3,
  Flame,
  Award,
  X,
  ArrowRight,
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

  // Live search debounced for query
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

  const commandGroups = [
    {
      group: 'Go to',
      items: [
        { label: 'Today', path: '/', icon: BarChart3 },
        { label: 'Focus', path: '/study', icon: Timer },
        { label: 'Plan > Tasks', path: '/plan?tab=tasks', icon: CheckSquare },
        { label: 'Plan > Week', path: '/plan?tab=week', icon: Calendar },
        { label: 'Plan > Subjects', path: '/plan?tab=subjects', icon: Layers },
        { label: 'Notes', path: '/notes', icon: FileText },
        { label: 'Progress > Streak', path: '/progress?tab=streak', icon: Flame },
        { label: 'Progress > Stats', path: '/progress?tab=stats', icon: BarChart3 },
        { label: 'Progress > Practice', path: '/progress?tab=practice', icon: Award },
        { label: 'Settings', path: '/settings', icon: Settings },
      ],
    },
    {
      group: 'Check in',
      items: [
        { label: 'Morning plan', path: '/?sheet=morning', icon: Sun },
        { label: 'Evening review', path: '/?sheet=evening', icon: Moon },
        { label: 'Review queue', path: '/?sheet=review', icon: RotateCcw },
      ],
    },
    {
      group: 'Create',
      items: [
        { label: 'Start focus timer', path: '/study', icon: Timer },
        { label: 'Add task', path: '/plan?tab=tasks&add=1', icon: CheckSquare },
        { label: 'Add note', path: '/notes?action=new', icon: FileText },
        { label: 'Add subject', path: '/plan?tab=subjects&add=1', icon: Layers },
      ],
    },
  ];

  // Filter commands if query exists
  const filteredGroups = commandGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) =>
        item.label.toLowerCase().includes(query.trim().toLowerCase())
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-[var(--sf)] border border-[var(--ln)] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh] animate-slide-down">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--ln)] gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--soft)] flex items-center justify-center shrink-0">
            <Search className={`w-4 h-4 text-[var(--pr)] ${loading ? 'animate-pulse' : ''}`} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search sessions, tasks, notes..."
            className="w-full bg-transparent text-sm text-[var(--tx)] placeholder:text-[var(--mu)] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[var(--mu)] hover:text-[var(--tx)] rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--sf2)] border border-[var(--ln)] text-[10px] text-[var(--mu)] font-mono">
            ESC
          </kbd>
        </div>

        {/* Commands & Search Results */}
        <div className="overflow-y-auto p-2 space-y-4 text-xs">
          {/* Matched Commands */}
          {filteredGroups.length > 0 && (
            <div className="space-y-3">
              {filteredGroups.map((grp) => (
                <div key={grp.group}>
                  <span className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider px-2 block mb-1 font-mono">
                    {grp.group}
                  </span>
                  <div className="space-y-0.5">
                    {grp.items.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.label}
                          type="button"
                          onClick={() => navigateTo(cmd.path)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--sf2)] text-[var(--tx)] text-left transition-colors cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-md bg-[var(--soft)] flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-[var(--pr)]" />
                          </div>
                          <span className="font-medium flex-1">{cmd.label}</span>
                          <ArrowRight className="w-3 h-3 text-[var(--mu)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Search Results (sessions, tasks, notes, problems) */}
          {results && (
            <div className="space-y-3 pt-2 border-t border-[var(--ln)]">
              {results.sessions?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider px-2 block mb-1 font-mono">
                    Study Sessions
                  </span>
                  {results.sessions.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => navigateTo('/study')}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--sf2)] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Timer className="w-3.5 h-3.5 text-[var(--pr)] shrink-0" />
                        <span className="text-[var(--tx)] font-medium truncate">{s.topic || s.category}</span>
                        <span className="text-[var(--mu)] text-[11px]">({s.category})</span>
                      </div>
                      <span className="text-[var(--mu)] font-mono">{s.focusDuration}m</span>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider px-2 block mb-1 font-mono">
                    Tasks
                  </span>
                  {results.tasks.map((t) => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => navigateTo('/plan?tab=tasks')}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--sf2)] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <CheckSquare className="w-3.5 h-3.5 text-[var(--pr)] shrink-0" />
                        <span className="text-[var(--tx)] font-medium truncate">{t.title}</span>
                      </div>
                      <span className="text-[var(--mu)] font-mono">{t.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.notes?.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-[var(--mu)] uppercase tracking-wider px-2 block mb-1 font-mono">
                    Notes
                  </span>
                  {results.notes.map((n) => (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => navigateTo(`/notes?id=${n._id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--sf2)] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-[var(--pr)] shrink-0" />
                        <span className="text-[var(--tx)] font-medium truncate">{n.title}</span>
                      </div>
                      <span className="text-[var(--mu)] font-mono">{n.folder}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredGroups.length === 0 &&
                !results.sessions?.length &&
                !results.tasks?.length &&
                !results.notes?.length &&
                !results.problems?.length && (
                  <div className="py-10 text-center">
                    <Search className="w-8 h-8 text-[var(--mu)] opacity-30 mx-auto mb-2" />
                    <p className="text-[var(--tx)] font-medium">No matches found for &quot;{query}&quot;</p>
                    <p className="text-[11px] text-[var(--mu)] mt-0.5">Try a different search term</p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
