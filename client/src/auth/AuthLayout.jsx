import { Link } from 'react-router-dom';
import { Target, Check, Clock3 } from 'lucide-react';
import './entry.css';

export function AuthLayout({ title, sub, children }) {
  return (
    <main className="entry">
      <section className="entry-cover">
        <Link to="/" className="entry-brand"><Target aria-hidden="true" /> Track Here</Link>
        <div className="entry-intro">
          <span className="entry-eyebrow">A little progress, every day</span>
          <h2>Make space<br />to <em>focus.</em></h2>
          <p>Bring your study plans, focus sessions and progress together in one calm space.</p>
          <div className="entry-preview" aria-label="Example study plan">
            <div className="entry-preview-head"><span>YOUR STUDY PLAN</span><span>Today</span></div>
            <div className="entry-preview-row"><span className="entry-check"><Check size={16} /></span><span><strong>Show up for your goals</strong><small>One session at a time</small></span><Clock3 size={18} /></div>
            <div className="entry-preview-progress"><span /></div>
            <div className="entry-preview-caption">Build a rhythm that works for you</div>
          </div>
        </div>
      </section>
      <section className="entry-panel">
        <div className="entry-form">
          <h1>{title}</h1>
          {sub && <p className="entry-sub">{sub}</p>}
          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
