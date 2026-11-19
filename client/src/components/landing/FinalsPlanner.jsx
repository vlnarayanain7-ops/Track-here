import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import BrandMark from '@/components/brand/BrandMark';
import { buildFinalsPlan, dayKey, reschedule } from '@/lib/finalsPlan';
import FinalsGroup from './FinalsGroup';

const field = 'mt-1 block w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2';
const displayDay = value => format(parseISO(value), 'EEE, MMM d');

export default function FinalsPlanner() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    const previous = document.title;
    document.title = 'Free college finals study planner | Track Here';
    return () => { document.title = previous; };
  }, []);
  if (isLoading) return <p role="status">Loading planner…</p>;
  const owner = user?._id || user?.id || 'guest';
  return <Planner key={owner} storageKey={'th-finals-v1:' + owner} signedIn={Boolean(user)} />;
}

function Planner({ storageKey, signedIn }) {
  const [plan, setPlan] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; }
  });
  const today = dayKey(new Date());
  const [exam, setExam] = useState('');
  const [topics, setTopics] = useState('');
  const [capacity, setCapacity] = useState(plan?.capacity || 2);
  const [resume, setResume] = useState(today);
  const [newPlan, setNewPlan] = useState(false);
  const [message, setMessage] = useState('');
  const [guestPlan] = useState(() => {
    if (!signedIn) return null;
    try { return JSON.parse(localStorage.getItem('th-finals-v1:guest')); } catch { return null; }
  });
  useEffect(() => {
    function sync(event) {
      if (event.key === storageKey || event.key === null) {
        try { setPlan(JSON.parse(localStorage.getItem(storageKey))); } catch { setMessage('Could not read your saved schedule.'); }
      }
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [storageKey]);

  function save(next) {
    setPlan(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setMessage('Schedule saved in this browser.');
    } catch { setMessage('Browser storage is unavailable. Print your schedule to keep a copy.'); }
  }

  function generate(event) {
    event.preventDefault();
    try {
      save(buildFinalsPlan(today, exam, topics, Number(capacity)));
      setNewPlan(false);
    } catch (err) { setMessage(err.message); }
  }

  const rows = new Map();
  for (const block of plan?.blocks || []) {
    if (!rows.has(block.date)) rows.set(block.date, []);
    rows.get(block.date).push(block);
  }
  const dates = [...rows.keys()].filter(Boolean).sort();
  if (rows.has(null)) dates.push(null);

  return <main className="mx-auto max-w-3xl space-y-6 px-5 py-9 text-[var(--text)]">
    <Link to={signedIn ? '/plan' : '/welcome'} className="inline-flex items-center gap-2 font-semibold"><BrandMark />Track Here</Link>
    <header><h1 className="text-3xl font-heading font-bold">College finals study planner</h1>
      <p className="mt-2 text-[var(--muted)]">Plan 25-minute study blocks, check off topics, and move unfinished work before exam day. Your schedule saves in this browser.</p></header>
    {!plan && guestPlan && <button className="btn" onClick={() => {
      setCapacity(guestPlan.capacity);
      save(guestPlan);
    }}>Use this browser’s guest schedule</button>}
    {(!plan || newPlan) && <form onSubmit={generate} className="card grid gap-4 p-5 sm:grid-cols-2 print:hidden">
      <label>Exam date<input className={field} type="date" required min={dayKey(addDays(new Date(), 1))} max={dayKey(addDays(new Date(), 90))} value={exam} onChange={e => setExam(e.target.value)} /></label>
      <label>Blocks per day<input className={field} type="number" required min="1" max="12" value={capacity} onChange={e => setCapacity(e.target.value)} /></label>
      <label className="sm:col-span-2">Topics, one per line<textarea className={field} rows="4" required maxLength={4000} value={topics} onChange={e => setTopics(e.target.value)} /></label>
      <button className="btn btn-primary" disabled={!topics.trim()}>{plan ? 'Replace saved schedule' : 'Build my schedule'}</button>
      {plan && <button type="button" className="btn" onClick={() => setNewPlan(false)}>Keep current schedule</button>}
    </form>}
    <p role="status" className="text-sm print:hidden">{message}</p>
    {plan && <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Schedule for your {displayDay(plan.exam)} exam</h2>
      <p>{plan.blocks.filter(block => block.done).length} of {plan.blocks.length} blocks checked off</p>
      {today < plan.exam && <details className="card p-4 print:hidden"><summary className="cursor-pointer font-semibold">Reschedule unfinished blocks</summary>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={e => {
          e.preventDefault();
          try { save(reschedule(plan, resume, Number(capacity), today)); } catch (err) { setMessage(err.message); }
        }}>
          <label>Resume on<input className={field} type="date" required min={today} max={dayKey(addDays(parseISO(plan.exam), -1))} value={resume} onChange={e => setResume(e.target.value)} /></label>
          <label>Available blocks per day<input className={field} type="number" required min="1" max="12" value={capacity} onChange={e => setCapacity(e.target.value)} /></label>
          <button className="btn">Move unfinished blocks</button>
        </form></details>}
      <ol className="divide-y divide-[var(--line)]">{dates.map(date => <li key={date || 'overflow'} className="grid gap-2 py-3 sm:grid-cols-[10rem_1fr]">
        <strong>{date ? displayDay(date) : 'Needs more time'}</strong><ul>{rows.get(date).map(block => <li key={block.id}>
          <label className="inline-flex items-center gap-2 py-1"><input type="checkbox" disabled={!date || date > today} checked={block.done} onChange={() => save({ ...plan, blocks: plan.blocks.map(b => b.id === block.id ? { ...b, done: !b.done } : b) })} />{block.topic}</label>
        </li>)}</ul></li>)}</ol>
      <div className="flex flex-wrap gap-3 print:hidden"><button className="btn" onClick={() => window.print()}>Print or save PDF</button>
        <button className="btn" onClick={async () => {
          const url = new URL('/finals-planner', window.location.origin).href;
          try {
            await navigator.clipboard.writeText(url);
            setMessage('Planner link copied. Your topics stay private.');
          } catch { setMessage('Share the planner at ' + url); }
        }}>Copy planner link</button>
        <Link to="/study" className="btn btn-primary">Study with the timer</Link>
        <button className="btn" onClick={() => { setNewPlan(true); window.scrollTo(0, 0); }}>New plan</button></div>
    </section>}
    {signedIn && <FinalsGroup exam={plan?.exam} />}
    {!signedIn && plan && <Link to="/signin" state={{ from: { pathname: '/finals-planner' } }} className="btn print:hidden">Sign in for exam-week groups</Link>}
  </main>;
}
