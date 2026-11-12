import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProblemCard from './ProblemCard';
import ProblemForm from './ProblemForm';
import AttemptForm from './AttemptForm';
import AttemptHistory from './AttemptHistory';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PROBLEM_PLATFORMS, DIFFICULTY_LEVELS } from '@/lib/constants';
import { useProblems, useProblemStats, useDeleteProblem } from '@/hooks/useProblems';
import { Plus, Code2, Search, X, CheckCircle2, Award, Target } from 'lucide-react';

export default function ProblemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [platform, setPlatform] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isProblemFormOpen, setIsProblemFormOpen] = useState(false);
  const [problemToEdit, setProblemToEdit] = useState(null);
  const [activeAttemptProblem, setActiveAttemptProblem] = useState(null);
  const [historyProblem, setHistoryProblem] = useState(null);
  const [problemToDelete, setProblemToDelete] = useState(null);

  // Check URL query parameters
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsProblemFormOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const { data: problemsData, isLoading } = useProblems({
    platform: platform || undefined,
    difficulty: difficulty || undefined,
    status: status || undefined,
    search: search || undefined,
  });

  const { data: statsData } = useProblemStats();
  const deleteMutation = useDeleteProblem();

  const problems = problemsData?.problems || [];
  const stats = statsData || { total: 0, solved: 0, solvedIndependently: 0 };

  const handleConfirmDelete = async () => {
    if (problemToDelete) {
      await deleteMutation.mutateAsync(problemToDelete);
      setProblemToDelete(null);
    }
  };

  const hasFilters = !!platform || !!difficulty || !!status || !!search;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center border border-accent/30 shrink-0">
            <Code2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Competitive Programming Journal
            </h1>
            <p className="text-[11px] text-text-muted mt-0.5">
              Log algorithmic problems, record attempts, track complexities and learnings
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setProblemToEdit(null);
            setIsProblemFormOpen(true);
          }}
          icon={Plus}
          size="sm"
          className="text-xs shrink-0"
        >
          Track Problem
        </Button>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface/50 border border-border/70 flex items-center justify-between hover:border-border-light transition-colors">
          <div>
            <span className="text-[11px] text-text-muted uppercase tracking-wider font-mono">Problems Tracked</span>
            <p className="text-xl font-bold font-mono text-text-primary mt-0.5">{stats.total || 0}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-accent border border-border/60">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface/50 border border-border/70 flex items-center justify-between hover:border-border-light transition-colors">
          <div>
            <span className="text-[11px] text-text-muted uppercase tracking-wider font-mono">Problems Solved</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {stats.solved || 0}{' '}
              <span className="text-xs text-text-muted font-normal">
                ({stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%)
              </span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-emerald-400 border border-border/60">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface/50 border border-border/70 flex items-center justify-between hover:border-border-light transition-colors">
          <div>
            <span className="text-[11px] text-text-muted uppercase tracking-wider font-mono">Solved Independently</span>
            <p className="text-xl font-bold font-mono text-accent mt-0.5">
              {stats.solvedIndependently || 0}{' '}
              <span className="text-xs text-text-muted font-normal">
                (
                {stats.solved > 0
                  ? Math.round((stats.solvedIndependently / stats.solved) * 100)
                  : 0}
                %)
              </span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-accent border border-border/60">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-surface/30 rounded-xl border border-border/70 backdrop-blur-sm">
        <div className="w-44 relative">
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs pl-8 h-8"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>

        <div className="w-36">
          <Select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="text-xs h-8"
          >
            <option value="">All Platforms</option>
            {PROBLEM_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-32">
          <Select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="text-xs h-8"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTY_LEVELS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-32">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs h-8"
          >
            <option value="">All Statuses</option>
            <option value="Unsolved">Unsolved</option>
            <option value="Attempted">Attempted</option>
            <option value="Solved">Solved</option>
          </Select>
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setPlatform('');
              setDifficulty('');
              setStatus('');
              setSearch('');
            }}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
            title="Reset filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {hasFilters && (
          <span className="text-[10px] text-text-muted font-mono ml-auto">
            {problems.length} result{problems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Problem Grid */}
      {problems.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="No problems found"
          description={
            hasFilters
              ? 'Try modifying your search or filters.'
              : 'Add your first LeetCode, Codeforces, or CodeChef problem to track attempts.'
          }
          actionLabel="Add Problem"
          onAction={() => {
            setProblemToEdit(null);
            setIsProblemFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((prob) => (
            <ProblemCard
              key={prob._id}
              problem={prob}
              onLogAttempt={(p) => setActiveAttemptProblem(p)}
              onViewHistory={(p) => setHistoryProblem(p)}
              onEdit={(p) => {
                setProblemToEdit(p);
                setIsProblemFormOpen(true);
              }}
              onDelete={(id) => setProblemToDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Problem Dialog */}
      <ProblemForm
        isOpen={isProblemFormOpen}
        onClose={() => {
          setIsProblemFormOpen(false);
          setProblemToEdit(null);
        }}
        problemToEdit={problemToEdit}
      />

      {/* Log Attempt Dialog */}
      <AttemptForm
        isOpen={!!activeAttemptProblem}
        onClose={() => setActiveAttemptProblem(null)}
        problem={activeAttemptProblem}
      />

      {/* View Attempt History Dialog */}
      <AttemptHistory
        isOpen={!!historyProblem}
        onClose={() => setHistoryProblem(null)}
        problem={historyProblem}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!problemToDelete}
        onClose={() => setProblemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Problem"
        description="Are you sure you want to delete this problem and all its associated attempts?"
        confirmText="Delete Problem"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
