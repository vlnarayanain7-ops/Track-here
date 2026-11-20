import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { CalendarDays, Clock3, ArrowUpRight } from 'lucide-react';
import BrandMark from '@/components/brand/BrandMark';

export function PublicFrame({ title, intro, children }) {
  useEffect(() => {
    const previous = document.title;
    document.title = title + ' | Track Here';
    return () => { document.title = previous; };
  }, [title]);
  return <main className="max-w-4xl mx-auto px-5 py-7 sm:py-10 text-[var(--text)]">
    <nav aria-label="Study resources" className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
      <Link to="/welcome" className="inline-flex items-center gap-2 font-semibold"><BrandMark />Track Here</Link>
      <div className="flex flex-wrap gap-4 text-sm"><Link to="/tools">Study tools</Link><Link to="/roadmaps">Roadmaps</Link><Link to="/finals-planner">Finals planner</Link></div>
    </nav>
    <header className="py-6 sm:py-8"><h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm max-w-2xl text-[var(--muted)]">{intro}</p></header>
    {children}
  </main>;
}

const field = 'input block mt-2 w-full';
const result = 'rounded-xl bg-[var(--primary-soft)] p-4 text-[var(--text)]';
export default function PublicTools() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [exam, setExam] = useState(() => format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [hours, setHours] = useState('10');
  const [days, setDays] = useState('5');
  const daysLeft = differenceInCalendarDays(parseISO(exam), parseISO(today));
  const validBudget = Number(hours) > 0 && Number(hours) <= 168 && Number(days) >= 1 && Number(days) <= 7 && Number.isInteger(Number(days));
  const minutes = validBudget ? Math.ceil(Number(hours) * 60 / Number(days)) : 0;
  return <PublicFrame title="Free study tools" intro="Work out how much time you have, then turn it into a revision timetable.">
    <div className="grid gap-5 md:grid-cols-2">
      <section id="countdown" className="card p-6 space-y-5">
        <CalendarDays className="text-[var(--primary)]" aria-hidden="true" /><h2 className="text-xl font-semibold">Exam countdown</h2>
        <label className="block">Exam date<input className={field} type="date" min={today} value={exam} onChange={e => setExam(e.target.value)} /></label>
        <div className={result} role="status">{daysLeft >= 0 ? <><b className="text-3xl">{daysLeft}</b> {daysLeft === 1 ? 'day' : 'days'} until your exam</> : 'Choose today or a future exam date.'}</div>
        <Link className="btn btn-primary" to="/finals-planner" state={daysLeft >= 1 && daysLeft <= 90 ? { draft: { exam } } : undefined}>Build a revision timetable <ArrowUpRight size={16} /></Link>
      </section>
      <section id="hours" className="card p-6 space-y-5">
        <Clock3 className="text-[var(--primary)]" aria-hidden="true" /><h2 className="text-xl font-semibold">Study-hours calculator</h2>
        <div className="grid gap-4 sm:grid-cols-2"><label>Hours per week<input className={field} type="number" min="0.1" max="168" step="0.1" value={hours} onChange={e => setHours(e.target.value)} /></label>
          <label>Study days per week<input className={field} type="number" min="1" max="7" value={days} onChange={e => setDays(e.target.value)} /></label></div>
        <div className={result} role="status">{!validBudget ? 'Enter weekly hours and 1–7 study days.' : minutes > 1440 ? 'This plan needs more than 24 hours per study day. Increase the number of days or reduce weekly hours.' : <><b className="text-3xl">{minutes}</b> minutes per study day<p className="mt-2 text-sm">{Math.floor(minutes / 25)} full 25-minute blocks and {minutes % 25} minutes left each day.</p></>}</div>
      </section>
    </div>
  </PublicFrame>;
}
