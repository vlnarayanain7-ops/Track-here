import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import api from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';
import './discover/discover.css';

export default function Challenges() {
  const { id } = useParams();
  const [goalDays, setGoalDays] = useState(5);
  useEffect(() => {
    if (id) sessionStorage.removeItem('pendingChallenge');
  }, [id]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const key = ['challenges', user?._id || user?.id, id || 'list'];
  const path = id ? '/challenges/' + encodeURIComponent(id) : '/challenges';
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: key, queryFn: async () => (await api.get(path)).data,
    refetchInterval: id ? 60000 : false, retry: false,
  });
  const change = useMutation({
    mutationFn: () => id ? api.post(path + '/join') : api.post(path, { goalDays }),
    onSuccess: ({ data: saved }) => {
      cache.invalidateQueries({ queryKey: ['challenges'] });
      if (saved.id) navigate('/challenges/' + saved.id);
    },
    onError: err => toast.error(err.response?.data?.message || 'Could not save. Please try again.'),
  });
  const ended = id && data && Date.parse(data.ends) <= Date.now();
  const cheer = useMutation({
    mutationFn: () => api.post(path + '/cheer'),
    onSuccess: () => cache.invalidateQueries({ queryKey: key }),
    onError: () => toast.error('Could not send encouragement. Try again.'),
  });
  async function invite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Invite link copied');
    } catch {
      toast.error('Copy the address from your browser to invite friends.');
    }
  }
  return <section className="discover">
    <Link className="underline" to={id ? '/challenges' : '/'}>{id ? 'All challenges' : 'Dashboard'}</Link>
    <header><h1>Seven-day study challenge</h1></header><div className="discover-panel">
    <details><summary>How the challenge works</summary><p>Study for 25 minutes on each goal day. Each day runs for 24 hours from the challenge start. Finished timer sessions count toward the day they began.</p></details>
    {isPending && <p role="status">Loading challenge details…</p>}
    {isError && <p role="alert">{error.response?.data?.message || 'Could not load challenges.'} <button className="underline" onClick={() => refetch()}>Retry</button></p>}
    {data && !id && <>
      <label>Group goal<select className="input block w-full mt-1" value={goalDays} onChange={e => setGoalDays(Number(e.target.value))}>
        {[3, 5, 7].map(n => <option value={n} key={n}>{n} study days this week</option>)}</select></label>
      <button className="btn btn-primary" disabled={change.isPending} onClick={() => change.mutate()}>Start a challenge</button>
      {data.length > 0 && <h2 className="font-bold">Your challenges</h2>}
      {data.map(row => <Link className="block underline" key={row._id} to={'/challenges/' + row._id}>
        {Date.parse(row.ends) <= Date.now() ? 'Finished' : 'In progress'} · Started {new Date(row.started).toLocaleString()}
      </Link>)}
    </>}
    {data && id && <>
      <p>Goal: {data.goalDays ?? 5} study days · {ended ? 'Finished' : 'Ends'} {new Date(data.ends).toLocaleString()} · {data.size}/8 participants</p>
      {data.members ? <>
        <h2 className="font-bold">{ended ? 'Challenge recap' : 'Group progress'}</h2>
        {data.members.map(member => <div className="flex justify-between border-b py-2" key={member.label}><span>{member.label}</span><strong>{member.days} qualifying days {member.days >= (data.goalDays ?? 5) && '✓ Goal reached'}</strong></div>)}
        {!ended && <div className="flex flex-wrap gap-3"><Link className="btn btn-primary" to="/study">Open study timer</Link>
          {data.size < 8 && <button className="btn btn-secondary" onClick={invite}>Copy invite link</button>}</div>}
        <details><summary>Group encouragement</summary><div className="flex flex-wrap gap-2">
        <button className="btn btn-secondary justify-self-start" disabled={data.cheered || cheer.isPending}
          onClick={() => cheer.mutate()}>{data.cheered ? 'You cheered for the group' : 'Cheer for the group'} · {data.cheers || 0}</button>
        </div></details>
      </> : !ended && data.size < 8 ? <>
        <p>Joining shares your completed-day count with the group.</p>
        <button className="btn btn-primary" disabled={change.isPending} onClick={() => change.mutate()}>Join challenge</button>
      </> : <p>This challenge is closed to new participants.</p>}
    </>}
  </div></section>;
}
