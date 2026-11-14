import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Check, Clock, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { useStreakData, useAnalytics } from '@/hooks/useAnalytics';
import { useProblems, useCreateProblem } from '@/hooks/useProblems';
import { useMockTests, useCreateMockTest } from '@/hooks/useMockTests';
import { StatsPanel } from '@/components/StatsPanel';
import { MonthHeatmap } from '@/components/MonthHeatmap';
import SideSheet from '@/components/SideSheet';
import { plural } from '@/lib/plural';
import { toast } from 'react-hot-toast';

function formatCellTooltip(dateStr, minutes) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  const dateFormatted = `${dayName}, ${monthName} ${d}, ${y}`;
  if (!minutes || minutes <= 0) {
    return `${dateFormatted} · 0m`;
  }
  const h = Math.floor(minutes / 60);
  const rem = minutes % 60;
  const timeFormatted = h > 0 ? (rem > 0 ? `${h}h ${rem}m` : `${h}h`) : `${rem}m`;
  return `${dateFormatted} · ${timeFormatted}`;
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function ProgressPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'streak';
  const tab = rawTab.toLowerCase();

  const setTab = (t) => {
    setSearchParams({ tab: t });
  };

  // Queries
  const [statsRange, setStatsRange] = useState('week');
  const { data: streakData, isLoading: streakLoading } = useStreakData();
  const { data: analyticsData } = useAnalytics({ range: statsRange });
  const { data: problemsData } = useProblems();
  const { data: mockTestsData } = useMockTests();

  const createProblemMutation = useCreateProblem();
  const createMockTestMutation = useCreateMockTest();

  // Dialog / SideSheet state for Log Practice
  const [logPracticeOpen, setLogPracticeOpen] = useState(false);
  const [practiceType, setPracticeType] = useState('problem'); // 'problem' | 'mockTest'
  const [practiceTitle, setPracticeTitle] = useState('');
  const [practiceStatus, setPracticeStatus] = useState('Solved'); // 'Solved' | 'Review'
  const [practiceSubject, setPracticeSubject] = useState('');
  const [mockScore, setMockScore] = useState('');
  const [mockTotal, setMockTotal] = useState('');

  // Handle action param from Top Bar Add menu (e.g. ?tab=practice&action=mockTest)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'mockTest' || action === 'mock') {
      setPracticeType('mockTest');
      setLogPracticeOpen(true);
    } else if (action === 'problem') {
      setPracticeType('problem');
      setLogPracticeOpen(true);
    }
  }, [searchParams]);

  // Values from single source of truth
  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;
  const activeDaysThisYear = streakData?.activeDaysThisYear ?? 0;
  const nextMilestone = streakData?.nextMilestone ?? 3;
  const history = streakData?.history || [];
  const last7Days = streakData?.last7Days || [];

  // Shared single source of truth for minutes per local day (covers at least 371 days)
  const minutesByDay = useMemo(() => {
    const map = new Map();
    if (Array.isArray(history)) {
      history.forEach((h) => {
        if (h?.date) map.set(h.date, h.minutes || 0);
      });
    } else if (streakData?.byDay) {
      Object.entries(streakData.byDay).forEach(([k, v]) => map.set(k, v || 0));
    }
    return map;
  }, [history, streakData]);

  // Practice items
  const practiceItems = useMemo(() => {
    const list = [];
    const problems = problemsData?.problems || problemsData || [];
    if (Array.isArray(problems)) {
      for (const p of problems) {
        list.push({
          id: p._id || p.id,
          title: p.name || p.title || 'Problem',
          type: 'problem',
          status: p.status === 'Solved' || p.isSolved ? 'Solved' : 'Review',
          date: p.createdAt || p.date,
        });
      }
    }
    const mockTests = mockTestsData?.mockTests || mockTestsData || [];
    if (Array.isArray(mockTests)) {
      for (const m of mockTests) {
        list.push({
          id: m._id || m.id,
          title: m.title || m.name || 'Mock test',
          type: 'mock',
          status: m.obtainedMarks !== undefined ? `${m.obtainedMarks}/${m.totalMarks || 100}` : 'Solved',
          date: m.testDate || m.date || m.createdAt,
        });
      }
    }
    return list;
  }, [problemsData, mockTestsData]);

  // Handle Log Practice submission
  const handleSavePractice = async (e) => {
    e.preventDefault();
    if (!practiceTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      if (practiceType === 'problem') {
        await createProblemMutation.mutateAsync({
          name: practiceTitle.trim(),
          topic: practiceSubject.trim() || 'General',
          status: practiceStatus === 'Solved' ? 'Solved' : 'Attempted',
          difficulty: 'Medium',
          platform: 'LeetCode',
        });
        toast.success('Problem logged');
      } else {
        await createMockTestMutation.mutateAsync({
          title: practiceTitle.trim(),
          examType: 'Custom',
          obtainedMarks: Number(mockScore) || 0,
          totalMarks: Number(mockTotal) || 100,
          testDate: new Date().toISOString(),
        });
        toast.success('Mock test logged');
      }
      setPracticeTitle('');
      setMockScore('');
      setMockTotal('');
      setLogPracticeOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to log practice');
    }
  };

  return (
    <div className="w-full max-w-[960px] mx-auto space-y-4">
      <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--tx)]">Progress</h1>

      {/* Tabs: Streak | Stats | Practice */}
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'streak'}
          onClick={() => setTab('streak')}
          className={`tb ${tab === 'streak' ? 'on' : ''}`}
        >
          Streak
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'stats'}
          onClick={() => setTab('stats')}
          className={`tb ${tab === 'stats' ? 'on' : ''}`}
        >
          Stats
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'practice'}
          onClick={() => setTab('practice')}
          className={`tb ${tab === 'practice' ? 'on' : ''}`}
        >
          Practice
        </button>
      </div>

      {/* TAB 1: STREAK (LeetCode style month heatmap) */}
      {tab === 'streak' && (
        <div className="space-y-5 animate-fade-in">
          {/* Three plain numbers */}
          <div className="nums">
            <div>
              <b>{currentStreak}</b>
              <span>day streak</span>
            </div>
            <div>
              <b>{longestStreak}</b>
              <span>longest streak</span>
            </div>
            <div>
              <b>{activeDaysThisYear}</b>
              <span>active days this year</span>
            </div>
          </div>

          {/* This week row of 7 dots */}
          <div className="week">
            <span>This week</span>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, i) => {
              const dayData = last7Days[i];
              const isOn = dayData ? dayData.isActive : false;
              return (
                <i key={i} className={isOn ? 'on' : ''}>
                  {dayChar}
                </i>
              );
            })}
          </div>

          {/* LeetCode Month Heatmap */}
          <div className="card">
            <MonthHeatmap minutesByDay={minutesByDay} />
          </div>

          {/* Streak rule note */}
          <p className="note" style={{ marginTop: '12px' }}>
            25+ focused minutes in a day counts toward your streak.
          </p>
        </div>
      )}

      {/* TAB 2: STATS */}
      {tab === 'stats' && (
        <div className="animate-fade-in">
          <StatsPanel
            minutesByDay={minutesByDay}
            bySubject={analyticsData?.bySubject || []}
            onRangeChange={(r) => setStatsRange(r)}
          />
        </div>
      )}

      {/* TAB 3: PRACTICE */}
      {tab === 'practice' && (
        <div className="space-y-4 animate-fade-in">
          <div className="sec" style={{ marginTop: 0 }}>
            <span className="note">Mock tests and problems you log</span>
            <button
              type="button"
              onClick={() => setLogPracticeOpen(true)}
              className="btn flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Log practice
            </button>
          </div>

          {/* Practice List */}
          {practiceItems.length === 0 ? (
            <p className="note py-6 text-center text-xs">No practice logged yet.</p>
          ) : (
            <div className="space-y-2">
              {practiceItems.map((item) => (
                <div key={item.id} className="row">
                  <span className="g">{item.title}</span>
                  <span
                    className="pill"
                    style={
                      item.status === 'Solved'
                        ? { background: 'var(--soft)', color: 'var(--pr)' }
                        : { background: 'var(--sf2)', color: 'var(--mu)' }
                    }
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SideSheet to Log Practice */}
      <SideSheet
        open={logPracticeOpen}
        isOpen={logPracticeOpen}
        onClose={() => setLogPracticeOpen(false)}
        title="Log Practice"
      >
        <form onSubmit={handleSavePractice} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-medium text-[var(--mu)] mb-1">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPracticeType('problem')}
                className={`btn flex-1 ${practiceType === 'problem' ? 'btn-primary' : ''}`}
              >
                Problem
              </button>
              <button
                type="button"
                onClick={() => setPracticeType('mockTest')}
                className={`btn flex-1 ${practiceType === 'mockTest' ? 'btn-primary' : ''}`}
              >
                Mock Test
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--mu)] mb-1">Title</label>
            <input
              type="text"
              value={practiceTitle}
              onChange={(e) => setPracticeTitle(e.target.value)}
              placeholder={practiceType === 'problem' ? 'e.g., Shortest path in graph' : 'e.g., Mock Exam 1'}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--mu)] mb-1">Subject / Category</label>
            <input
              type="text"
              value={practiceSubject}
              onChange={(e) => setPracticeSubject(e.target.value)}
              placeholder="e.g., Algorithms"
              className="input w-full"
            />
          </div>

          {practiceType === 'problem' ? (
            <div>
              <label className="block text-xs font-medium text-[var(--mu)] mb-1">Status</label>
              <select
                value={practiceStatus}
                onChange={(e) => setPracticeStatus(e.target.value)}
                className="input w-full cursor-pointer"
              >
                <option value="Solved">Solved</option>
                <option value="Review">Review</option>
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--mu)] mb-1">Score</label>
                <input
                  type="number"
                  value={mockScore}
                  onChange={(e) => setMockScore(e.target.value)}
                  placeholder="85"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--mu)] mb-1">Total Marks</label>
                <input
                  type="number"
                  value={mockTotal}
                  onChange={(e) => setMockTotal(e.target.value)}
                  placeholder="100"
                  className="input w-full"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLogPracticeOpen(false)}
              className="btn"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Practice
            </button>
          </div>
        </form>
      </SideSheet>
    </div>
  );
}
