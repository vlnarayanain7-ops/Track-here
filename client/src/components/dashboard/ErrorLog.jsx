import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCompleteRevision, useCreateRevision, useRevisions } from '@/hooks/useRevisions';

export default function ErrorLog() {
  const section = useRef(null);
  const { hash } = useLocation();
  const query = useRevisions();
  const create = useCreateRevision();
  const complete = useCompleteRevision();
  const [adding, setAdding] = useState(false);
  const [question, setQuestion] = useState('');
  const [solution, setSolution] = useState('');
  const [batch, setBatch] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (hash === '#error-log') section.current?.scrollIntoView();
  }, [hash]);

  const entries = (query.data || []).filter(item => item.solution && item.type === 'problem');
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const due = entries.filter(item => item.status !== 'completed' && new Date(item.dueDate) <= end);
  const current = batch[0];

  function save(e) {
    e.preventDefault();
    create.mutate({ type: 'problem', title: question.trim(), solution: solution.trim(), dueDate: new Date().toISOString() }, {
      onSuccess: () => { setQuestion(''); setSolution(''); setAdding(false); setNotice('Mistake saved for review.'); },
    });
  }

  function rate(feedback) {
    complete.mutate({ id: current._id, feedback }, {
      onSuccess: updated => {
        setBatch(rest => rest.slice(1));
        setRevealed(false);
        setNotice('Next retry: ' + new Date(updated.dueDate).toLocaleDateString());
      },
    });
  }

  return <section ref={section} id="error-log" aria-labelledby="error-log-title" className="card space-y-3 p-4 scroll-mt-24">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="error-log-title" className="font-heading text-lg font-semibold">Error log</h2>
      <div className="flex flex-wrap gap-2">
        {!adding && <button type="button" className="btn" onClick={() => { setAdding(true); setNotice(''); }}>Log a mistake</button>}
        {!current && due.length > 0 && <button type="button" className="btn btn-primary" onClick={() => {
          setBatch(due.slice(0, 3)); setRevealed(false); setNotice('');
        }}>Retry {Math.min(due.length, 3)} {due.length === 1 ? 'mistake' : 'mistakes'}</button>}
      </div>
    </div>
    {adding && <form onSubmit={save} className="grid gap-3">
      <label>Question you missed<textarea autoFocus required maxLength={2000} rows={2} className="input block w-full" value={question} onChange={e => setQuestion(e.target.value)} /></label>
      <label>Correct solution<textarea required maxLength={6000} rows={3} className="input block w-full" value={solution} onChange={e => setSolution(e.target.value)} /></label>
      <div className="flex gap-2"><button className="btn btn-primary" disabled={create.isPending || !question.trim() || !solution.trim()}>Save mistake</button>
        <button type="button" className="btn" disabled={create.isPending} onClick={() => setAdding(false)}>Cancel</button></div>
    </form>}
    {query.isError && <button className="btn" onClick={() => query.refetch()}>Retry loading mistakes</button>}
    {query.isLoading && <p role="status">Loading error log…</p>}
    {query.isSuccess && !entries.length && !adding && <p className="text-sm text-[var(--muted)]">Save a question you missed and its solution, then try it again from memory.</p>}
    {current && <div className="space-y-3 border-t border-[var(--line)] pt-3">
      <p className="font-medium whitespace-pre-wrap break-words">{current.title}</p>
      {revealed ? <>
        <p className="whitespace-pre-wrap break-words">{current.solution}</p>
        <div className="flex gap-2"><button className="btn btn-primary" disabled={complete.isPending} onClick={() => rate('Remembered')}>Solved it</button>
          <button className="btn" disabled={complete.isPending} onClick={() => rate('Forgot')}>Still stuck</button></div>
      </> : <button className="btn" onClick={() => setRevealed(true)}>Show solution</button>}
    </div>}
    {entries.length > 0 && <details><summary className="cursor-pointer text-sm">Saved mistakes ({entries.length})</summary>
      <ul className="divide-y divide-[var(--line)]">{entries.map(item => <li key={item._id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
        <span className="break-words min-w-0">{item.title}</span><span className="text-[var(--muted)]">Review {new Date(item.dueDate).toLocaleDateString()}</span>
      </li>)}</ul></details>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
  </section>;
}
