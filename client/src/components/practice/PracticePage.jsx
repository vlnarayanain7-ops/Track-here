import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Code2,
  GraduationCap,
  Trash2,
  Edit2,
  TrendingUp,
  Target,
  BarChart2,
  BookOpen,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MockTestForm from './MockTestForm';

// Problem Journal components for the CP tab
import ProblemCard from '@/components/problems/ProblemCard';
import ProblemForm from '@/components/problems/ProblemForm';
import AttemptForm from '@/components/problems/AttemptForm';
import AttemptHistory from '@/components/problems/AttemptHistory';
import { useProblems, useProblemStats, useDeleteProblem } from '@/hooks/useProblems';
import { PROBLEM_PLATFORMS, DIFFICULTY_LEVELS } from '@/lib/constants';

import {
  useMockTests,
  useMockTestStats,
  useCreateMockTest,
  useUpdateMockTest,
  useDeleteMockTest,
} from '@/hooks/useMockTests';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatDate } from '@/lib/utils';

export default function PracticePage({ defaultTab }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial tab based on preparationType or query param
  const initialTab =
    searchParams.get('tab') ||
    defaultTab ||
    (user?.preparationType === 'Competitive Programming' || user?.preparationType === 'Placement'
      ? 'problems'
      : 'mockTests');

  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    searchParams.set('tab', tab);
    setSearchParams(searchParams, { replace: true });
  };

  // ==========================================
  // Mock Tests State
  // ==========================================
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testToEdit, setTestToEdit] = useState(null);
  const [testToDelete, setTestToDelete] = useState(null);

  const { data: testsData, isLoading: isLoadingTests } = useMockTests({
    examType: examTypeFilter || undefined,
    search: testSearch || undefined,
  });
  const { data: testStats } = useMockTestStats();

  const createTestMutation = useCreateMockTest();
  const updateTestMutation = useUpdateMockTest();
  const deleteTestMutation = useDeleteMockTest();

  const mockTests = testsData?.data?.tests || testsData?.tests || testsData?.mockTests || [];
  const statsObj = testStats?.data || testStats || {};
  const testMetrics = {
    totalTests: statsObj.totalTests || 0,
    avgScore: statsObj.averagePercentage ?? statsObj.avgScore ?? 0,
    avgAccuracy: statsObj.averageAccuracy ?? statsObj.avgAccuracy ?? 0,
    highestScore: statsObj.highestPercentage ?? statsObj.highestScore ?? 0,
  };

  const handleSaveMockTest = async (payload) => {
    if (testToEdit) {
      await updateTestMutation.mutateAsync({ id: testToEdit._id, data: payload });
    } else {
      await createTestMutation.mutateAsync(payload);
    }
    setIsTestModalOpen(false);
    setTestToEdit(null);
  };

  const handleDeleteMockTest = async () => {
    if (testToDelete) {
      await deleteTestMutation.mutateAsync(testToDelete._id);
      setTestToDelete(null);
    }
  };

  // ==========================================
  // Problem Journal State
  // ==========================================
  const [platform, setPlatform] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [problemStatus, setProblemStatus] = useState('');
  const [problemSearch, setProblemSearch] = useState('');

  const [isProblemFormOpen, setIsProblemFormOpen] = useState(false);
  const [problemToEdit, setProblemToEdit] = useState(null);
  const [activeAttemptProblem, setActiveAttemptProblem] = useState(null);
  const [historyProblem, setHistoryProblem] = useState(null);
  const [problemToDelete, setProblemToDelete] = useState(null);

  const { data: problemsData, isLoading: isLoadingProblems } = useProblems({
    platform: platform || undefined,
    difficulty: difficulty || undefined,
    status: problemStatus || undefined,
    search: problemSearch || undefined,
  });

  const { data: problemStatsData } = useProblemStats();
  const deleteProblemMutation = useDeleteProblem();

  const problems = problemsData?.problems || [];
  const problemMetrics = problemStatsData || { total: 0, solved: 0, solvedIndependently: 0 };

  const handleConfirmDeleteProblem = async () => {
    if (problemToDelete) {
      await deleteProblemMutation.mutateAsync(problemToDelete);
      setProblemToDelete(null);
    }
  };

  // Sync tab with URL and handle quick action "new"
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || defaultTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    if (searchParams.get('action') === 'new') {
      if (tabFromUrl === 'problems' || activeTab === 'problems') {
        setIsProblemFormOpen(true);
      } else {
        setIsTestModalOpen(true);
      }
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, defaultTab, activeTab]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Practice &amp; Performance Tracker
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Track full-length mock tests, sectional papers, and algorithmic problem-solving in one adaptive hub
            </p>
          </div>
        </div>

        {/* Action Button depending on active tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'mockTests' ? (
            <Button
              onClick={() => {
                setTestToEdit(null);
                setIsTestModalOpen(true);
              }}
              icon={Plus}
              size="sm"
            >
              Log Mock Test
            </Button>
          ) : (
            <Button
              onClick={() => {
                setProblemToEdit(null);
                setIsProblemFormOpen(true);
              }}
              icon={Plus}
              size="sm"
            >
              Track Problem
            </Button>
          )}
        </div>
      </div>

      {/* Premium Tab Switcher */}
      <div className="flex items-center gap-2 bg-surface p-1 rounded-2xl border border-border w-fit overflow-x-auto">
        <button
          onClick={() => handleTabChange('mockTests')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
            activeTab === 'mockTests'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-card/60'
          )}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Mock Tests &amp; Exam Papers</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-card border border-border">
            {testMetrics.totalTests || mockTests.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('problems')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150',
            activeTab === 'problems'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-card/60'
          )}
        >
          <Code2 className="w-4 h-4" />
          <span>Problem Journal (CP / LeetCode)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-card border border-border">
            {problemMetrics.total || problems.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MOCK TESTS & EXAM PAPERS */}
      {/* ========================================================================= */}
      {activeTab === 'mockTests' && (
        <div className="space-y-6">
          {/* Summary Stats Cards (Neutral Design System) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="card p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--muted)] font-medium">Total Tests Logged</span>
                <p className="text-2xl font-extrabold font-mono text-[var(--text)] mt-1">
                  {testMetrics.totalTests || 0}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)]">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>

            <div className="card p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--muted)] font-medium">Average Score</span>
                <p className="text-2xl font-extrabold font-mono text-[var(--text)] mt-1">
                  {testMetrics.avgScore || 0}%
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="card p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--muted)] font-medium">Average Accuracy</span>
                <p className="text-2xl font-extrabold font-mono text-[var(--text)] mt-1">
                  {testMetrics.avgAccuracy || 0}%
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--primary)]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="card p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--muted)] font-medium">Highest Score</span>
                <p className="text-2xl font-extrabold font-mono text-[var(--text)] mt-1">
                  {testMetrics.highestScore || 0}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[var(--warn)]">
                <Target className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface/30 p-3 rounded-xl border border-border">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search mock test titles or notes..."
                className="pl-8 text-xs h-8"
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                className="text-xs h-8"
                value={examTypeFilter}
                onChange={(e) => setExamTypeFilter(e.target.value)}
              >
                <option value="">All Exam Types</option>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
                <option value="UPSC">UPSC</option>
                <option value="GATE">GATE</option>
                <option value="University">University</option>
                <option value="Placement">Placement</option>
                <option value="Competitive Programming">CP</option>
                <option value="Custom">Custom</option>
              </Select>
            </div>
          </div>

          {/* Mock Tests List */}
          {isLoadingTests ? (
            <div className="p-12 text-center text-xs text-text-muted font-mono animate-pulse">
              Loading test scorecards...
            </div>
          ) : mockTests.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No mock test scorecards logged yet"
              description="Record your mock test papers, sectional exams, and practice tests to track score progression and spot weak topics."
              action={
                <Button
                  onClick={() => {
                    setTestToEdit(null);
                    setIsTestModalOpen(true);
                  }}
                  icon={Plus}
                  size="sm"
                >
                  Log Your First Mock Test
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockTests.map((test) => {
                const scorePct =
                  test.totalMarks > 0
                    ? Math.round((test.obtainedMarks / test.totalMarks) * 100)
                    : 0;

                return (
                  <Card
                    key={test._id}
                    className="bg-card border-border hover:border-border-light transition-all flex flex-col justify-between"
                  >
                    <CardContent className="p-4 space-y-3.5">
                      {/* Top Meta */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
                              {test.examType}
                            </span>
                            <span className="text-[11px] text-text-muted font-mono">
                              {formatDate(test.testDate)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm text-text-primary line-clamp-1">
                            {test.title}
                          </h3>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setTestToEdit(test);
                              setIsTestModalOpen(true);
                            }}
                            className="p-1.5 text-text-muted hover:text-accent rounded hover:bg-surface transition-colors"
                            title="Edit Scorecard"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTestToDelete(test)}
                            className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-surface transition-colors"
                            title="Delete Scorecard"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main Scorecard Badge Box */}
                      <div className="p-3 rounded-lg bg-surface/50 border border-border flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
                            Total Score
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-bold font-mono text-text-primary">
                              {test.obtainedMarks}
                            </span>
                            <span className="text-xs text-text-muted font-mono">
                              / {test.totalMarks}
                            </span>
                            <span
                              className={cn(
                                'ml-2 text-xs font-mono font-semibold px-1.5 py-0.5 rounded',
                                scorePct >= 75
                                  ? 'bg-success/15 text-success'
                                  : scorePct >= 50
                                  ? 'bg-warning/15 text-warning'
                                  : 'bg-danger/15 text-danger'
                              )}
                            >
                              {scorePct}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
                            Accuracy
                          </span>
                          <p className="text-lg font-bold font-mono text-success mt-0.5">
                            {test.accuracy || 0}%
                          </p>
                          {test.durationMinutes > 0 && (
                            <span className="text-[10px] text-text-muted flex items-center justify-end gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {test.durationMinutes}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Questions Breakdown Bar */}
                      {(test.correctCount > 0 ||
                        test.incorrectCount > 0 ||
                        test.unattemptedCount > 0) && (
                        <div className="flex items-center justify-between text-[11px] font-mono px-1 py-1 rounded bg-surface/30">
                          <span className="text-success flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {test.correctCount || 0} Correct
                          </span>
                          <span className="text-danger flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {test.incorrectCount || 0} Incorrect
                          </span>
                          <span className="text-text-muted flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {test.unattemptedCount || 0} Left
                          </span>
                        </div>
                      )}

                      {/* Sectional Subject Breakdown */}
                      {test.subjectScores && test.subjectScores.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider block">
                            Subject Breakdown
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {test.subjectScores.map((sub, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded bg-surface border border-border/60 text-center"
                              >
                                <span className="text-[10px] text-text-secondary truncate block">
                                  {sub.subject}
                                </span>
                                <span className="text-[11px] font-mono font-semibold text-text-primary">
                                  {sub.obtainedMarks} / {sub.totalMarks}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Weak Topics */}
                      {test.weakTopics && test.weakTopics.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-medium text-warning uppercase tracking-wider block mb-1">
                            Topics to Revise:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {test.weakTopics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[10px] bg-warning/10 text-warning border border-warning/20 font-mono"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mistakes / Notes */}
                      {test.mistakes && (
                        <div className="p-2 rounded bg-surface text-[11px] text-text-secondary italic border-l-2 border-danger">
                          &quot;{test.mistakes}&quot;
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROBLEM JOURNAL (CP / LEETCODE) */}
      {/* ========================================================================= */}
      {activeTab === 'problems' && (
        <div className="space-y-6">
          {/* Mini Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary">Problems Tracked</span>
                <p className="text-xl font-bold font-mono text-text-primary mt-0.5">
                  {problemMetrics.total || 0}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-accent">
                <Target className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary">Solved</span>
                <p className="text-xl font-bold font-mono text-success mt-0.5">
                  {problemMetrics.solved || 0}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-success">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary">Solved Independently</span>
                <p className="text-xl font-bold font-mono text-warning mt-0.5">
                  {problemMetrics.solvedIndependently || 0}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-warning">
                <Award className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-surface/30 p-3 rounded-xl border border-border">
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Search problem title, tag..."
                className="pl-8 text-xs h-8"
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select
                className="text-xs h-8 w-28"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="">Platform</option>
                {PROBLEM_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>

              <Select
                className="text-xs h-8 w-28"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">Difficulty</option>
                {DIFFICULTY_LEVELS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>

              <Select
                className="text-xs h-8 w-28"
                value={problemStatus}
                onChange={(e) => setProblemStatus(e.target.value)}
              >
                <option value="">Status</option>
                <option value="Unsolved">Unsolved</option>
                <option value="Attempted">Attempted</option>
                <option value="Solved">Solved</option>
                <option value="Mastered">Mastered</option>
              </Select>
            </div>
          </div>

          {/* Problems List */}
          {isLoadingProblems ? (
            <div className="p-12 text-center text-xs text-text-muted font-mono animate-pulse">
              Loading problems...
            </div>
          ) : problems.length === 0 ? (
            <EmptyState
              icon={Code2}
              title="No problems logged yet"
              description="Track tricky DSA problems, your attempts, complexity analyses, and takeaways."
              action={
                <Button
                  onClick={() => {
                    setProblemToEdit(null);
                    setIsProblemFormOpen(true);
                  }}
                  icon={Plus}
                  size="sm"
                >
                  Track Problem
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {problems.map((problem) => (
                <ProblemCard
                  key={problem._id}
                  problem={problem}
                  onEdit={(p) => {
                    setProblemToEdit(p);
                    setIsProblemFormOpen(true);
                  }}
                  onDelete={(id) => setProblemToDelete(id)}
                  onAddAttempt={(p) => setActiveAttemptProblem(p)}
                  onViewHistory={(p) => setHistoryProblem(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <MockTestForm
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setTestToEdit(null);
        }}
        onSubmit={handleSaveMockTest}
        initialData={testToEdit}
        isLoading={createTestMutation.isPending || updateTestMutation.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(testToDelete)}
        onClose={() => setTestToDelete(null)}
        onConfirm={handleDeleteMockTest}
        title="Delete Mock Test Scorecard"
        message={`Are you sure you want to delete "${testToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {isProblemFormOpen && (
        <ProblemForm
          isOpen={isProblemFormOpen}
          onClose={() => {
            setIsProblemFormOpen(false);
            setProblemToEdit(null);
          }}
          problemToEdit={problemToEdit}
        />
      )}

      {activeAttemptProblem && (
        <AttemptForm
          isOpen={Boolean(activeAttemptProblem)}
          onClose={() => setActiveAttemptProblem(null)}
          problem={activeAttemptProblem}
        />
      )}

      {historyProblem && (
        <AttemptHistory
          isOpen={Boolean(historyProblem)}
          onClose={() => setHistoryProblem(null)}
          problem={historyProblem}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(problemToDelete)}
        onClose={() => setProblemToDelete(null)}
        onConfirm={handleConfirmDeleteProblem}
        title="Delete Problem"
        message="Are you sure you want to delete this problem and all its attempt history?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
