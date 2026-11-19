import { useCreateRevision } from '@/hooks/useRevisions';
import { Link } from 'react-router-dom';
export default function StudyInsights({ user, analytics, problems = [] }) {
  const revision = useCreateRevision();
  const today = Math.round(analytics?.today?.studyMinutes || 0);
  const goal = analytics?.dailyStudyGoal || user?.dailyStudyGoal || 240;
  const subjects = (user?.subjects || []).map(s => s.name || s);
  const recorded = new Map((analytics?.bySubject || []).map(s => [s.name, s.minutes]));
  const neglected = subjects.filter(name => !recorded.get(name));
  const needsReview = problems.filter(p => p.status && !['Solved', 'solved'].includes(p.status));
  return <section className="grid sm:grid-cols-2 gap-3 mb-6" aria-label="Study insights">
    <div className="card p-4"><h2 className="font-semibold">Today's focus goal</h2><p className="text-2xl font-heading my-2">{today} <span className="text-sm text-[var(--muted)]">/ {goal} minutes</span></p><progress className="w-full accent-[var(--primary)]" value={Math.min(today, goal)} max={goal} aria-label="Daily focus goal"/><Link className="block text-sm text-[var(--primary)] mt-2" to="/study">{today >= goal ? 'View your focus sessions' : `Plan the next ${Math.min(25, goal - today)} minutes`} ?</Link></div>
    <div className="card p-4"><h2 className="font-semibold">Subject balance</h2><p className="text-sm text-[var(--muted)] my-2">{neglected.length ? `${neglected.join(', ')}: no study recorded in this range.` : subjects.length ? 'Every subject has study recorded in this range.' : 'Add subjects to see where your study time goes.'}</p><Link className="text-sm text-[var(--primary)]" to={neglected.length ? `/study?subject=${encodeURIComponent(neglected[0])}` : '/plan?tab=subjects'}>{neglected.length ? `Focus on ${neglected[0]}` : 'Manage subjects'} ?</Link></div>
    {needsReview.length > 0 && <div className="card p-4 sm:col-span-2"><h2 className="font-semibold">Practice to revisit</h2><p className="text-sm text-[var(--muted)] my-2">{needsReview.length} logged problems are not marked solved. Revisit the approach before your next attempt.</p><Link className="text-sm text-[var(--primary)]" to="/progress?tab=practice">Review practice ?</Link></div>}
    {analytics?.recurringMistakes?.length > 0 && <div className="card p-4 sm:col-span-2"><h2 className="font-semibold">Repeated mistakes to review</h2><p className="text-xs text-[var(--muted)]">Matching mistake notes from your practice attempts in the last 90 days.</p><ul className="mt-3 space-y-3">{analytics.recurringMistakes.map(mistake => <li key={mistake.text} className="flex flex-wrap justify-between items-center gap-2"><span className="text-sm break-words">{mistake.text} ? {mistake.count} attempts</span><button className="btn" disabled={revision.isPending} onClick={() => revision.mutate({ title: mistake.text.slice(0, 200), type: 'topic', dueDate: new Date().toISOString(), intervalDays: 1 })}>Add to revision</button></li>)}</ul></div>}
  </section>;
}
