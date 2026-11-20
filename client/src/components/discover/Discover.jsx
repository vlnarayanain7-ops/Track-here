import { Link } from 'react-router-dom';
import { CalendarDays, Flag, Flower2, Map, Medal, Timer, Users } from 'lucide-react';
import './discover.css';

const groups = [
  ['Personal study', [
    ['/mission', Flag, 'Daily mission', 'Your next three study actions'],
    ['/garden', Flower2, 'Study garden', 'Grow flowers as you study'],
    ['/achievements', Medal, 'Achievement cards', 'Badges earned through study'],
  ]],
  ['Study together', [
    ['/challenges', Timer, 'Challenges', 'A seven-day goal with friends'],
    ['/circles', Users, 'Study circles', 'Weekly group check-ins'],
  ]],
  ['Planning tools', [
    ['/tools', CalendarDays, 'Study tools', 'Exam countdown and time calculator'],
    ['/roadmaps', Map, 'Roadmaps', 'Ready-to-use study plans'],
  ]],
];

export default function Discover() {
  return <main className="discover">
    <Link to="/" className="discover-back">Track Here / Home</Link>
    <header><h1>Explore</h1></header>
    {groups.map(([name, features]) => <section key={name} className="feature-group">
      <h2>{name}</h2>
      <div className="discover-grid">{features.map(([path, Icon, title, description]) =>
        <Link key={path} to={path} className="discover-tile">
          <Icon aria-hidden="true" size={18}/><span><strong>{title}</strong><small>{description}</small></span>
        </Link>)}</div>
    </section>)}
  </main>;
}
