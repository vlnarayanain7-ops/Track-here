import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import api from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';

export default function FinalsGroup({ exam }) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['finals-group', user._id || user.id],
    queryFn: async () => (await api.get('/finals-group')).data,
  });
  const [goal, setGoal] = useState(5);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const member = query.data;
  async function act(action) {
    setBusy(true);
    setStatus('');
    try {
      if (action === 'join') await api.put('/finals-group', { exam, goal: Number(goal) });
      if (action === 'leave') await api.delete('/finals-group');
      if (action === 'share') {
        const { data } = await api.post('/finals-group/check-in');
        setStatus(data.added ? 'Focus session shared.' : 'You already shared your latest session.');
      }
      await query.refetch();
    } catch (err) { setStatus(err.response?.data?.message || 'Could not update your group. Try again.'); }
    finally { setBusy(false); }
  }
  return <section className="card space-y-3 p-5 print:hidden">
    <h2 className="font-heading text-xl font-semibold">Exam-week study group</h2>
    {query.isError ? <button className="btn" onClick={() => query.refetch()}>Retry loading group</button> :
      query.isLoading ? <p>Loading group…</p> : member ? <>
        <p>Week of {format(parseISO(member.week), 'MMM d, yyyy')} · {member.members} {member.members === 1 ? 'member' : 'members'} · {member.sessions} shared sessions</p>
        <p>Your check-ins toward your goal: {member.mine} / {member.goal}</p>
        <button disabled={busy} className="btn btn-primary" onClick={() => act('share')}>Share latest focus session</button>
        <button disabled={busy} className="btn" onClick={() => act('leave')}>Leave group</button>
      </> : exam ? <form className="space-y-3" onSubmit={e => { e.preventDefault(); act('join'); }}>
        <p>Join students with an exam the same week. Each check-in adds one session to the group total. Names and topics stay private.</p>
        <label className="block">My session goal <input className="w-16 rounded border bg-[var(--surface)] p-1" type="number" required min="1" max="84" value={goal} onChange={e => setGoal(e.target.value)} /></label>
        <button disabled={busy} className="btn">Join my exam week</button>
      </form> : <p>Build a schedule to find your exam week.</p>}
    {status && <p role="status">{status}</p>}
  </section>;
}
