import { navigateTabs } from '@/lib/tabNavigation';
import StudyInsights from './StudyInsights';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Check, Clock, FileText, AlertCircle, Sparkles, Award, FileCheck, Gift, Download, Share2, Trash2, Eye } from 'lucide-react';
import { useStreakData, useAnalytics } from '@/hooks/useAnalytics';
import { useProblems, useCreateProblem } from '@/hooks/useProblems';
import { useMockTests, useCreateMockTest } from '@/hooks/useMockTests';
import { useCreateRevision } from '@/hooks/useRevisions';
import { useRewardsMe, useSubmitProof, useClaimReward } from '@/hooks/useRewards';
import { useAuth } from '@/hooks/useAuth';
import { StatsPanel } from '@/components/StatsPanel';
import { MonthHeatmap } from '@/components/MonthHeatmap';
import SideSheet from '@/components/SideSheet';
import RewardsSheet from '@/components/rewards/RewardsSheet';
import ReportModal from '@/components/progress/ReportModal';
import { summarizePeriod } from '@/lib/focusReport';
import { certificateBlob, shareBlob } from '@/lib/certificate';
import { listReportsLocal, deleteReportLocal } from '@/lib/localStore';
import { shareReportCard } from '@/lib/reportCard';
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
  const { user } = useAuth();
  const [statsRange, setStatsRange] = useState('week');
  const { data: streakData, isError: streakFailed, refetch: reloadStreak } = useStreakData();
  const { data: analyticsData } = useAnalytics({ range: statsRange });
  const { data: problemsData } = useProblems();
  const { data: mockTestsData } = useMockTests();
  const { data: rewardsData } = useRewardsMe();

  const createProblemMutation = useCreateProblem();
  const createMockTestMutation = useCreateMockTest();
  const createRevisionMutation = useCreateRevision();
  const submitProofMutation = useSubmitProof();
  const claimRewardMutation = useClaimReward();

  // Rewards Sheet state
  const [rewardsOpen, setRewardsOpen] = useState(false);

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('daily'); // 'daily' | 'weekly'
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportMinutes, setReportMinutes] = useState(0);
  const [reportSessions, setReportSessions] = useState(0);
  const [reportStreak, setReportStreak] = useState(0);
  const [reportTopSubject, setReportTopSubject] = useState(null);

  // Saved reports (device-only via IndexedDB)
  const [savedReports, setSavedReports] = useState([]);

  const refreshSavedReports = async () => {
    try {
      const list = await listReportsLocal();
      setSavedReports(list || []);
    } catch (e) {
      console.warn('Failed to list local reports', e);
    }
  };

  useEffect(() => {
    refreshSavedReports();
  }, []);

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
  const thisWeek = streakData?.thisWeek || [];
  const last7Days = streakData?.last7Days || [];
  const activeStreakDays = streakData?.activeStreakDays || [];

  // Toggle for streak week dots: 'recent' (rolling 7 days ending today) vs 'calendar' (Mon-Sun of current week)
  const [weekViewMode, setWeekViewMode] = useState('recent');

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

  const has7DayBadge = (rewardsData?.milestones || []).includes(7);
  const has30DayCert = (rewardsData?.milestones || []).includes(30);

  const [period, setPeriod] = useState(null);
  const openReport = type => {
    if (!streakData?.today) return toast.error('Study totals are loading. Try again shortly.');
    const summary = summarizePeriod(type, streakData.today, history);
    setPeriod(summary);
    setReportType(type);
    setReportDate(summary.start);
    setReportMinutes(summary.minutes);
    setReportSessions(summary.sessions);
    setReportStreak(currentStreak);
    setReportTopSubject(summary.topSubject);
    setReportModalOpen(true);
  };

  const handleDownloadCertificate = async () => {
    if (!rewardsData?.certificate) {
      toast.error('Certificate not yet earned.');
      return;
    }
    try {
      const b = await certificateBlob({
        name: rewardsData.certificate.showName ? rewardsData.certificate.displayName : '',
        serial: rewardsData.certificate.serial,
        issuedAt: rewardsData.certificate.issuedAt,
      });
      await shareBlob(
        b,
        `track-here-certificate-${rewardsData.certificate.serial}.png`,
        'Track Here 30-Day Certificate'
      );
      toast.success('Certificate downloaded');
    } catch (err) {
      toast.error('Could not generate certificate: ' + err.message);
    }
  };

  const handleProofSubmit = async (payload) => {
    await submitProofMutation.mutateAsync(payload);
    toast.success(`Month ${payload.month} proof submitted for review.`);
  };

  const handleClaimSubmit = async (address) => {
    await claimRewardMutation.mutateAsync(address);
    toast.success('Surprise reward claim submitted successfully!');
  };

  const handleDeleteSavedReport = async (id) => {
    try {
      await deleteReportLocal(id);
      await refreshSavedReports();
      toast.success('Report removed from device');
    } catch (err) {
      toast.error('Failed to delete report: ' + err.message);
    }
  };

  return (
    <div className="w-full max-w-[960px] mx-auto space-y-4">
      <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--tx)]">Progress</h1>

      {/* Tabs: Streak | Stats | Practice */}
      <div className="tabs" role="tablist" onKeyDown={navigateTabs}>
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
          {!streakData && (
            <div className="card p-5" role="status">
              {streakFailed ? (
                <>
                  <p>Your streak history could not be loaded.</p>
                  <button type="button" className="btn mt-3" onClick={() => reloadStreak()}>Try again</button>
                </>
              ) : 'Loading your streak history...'}
            </div>
          )}
          {streakData && <>
          <div className="nums">
            <div>
              <b style={{ color: 'var(--fl)' }}>{currentStreak}</b>
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

          {/* ONE quiet milestones row under the streak numbers */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setRewardsOpen(true)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setRewardsOpen(true)}
            className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--primary)]/40 transition-colors cursor-pointer group select-none"
            title="Open Rewards & Milestones"
          >
            <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
              {/* 7-day badge */}
              <div className="flex items-center gap-1.5 text-xs">
                <Award className={`w-4 h-4 ${has7DayBadge ? 'text-amber-500' : 'text-[var(--muted)]'}`} />
                <span className={has7DayBadge ? 'font-semibold text-[var(--text)]' : 'text-[var(--muted)]'}>
                  7-day badge {has7DayBadge ? '✓' : ''}
                </span>
              </div>

              <span className="text-[var(--muted)] select-none">·</span>

              {/* 30-day certificate */}
              <div className="flex items-center gap-1.5 text-xs">
                <FileCheck className={`w-4 h-4 ${has30DayCert ? 'text-emerald-500' : 'text-[var(--muted)]'}`} />
                <span className={has30DayCert ? 'font-semibold text-[var(--text)]' : 'text-[var(--muted)]'}>
                  30-day certificate {has30DayCert ? '✓' : ''}
                </span>
              </div>

              <span className="text-[var(--muted)] select-none">·</span>

              {/* Small locked gift that says "Surprise" */}
              <div className="flex items-center gap-1.5 text-xs">
                <Gift className={`w-4 h-4 ${rewardsData?.rewardRun >= 150 ? 'text-purple-400' : 'text-[var(--muted)]'}`} />
                <span className={rewardsData?.rewardRun >= 150 ? 'font-semibold text-[var(--text)]' : 'text-[var(--muted)]'}>
                  Surprise {rewardsData?.rewardRun >= 150 ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            </div>

            <span className="text-[11px] text-[var(--primary)] font-medium shrink-0 group-hover:underline">
              Rewards →
            </span>
          </div>

          {/* Week row of 7 dots with Recent 7 days vs Calendar week toggle */}
          <div className="week flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-[var(--muted)]">
                {weekViewMode === 'recent' ? 'Recent 7 days' : 'This week'}
              </span>
              <button
                type="button"
                onClick={() => setWeekViewMode((v) => (v === 'recent' ? 'calendar' : 'recent'))}
                className="text-[11px] text-[var(--primary)] hover:underline cursor-pointer bg-transparent border-0 p-0"
                title="Switch between rolling 7 days and calendar week"
              >
                ({weekViewMode === 'recent' ? 'view calendar week' : 'view last 7 days'})
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {(weekViewMode === 'recent' && last7Days.length > 0 ? last7Days : thisWeek.length > 0 ? thisWeek : ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((char) => ({ day: char, isActive: false }))).map((dayData, i) => {
                const isOn = Boolean(dayData?.isActive);
                const isToday = Boolean(dayData?.isToday);
                return (
                  <i
                    key={dayData?.date || i}
                    className={isOn ? 'on' : ''}
                    title={`${dayData?.label || dayData?.day || ''}${dayData?.date ? ` (${dayData.date})` : ''}: ${dayData?.minutes || 0}m${isOn ? ' · Streak qualified (≥25m)' : ''}${isToday ? ' · Today' : ''}`}
                    style={isToday ? { outline: '2px solid var(--primary)', outlineOffset: '1px' } : undefined}
                  >
                    {dayData?.day || dayData}
                  </i>
                );
              })}
            </div>
          </div>

          {/* Active streak transparency notice */}
          {currentStreak > 0 && (
            <div className="text-[12px] text-[var(--muted)] space-y-1 -mt-2">
              <p className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-[var(--text)]">{currentStreak}-day continuous streak:</span>
                <span>
                  {activeStreakDays?.length > 0
                    ? activeStreakDays.map((d) => `${d.label} (${d.minutes}m)`).join(' → ')
                    : `${currentStreak} consecutive days (≥25 min/day)`}
                </span>
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                Unbroken streak across calendar days (Sat Nov 14 → Sun Nov 15 → Mon Nov 16 Today).
              </p>
            </div>
          )}

          {/* Focus Reports row */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <span className="text-xs text-[var(--muted)] font-medium">Focus Reports</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openReport('daily')}
                className="btn text-xs h-7 px-2.5 flex items-center gap-1.5 cursor-pointer border border-[var(--line)] hover:border-[var(--primary)]"
                title="Generate today's shareable focus report"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Today</span>
              </button>
              <button
                type="button"
                onClick={() => openReport('weekly')}
                className="btn text-xs h-7 px-2.5 flex items-center gap-1.5 cursor-pointer border border-[var(--line)] hover:border-[var(--primary)]"
                title="Generate this week's shareable focus report"
              >
                <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>This week</span>
              </button>
              <button type="button" className="btn text-xs" onClick={() => openReport('monthly')}>This month</button>
            </div>
          </div>

          {/* LeetCode Month Heatmap */}
          <div className="card overflow-hidden min-w-0">
            <MonthHeatmap minutesByDay={minutesByDay} today={streakData?.today} />
          </div>

          {/* Streak rule note */}
          <p className="note" style={{ marginTop: '12px' }}>
            25+ focused minutes in a day counts toward your streak.
          </p>

          </>}

          {/* Saved Reports (device only) */}
          {savedReports.length > 0 && (
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Saved reports on device ({savedReports.length})
                </h3>
              </div>
              <div className="space-y-2">
                {savedReports.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[var(--primary)] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[var(--text)] truncate">
                          {item.summary?.type === 'monthly' ? 'Monthly Report' : item.summary?.type === 'weekly' ? 'Weekly Report' : 'Daily Report'} · {item.summary?.date || item.id}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {formatDuration(item.summary?.minutes || 0)} · {item.summary?.sessions || 0} sessions · {item.summary?.streak || 0}d streak
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setReportType(item.summary?.type || 'daily');
                          setPeriod(item.summary?.period || null);
                          setReportDate(item.summary?.date || new Date().toISOString().split('T')[0]);
                          setReportMinutes(item.summary?.minutes || 0);
                          setReportSessions(item.summary?.sessions || 0);
                          setReportStreak(item.summary?.streak || 0);
                          setReportTopSubject(item.summary?.topSubject || null);
                          setReportModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
                        title="Open report"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (item.blob) {
                            await shareReportCard(
                              item.blob,
                              `track-here-${item.summary?.type || 'report'}-${item.summary?.date || 'card'}.png`
                            );
                          }
                        }}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
                        title="Share report"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedReport(item.id)}
                        className="p-1.5 rounded-lg text-[var(--danger)] hover:bg-[var(--surface)] cursor-pointer"
                        title="Delete report from device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STATS */}
      {tab === 'stats' && (
        <div className="animate-fade-in">
          <StudyInsights user={user} analytics={analyticsData} problems={problemsData?.data?.problems || problemsData?.problems || (Array.isArray(problemsData) ? problemsData : [])} />
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
                <div key={item.id} className="row flex items-center justify-between gap-3">
                  <span className="g truncate">{item.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        createRevisionMutation.mutate({
                          title: item.title,
                          type: 'problem',
                          dueDate: new Date().toISOString(),
                          intervalDays: 1,
                        });
                      }}
                      className="btn g text-xs h-7 px-2.5 border border-[var(--ln)] hover:border-[var(--pr)] cursor-pointer"
                      title="Add to spaced repetition review queue"
                    >
                      Review later
                    </button>
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
      {/* Rewards Sheet */}
      <RewardsSheet
        open={rewardsOpen}
        onClose={() => setRewardsOpen(false)}
        data={rewardsData}
        onProof={handleProofSubmit}
        onCertificate={handleDownloadCertificate}
        onClaim={handleClaimSubmit}
      />

      {/* Focus Report Modal */}
      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        type={reportType}
        period={period}
        dateStr={reportDate}
        minutes={reportMinutes}
        sessions={reportSessions}
        streak={reportStreak}
        topSubject={reportTopSubject}
        userName={user?.name || ''}
        onSaved={refreshSavedReports}
      />
    </div>
  );
}
