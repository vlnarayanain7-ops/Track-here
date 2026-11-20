import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import Garden from './Garden';
import api from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';
import { useStreakData } from '@/hooks/useAnalytics';
import Achievements from './Achievements';
import './discover.css';

function DataStatus({ query }) {
  if (query.isError) return <div role="alert">Couldn’t load your progress. <button className="underline" onClick={() => query.refetch()}>Try again</button></div>;
  return <p role="status">Loading your progress…</p>;
}
function Mission({ streak }) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['daily-mission', user?._id || user?.id, streak.today],
    queryFn: () => api.get('/analytics/mission').then(r => r.data),
    staleTime: 0,
  });
  if (!query.data) return <DataStatus query={query}/>;
  const { taskDone, reviewDone, task } = query.data;
  const actions = [
    [streak.byDay[streak.today] >= 25, 'Study for 25 minutes', Math.min(25,streak.byDay[streak.today] || 0) + ' of 25 focused minutes', '/study'],
    [taskDone, 'Finish one task', task?.title || 'Choose a task from your plan', '/plan?tab=tasks'],
    [reviewDone, 'Recall one idea', 'Review a topic and record how it went', '/revisions'],
  ];
  const done = actions.filter(a => a[0]).length;
  return <><div className="discover-panel"><h2>{done === 3 ? 'Today’s mission complete' : done + ' of 3 actions complete'}</h2><progress value={done} max="3" aria-label="Daily mission completion"/></div>
    <div className="discover-grid">{actions.map(([complete,title,detail,url]) => <Link key={url} className="discover-tile" to={url}><span className="discover-icon">{complete ? <CheckCircle2/> : <Circle/>}</span><span><h2>{title}</h2><p>{complete ? 'Completed today' : detail}</p></span></Link>)}</div></>;
}
const titles = { mission: "Today's mission", garden: 'Study garden', achievements: 'Achievement cards' };
export default function Personal({page}) {
  const { user } = useAuth();
  const query = useStreakData();
  return <section className="discover"><Link to="/explore" className="discover-back">← Explore</Link><header><h1>{titles[page]}</h1></header>
    {!query.data ? <DataStatus query={query}/> : page === 'garden' ? <Garden key={user._id || user.id} user={user} streak={query.data}/> : page === 'mission' ? <Mission streak={query.data}/> : <Achievements streak={query.data}/>}</section>;
}
