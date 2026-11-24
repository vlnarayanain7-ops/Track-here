import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, Check, Heart, Link2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';

const activities = ['Finished a focus session', 'Reviewed a topic', 'Completed a practice task'];
const panel = 'rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 space-y-4';
const field = 'input block w-full mt-1';

function CircleForm({ submit, busy }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState(5);
  return <form className={panel} onSubmit={e => { e.preventDefault(); submit({ name: name.trim(), target: Number(target) }); }}>
    <h2 className="text-xl font-semibold">Create a circle</h2>
    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
      <label>Circle name<input className={field} value={name} maxLength={50} required placeholder="e.g. Library table three" onChange={e => setName(e.target.value)} /></label>
      <label>Weekly group check-ins<input type="number" className={field} value={target} min="1" max="56" required onChange={e => setTarget(e.target.value)} /></label>
    </div>
    <button className="btn btn-primary" disabled={busy || !name.trim()}>Create circle</button>
  </form>;
}

function CircleDetail({ data, act, busy }) {
  const [activity, setActivity] = useState(activities[0]);
  const [leaving, setLeaving] = useState(false);
  const [showLink, setShowLink] = useState(false);
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Invite link copied');
    } catch { setShowLink(true); }
  }
  if (!data.joined) return <section className={panel}>
    <h2 className="text-xl font-semibold">Join this circle</h2>
    <p>{data.size} of 8 places filled · {data.target} check-ins per week</p>
    <p className="text-[var(--muted)]">Members can see the activities you choose to check in with and send you encouragement.</p>
    <button className="btn btn-primary" disabled={busy || data.size >= 8} onClick={() => act('join')}>{data.size >= 8 ? 'Circle full' : 'Join circle'}</button>
  </section>;
  return <>
    <section className={panel}>
      <div className="flex justify-between flex-wrap gap-2 items-center">
        <h2 className="text-xl font-semibold">This week’s goal</h2><span>{data.size}/8 members</span>
      </div>
      <p className="text-3xl font-bold">{data.checkIns.length} <span className="text-lg text-[var(--muted)]">of {data.target} check-ins</span></p>
      <progress aria-label="Weekly group goal" className="w-full h-2 accent-[var(--primary)]" max={data.target} value={Math.min(data.checkIns.length, data.target)} />
      <p className="text-sm text-[var(--muted)]">{data.checkIns.length >= data.target ? 'Goal reached! ' : ''}Your group starts a new week on Monday at 00:00 UTC.</p>
      {data.size < 8 && <button className="btn btn-secondary" onClick={copyInvite}><Link2 size={16} /> Copy invite link</button>}
      {showLink && <label>Invite link<input className={field} readOnly value={window.location.href} onFocus={e => e.target.select()} /></label>}
    </section>
    <section className={panel}>
      <h2 className="text-xl font-semibold">Your check-in</h2>
      {data.checkedToday ? <p className="flex gap-2 items-center text-[var(--primary)]"><Check size={18} /> Checked in for today</p> : <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); act('check-in', { activity }); }}>
        <label className="grow">What did you work on?<select className={field} value={activity} onChange={e => setActivity(e.target.value)}>{activities.map(a => <option key={a}>{a}</option>)}</select></label>
        <button className="btn btn-primary" disabled={busy}>Check in</button>
      </form>}
    </section>
    <section className={panel}>
      <h2 className="text-xl font-semibold">Circle activity</h2>
      {data.checkIns.length === 0 && <p className="text-[var(--muted)]">Your circle’s first check-in this week will appear here.</p>}
      <ul className="divide-y divide-[var(--line)]">{data.checkIns.map(c => <li key={c.member + c.day} className="py-3 flex items-center justify-between gap-3">
        <div><strong>{c.label}</strong><p>{c.activity}</p><time className="text-sm text-[var(--muted)]" dateTime={c.day}>{c.day} UTC</time></div>
        {c.mine ? <span className="text-sm whitespace-nowrap">{c.cheers} cheers</span> : <button className="btn btn-secondary" aria-label={'Cheer for ' + c.label} aria-pressed={c.cheered} disabled={busy || c.cheered} onClick={() => act('cheer', { member: c.member, day: c.day })}><Heart size={16} fill={c.cheered ? 'currentColor' : 'none'} />{c.cheers}</button>}
      </li>)}</ul>
    </section>
    {leaving ? <div className={panel}><p>Leave this circle and remove your check-ins?</p><div className="flex gap-3"><button className="btn" disabled={busy} onClick={() => act('leave')}>Leave circle</button><button className="btn" onClick={() => setLeaving(false)}>Stay</button></div></div> :
      <button className="text-sm underline text-[var(--muted)]" onClick={() => setLeaving(true)}>Leave circle</button>}
  </>;
}

export default function Circles() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const path = id ? '/circles/' + encodeURIComponent(id) : '/circles';
  useEffect(() => { if (id) sessionStorage.removeItem('pendingChallenge'); }, [id]);
  const query = useQuery({
    queryKey: ['circles', user?._id || user?.id, id || 'list'],
    queryFn: () => api.get(path).then(r => r.data),
    refetchInterval: id ? 30000 : false, retry: false,
  });
  const mutation = useMutation({
    mutationFn: ({ action, body }) => api.post(action ? path + '/' + action : path, body),
    onSuccess: async ({ data }, { action }) => {
      if (action === 'leave') {
        await cache.invalidateQueries({ queryKey: ['circles', user?._id || user?.id, 'list'] });
        navigate('/circles', { replace: true });
        return;
      }
      if (data.id) navigate('/circles/' + data.id);
      await cache.invalidateQueries({ queryKey: ['circles'] });
    },
    onError: err => toast.error(err.response?.data?.message || 'Could not save your change. Please try again.'),
  });
  const act = (action, body) => mutation.mutate({ action, body });
  return <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
    <Link className="inline-flex gap-2 items-center text-sm" to={id ? '/circles' : '/'}><ArrowLeft size={15} />{id ? 'All circles' : 'Dashboard'}</Link>
    <header><h1 className="font-heading text-2xl font-semibold break-words">{id && query.data ? query.data.name : 'Study circles'}</h1>
    </header>
    {query.isPending && <p role="status">Loading circles…</p>}
    {query.isError && <div className={panel} role="alert"><p>{query.error.response?.data?.message || 'Could not load circles.'}</p><button className="btn" onClick={() => query.refetch()}>Try again</button></div>}
    {!id && query.data?.length > 0 && <section className={panel}><h2 className="text-xl font-semibold">Your circles</h2>

      {query.data.map(c => <Link className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4" key={c.id} to={'/circles/' + c.id}><div><strong>{c.name}</strong><p className="text-sm text-[var(--muted)]">{c.size} members · {c.count}/{c.target} weekly check-ins</p></div><ArrowUpRight size={18} /></Link>)}
    </section>}
    {!id && (query.data?.length ? <details><summary className="cursor-pointer py-3 font-medium">Create another circle</summary><CircleForm submit={body => act('', body)} busy={mutation.isPending} /></details> : <CircleForm submit={body => act('', body)} busy={mutation.isPending} />)}
    {id && query.data && <CircleDetail key={id} data={query.data} act={act} busy={mutation.isPending} />}
  </main>;
}
