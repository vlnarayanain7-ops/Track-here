import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { PublicFrame } from './PublicTools';

const templates = [
  { name: 'DSA fundamentals', days: 30, description: 'Practice one data structure at a time, then revisit the problems that took longest.', topics: ['Array traversal', 'Two pointers', 'Prefix sums', 'Sliding windows', 'Hash maps', 'Stacks and queues', 'Linked lists', 'Binary search', 'Tree traversal', 'Graph traversal', 'Dynamic programming', 'Re-solve missed problems'] },
  { name: 'Finals revision', days: 14, description: 'Alternate recall, practice questions and timed review in the lead-up to an exam.', topics: ['Recall key definitions', 'Review lecture diagrams', 'Practice short-answer questions', 'Work through a past paper', 'Correct missed questions', 'Timed practice', 'Review weak topics'] },
  { name: 'C++ foundations', days: 7, description: 'Build a small program every day while practicing the core language features.', topics: ['Variables and input', 'Conditionals', 'Loops', 'Functions', 'Strings and vectors', 'References', 'Build a small project'] },
];

export default function Roadmaps() {
  const [params, setParams] = useSearchParams();
  const slug = template => template.name.toLowerCase().replace(/\s+/g, '-');
  const selected = templates.find(template => slug(template) === params.get('template')) || templates[0];
  const [shareMessage, setShareMessage] = useState('');
  async function shareTemplate() {
    const url = new URL('/roadmaps', window.location.origin);
    url.searchParams.set('template', slug(selected));
    try {
      await navigator.clipboard.writeText(url.href);
      setShareMessage('Template link copied.');
    } catch { setShareMessage(url.href); }
  }
  return <PublicFrame title="Study roadmaps" intro="Choose a starting plan, then adjust the deadline, pace and topics to suit your course.">
    <label className="block max-w-md text-sm font-medium">Choose a roadmap
      <select className="input block w-full mt-2" value={slug(selected)} onChange={e => { setParams({ template: e.target.value }, { replace: true }); setShareMessage(''); }}>
        {templates.map(t => <option key={t.name} value={slug(t)}>{t.name} ({t.days} days)</option>)}
      </select>
    </label>
    <section className="mt-6 border-t border-[var(--line)] pt-5 space-y-4" aria-live="polite"><h2 className="text-lg font-semibold">Plan overview</h2><p>{selected.description}</p><p className="text-sm text-[var(--muted)]">{selected.days} days at 25 minutes per day</p>
      <ol className="list-decimal pl-5 grid gap-y-2 gap-x-8 sm:grid-cols-2">{selected.topics.map(topic => <li key={topic}>{topic}</li>)}</ol>
      <Link className="btn btn-primary" to="/finals-planner" state={{ draft: { name: selected.name, exam: format(addDays(new Date(), selected.days), 'yyyy-MM-dd'), capacity: 1, topics: selected.topics.join('\n') } }}>Customize this roadmap</Link>
      <button type="button" className="btn ml-2" onClick={shareTemplate}>Copy template link</button>
      {shareMessage && <p role="status" className="text-sm break-all">{shareMessage}</p>}
    </section>
  </PublicFrame>;
}
