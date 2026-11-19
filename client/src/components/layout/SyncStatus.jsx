import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { getOutboxState, retryOutbox } from '@/lib/outbox';
import Dialog from '@/components/ui/Dialog';
import toast from 'react-hot-toast';
export default function SyncStatus() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ items: [], online: navigator.onLine, syncing: false });
  useEffect(() => {
    let alive = true;
    const update = () => getOutboxState().then(value => { if (alive) setState(value); }).catch(() => {});
    update();
    for (const event of ['online', 'offline', 'th:outbox-changed']) window.addEventListener(event, update);
    return () => { alive = false; for (const event of ['online', 'offline', 'th:outbox-changed']) window.removeEventListener(event, update); };
  }, []);
  const label = !state.online ? 'Offline' : state.syncing ? 'Syncing' : state.items.length ? `${state.items.length} on device` : 'Synced';
  const Icon = !state.online ? CloudOff : state.syncing ? RefreshCw : Cloud;
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state.items, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'track-here-pending-saves.json'; link.click(); URL.revokeObjectURL(url);
  };
  return <><button type="button" className="btn btn-ghost gap-1.5" onClick={() => setOpen(true)} aria-label={`Sync status: ${label}`}><Icon size={17} className={state.syncing ? 'animate-spin' : ''}/><span className="hidden lg:inline text-xs">{label}</span></button>
    <Dialog open={open} onClose={() => setOpen(false)} title="Your saved changes">
      <p role="status" className="text-sm text-[var(--muted)] mb-4">{state.items.length ? 'These changes are saved on this device for your account. Keep this browser data until they sync.' : 'All queued changes have synced.'}</p>
      <ul className="space-y-3">{state.items.map(item => <li key={item.id} className="rounded-xl border border-[var(--line)] p-3"><b className="text-sm">{item.payload.topic || item.payload.title || 'Saved change'}</b><p className="text-sm text-[var(--muted)]">{item.status === 'auth' ? 'Sign in again to continue syncing.' : item.status === 'rejected' ? item.error || 'Needs attention; export a copy before editing.' : 'Waiting to sync'}</p></li>)}</ul>
      {state.items.length > 0 && <div className="flex flex-wrap gap-2 mt-4"><button className="btn btn-primary" disabled={!state.online || state.syncing} onClick={() => retryOutbox().catch(() => toast.error('Unable to retry. Your saved changes are retained.'))}>Retry sync</button><button className="btn" onClick={download}>Export pending saves</button></div>}
    </Dialog></>;
}
