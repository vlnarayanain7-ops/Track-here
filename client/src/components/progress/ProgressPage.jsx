import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Check, Clock, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { useStreakData, useAnalytics } from '@/hooks/useAnalytics';
import { useProblems, useCreateProblem } from '@/hooks/useProblems';
import { useMockTests, useCreateMockTest } from '@/hooks/useMockTests';
import SideSheet from '@/components/ui/SideSheet';
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
  const { data: streakData, isLoading: streakLoading } = useStreakData();
  const { data: analyticsData } = useAnalytics();
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

  // Heatmap rendering logic (GitHub / LeetCode style calendar, 53 weeks)
  const heatmapData = useMemo(() => {
    const W = 53;
    const C = 12;
    const lv = (m) => (m <= 0 ? 0 : m < 25 ? 1 : m < 60 ? 2 : m < 120 ? 3 : m < 240 ? 4 : 5);

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Monday of 52 weeks ago
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek - 52 * 7);

    // Index history by YYYY-MM-DD
    const minutesByDate = {};
    if (Array.isArray(history)) {
      history.forEach((h) => {
        if (h?.date) minutesByDate[h.date] = h.minutes || 0;
      });
    }

    const monthSpans = [];
    const cells = [];
    let prevMonth = -1;

    for (let w = 0; w < W; w++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + w * 7);
      const mo = weekStartDate.getMonth();

      if (mo !== prevMonth) {
        const shortMonth = weekStartDate.toLocaleDateString('en-US', { month: 'short' });
        monthSpans.push(
          <span
            key={`m-${w}`}
            style={{ gridColumn: w + 2, gridRow: 1 }}
            className="font-medium text-[var(--mu)] text-xs select-none"
          >
            {shortMonth}
          </span>
        );
        prevMonth = mo;
      }

      for (let r = 0; r < 7; r++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * 7 + r);
        const y = cellDate.getFullYear();
        const m = String(cellDate.getMonth() + 1).padStart(2, '0');
        const d = String(cellDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const isFuture = cellDate > today;
        const minutes = isFuture ? 0 : (minutesByDate[dateStr] || 0);
        const level = isFuture ? 0 : lv(minutes);
        const tooltip = isFuture
          ? cellDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
          : formatCellTooltip(dateStr, minutes);

        cells.push(
          <i
            key={`cell-${w}-${r}`}
            title={tooltip}
            data-date={dateStr}
            data-minutes={minutes}
            style={{
              gridColumn: w + 2,
              gridRow: r + 2,
              width: `${C}px`,
              height: `${C}px`,
              borderRadius: '3px',
              backgroundColor: isFuture ? 'transparent' : `var(--h${level})`,
              border: isFuture ? '1px dashed var(--ln)' : undefined,
              opacity: isFuture ? 0.35 : 1,
            }}
          />
        );
      }
    }

    const dayLabels = ['Mon', 'Wed', 'Fri'].map((x, i) => (
      <span
        key={x}
        style={{
          gridColumn: 1,
          gridRow: i * 2 + 2,
          lineHeight: `${C}px`,
        }}
        className="text-[var(--mu)] text-xs select-none"
      >
        {x}
      </span>
    ));

    return {
      monthSpans,
      dayLabels,
      cells,
      W,
      C,
    };
  }, [history]);

  // Stats tab calculations
  const totalMinutesThisWeek = useMemo(() => {
    return last7Days.reduce((acc, d) => acc + (d.minutes || 0), 0);
  }, [last7Days]);

  const sessionsIn30Days = analyticsData?.summary?.totalSessions ?? 0;
  const averageSessionMinutes = analyticsData?.summary?.averageSessionMinutes ?? 0;

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
    <div className="w-full max-w-[1040px] mx-auto space-y-4">
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

      {/* TAB 1: STREAK */}
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

          {/* Small milestone line */}
          <p className="note -mt-2">Next milestone: {plural(nextMilestone, 'day')}</p>

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

          {/* Heatmap Card */}
          <div className="card">
            <div className="overflow-x-auto pb-2">
              <div
                className="heat"
                style={{
                  gridTemplateColumns: `30px repeat(${heatmapData.W}, ${heatmapData.C}px)`,
                }}
              >
                {heatmapData.monthSpans}
                {heatmapData.dayLabels}
                {heatmapData.cells}
              </div>
            </div>

            {/* Legend */}
            <div className="leg">
              <span>Less</span>
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <i key={lvl} style={{ backgroundColor: `var(--h${lvl})` }} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Streak rule note */}
          <p className="note" style={{ marginTop: '12px' }}>
            25+ focused minutes in a day counts toward your streak.
          </p>
        </div>
      )}

      {/* TAB 2: STATS */}
      {tab === 'stats' && (
        <div className="space-y-5 animate-fade-in">
          {/* Three numbers */}
          <div className="nums">
            <div>
              <b>{formatDuration(totalMinutesThisWeek)}</b>
              <span>this week</span>
            </div>
            <div>
              <b>{sessionsIn30Days}</b>
              <span>sessions in 30 days</span>
            </div>
            <div>
              <b>{formatDuration(averageSessionMinutes)}</b>
              <span>average session</span>
            </div>
          </div>

          {/* 7-day Bar Chart */}
          <div className="card">
            <div className="lab">LAST 7 DAYS</div>
            <div className="bars">
              {(last7Days.length === 7
                ? last7Days
                : ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => ({ day: d, hours: 0 }))
              ).map((v, i) => (
                <div key={i}>
                  <span>{v.hours > 0 ? `${v.hours}h` : ''}</span>
                  <i
                    style={{
                      height: `${Math.max(v.hours * 28, 4)}px`,
                      opacity: v.hours > 0 ? 1 : 0.25,
                    }}
                  />
                  <span>{v.day}</span>
                </div>
              ))}
            </div>
          </div>

          {totalMinutesThisWeek === 0 && sessionsIn30Days === 0 && (
            <p className="note text-center py-2 text-xs">
              No study sessions recorded yet. Complete focus sessions to see your weekly study breakdown and habits appear here.
            </p>
          )}
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
