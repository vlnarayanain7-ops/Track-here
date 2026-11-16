import { useState } from 'react';
import RevisionCard from './RevisionCard';
import RevisionForm from './RevisionForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useRevisions, useDeleteRevision, useCreateRevision } from '@/hooks/useRevisions';
import { RotateCcw, Plus, CheckCircle2 } from 'lucide-react';
import { isToday, isFuture, isPast, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function RevisionsPage() {
  const [activeTab, setActiveTab] = useState('due');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [revisionToDelete, setRevisionToDelete] = useState(null);

  const { data: rawRevisions, isLoading, refetch } = useRevisions();
  const revisions = Array.isArray(rawRevisions)
    ? rawRevisions
    : Array.isArray(rawRevisions?.revisions)
    ? rawRevisions.revisions
    : Array.isArray(rawRevisions?.data)
    ? rawRevisions.data
    : Array.isArray(rawRevisions?.data?.revisions)
    ? rawRevisions.data.revisions
    : [];

  const deleteMutation = useDeleteRevision();
  const createMutation = useCreateRevision();

  const handleConfirmDelete = async () => {
    if (revisionToDelete) {
      await deleteMutation.mutateAsync(revisionToDelete);
      setRevisionToDelete(null);
      refetch();
    }
  };

  const handleQuickAdd = async (e) => {
    if (e.key === 'Enter' && inlineTitle.trim()) {
      e.preventDefault();
      try {
        await createMutation.mutateAsync({
          title: inlineTitle.trim(),
          type: 'topic',
          dueDate: new Date().toISOString(),
          intervalDays: 1,
        });
        setInlineTitle('');
        setShowInlineAdd(false);
        toast.success('Topic added to review queue');
        refetch();
      } catch {
        toast.error('Failed to add topic');
      }
    } else if (e.key === 'Escape') {
      setShowInlineAdd(false);
      setInlineTitle('');
    }
  };

  const filteredRevisions = revisions.filter((rev) => {
    if (!rev.dueDate) return activeTab === 'all';
    const d = typeof rev.dueDate === 'string' ? parseISO(rev.dueDate) : rev.dueDate;

    if (activeTab === 'due') {
      return isToday(d) && rev.status !== 'completed';
    }
    if (activeTab === 'overdue') {
      return isPast(d) && !isToday(d) && rev.status !== 'completed';
    }
    if (activeTab === 'upcoming') {
      return isFuture(d) && !isToday(d);
    }
    return true;
  });

  const dueTodayCount = revisions.filter((r) => {
    if (!r.dueDate || r.status === 'completed') return false;
    const d = typeof r.dueDate === 'string' ? parseISO(r.dueDate) : r.dueDate;
    return isToday(d);
  }).length;

  const overdueCount = revisions.filter((r) => {
    if (!r.dueDate || r.status === 'completed') return false;
    const d = typeof r.dueDate === 'string' ? parseISO(r.dueDate) : r.dueDate;
    return isPast(d) && !isToday(d);
  }).length;

  const upcomingCount = revisions.filter((r) => {
    if (!r.dueDate) return false;
    const d = typeof r.dueDate === 'string' ? parseISO(r.dueDate) : r.dueDate;
    return isFuture(d) && !isToday(d);
  }).length;

  const tabs = [
    { id: 'due', label: 'Due today', count: dueTodayCount },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { id: 'all', label: 'All items', count: revisions.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full text-[var(--text)]">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-[24px] font-bold font-heading tracking-tight text-[var(--text)] m-0">
            Spaced Repetition & Revision Manager
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Retain algorithms, topics and problems with active recall and adaptive spaced intervals
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowInlineAdd(true)}
            className="btn btn-secondary text-xs h-9 px-3 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick add</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary text-xs h-9 px-3.5 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Queue Revision</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Inline Add Bar */}
      {showInlineAdd && (
        <div className="p-3.5 rounded-2xl border border-[var(--primary)] bg-[var(--surface)] shadow-xs animate-fade-in">
          <input
            type="text"
            autoFocus
            value={inlineTitle}
            onChange={(e) => setInlineTitle(e.target.value)}
            onKeyDown={handleQuickAdd}
            onBlur={() => {
              if (!inlineTitle.trim()) setShowInlineAdd(false);
            }}
            placeholder="Type topic name (e.g. Dynamic Programming, Virtual DOM) and press Enter (Esc to cancel)..."
            className="w-full h-10 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--text)] text-xs outline-none focus:border-[var(--primary)] font-medium"
          />
        </div>
      )}

      {/* 3. Calm Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                    isActive ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'bg-[var(--line)] text-[var(--muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Revisions Cards Grid */}
      {filteredRevisions.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--text)] font-heading">
            {activeTab === 'due' ? 'All caught up for today!' : 'No items found'}
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mt-1 mb-4">
            {activeTab === 'due'
              ? 'Great consistency. You have no pending active recall items due today.'
              : `There are currently no items in the ${activeTab} queue.`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="btn btn-primary text-xs h-9 px-4 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Queue a Revision</span>
            </button>
            <button
              type="button"
              onClick={() => setShowInlineAdd(true)}
              className="btn btn-secondary text-xs h-9 px-3 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick add topic</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRevisions.map((rev) => (
            <RevisionCard
              key={rev._id}
              revision={rev}
              onDelete={(id) => setRevisionToDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Add Dialog Modal */}
      <RevisionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      {/* Delete confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!revisionToDelete}
        onClose={() => setRevisionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove item from review"
        description="Are you sure you want to remove this topic from your active recall schedule?"
      />
    </div>
  );
}
