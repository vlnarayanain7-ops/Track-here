import { useState } from 'react';
import RevisionCard from './RevisionCard';
import RevisionForm from './RevisionForm';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useRevisions, useDeleteRevision } from '@/hooks/useRevisions';
import { RotateCcw, Plus } from 'lucide-react';
import { isToday, isFuture, isPast, parseISO } from 'date-fns';

export default function RevisionsPage() {
  const [activeTab, setActiveTab] = useState('due');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [revisionToDelete, setRevisionToDelete] = useState(null);

  const { data: revisions = [], isLoading } = useRevisions();
  const deleteMutation = useDeleteRevision();

  const handleConfirmDelete = async () => {
    if (revisionToDelete) {
      await deleteMutation.mutateAsync(revisionToDelete);
      setRevisionToDelete(null);
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

  const dueTodayCount = revisions.filter(
    (r) => r.dueDate && isToday(new Date(r.dueDate)) && r.status !== 'completed'
  ).length;

  const overdueCount = revisions.filter(
    (r) => r.dueDate && isPast(new Date(r.dueDate)) && !isToday(new Date(r.dueDate)) && r.status !== 'completed'
  ).length;

  const tabs = [
    { id: 'due', label: 'Due Today', count: dueTodayCount, countColor: 'bg-accent/20 text-accent' },
    { id: 'overdue', label: 'Overdue', count: overdueCount, countColor: 'bg-rose-500/20 text-rose-400' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'all', label: `All Items (${revisions.length})` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/15 flex items-center justify-center border border-purple/30 shrink-0">
            <RotateCcw className="w-5 h-5 text-purple" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Spaced Repetition & Revision Manager
            </h1>
            <p className="text-[11px] text-text-muted mt-0.5">
              Retain algorithms, topics and problems with active recall and adaptive spaced intervals
            </p>
          </div>
        </div>

        <Button onClick={() => setIsFormOpen(true)} icon={Plus} size="sm" className="text-xs shrink-0">
          Queue Revision
        </Button>
      </div>

      {/* Premium Tabs */}
      <div className="flex bg-surface/50 p-1 rounded-xl border border-border/60 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-card text-text-primary shadow-sm border border-border/80'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`min-w-[20px] h-5 px-1 rounded-full text-[10px] flex items-center justify-center font-mono ${tab.countColor}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Revisions Grid */}
      {filteredRevisions.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title={`No ${activeTab} revisions`}
          description={
            activeTab === 'due'
              ? 'All caught up for today! Add topics or problems you want to remember permanently.'
              : `No items found in your ${activeTab} revision queue.`
          }
          actionLabel="Queue a Revision"
          onAction={() => setIsFormOpen(true)}
        />
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

      {/* Add dialog */}
      <RevisionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!revisionToDelete}
        onClose={() => setRevisionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Revision Item"
        description="Are you sure you want to remove this item from your spaced repetition schedule?"
        confirmText="Remove"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
