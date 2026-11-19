import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '@/hooks/useTimer';
import { useUpdateTaskStatus } from '@/hooks/useTasks';
import { useCreateRevision } from '@/hooks/useRevisions';
import Dialog from '@/components/ui/Dialog';
import toast from 'react-hot-toast';
export default function SessionCompletion() {
  const { lastSaved: session, dismissSaved } = useTimer();
  const navigate = useNavigate();
  const complete = useUpdateTaskStatus();
  const revision = useCreateRevision();
  const [completedId, setCompletedId] = useState(null);
  const [reviewId, setReviewId] = useState(null);
  return <Dialog open={!!session} onClose={dismissSaved} title="Focus block complete" description="Saved on this device. Check the cloud icon for sync progress.">
    {session && <div className="space-y-4"><p className="text-xl font-semibold">{Math.round(session.durationSec / 60)} minutes ? {session.category}</p><p>{session.topic}</p>
      <div className="flex flex-wrap gap-2">{session.linkedTask && <button className="btn btn-primary" disabled={complete.isPending || completedId === session.clientId} onClick={async () => { try { await complete.mutateAsync({ id: session.linkedTask, status: 'Completed' }); setCompletedId(session.clientId); } catch { toast.error('Task could not be updated. Your session is saved.'); } }}>{completedId === session.clientId ? 'Task completed' : 'Complete task'}</button>}
      <button className="btn" onClick={() => { navigate(`/notes?action=new&title=${encodeURIComponent(session.topic)}&subject=${encodeURIComponent(session.category)}`); dismissSaved(); }}>Add learning note</button>
      <button className="btn" disabled={revision.isPending || reviewId === session.clientId} onClick={async () => { try { await revision.mutateAsync({ title: session.topic, type: 'topic', dueDate: new Date(Date.now() + 86400000).toISOString(), intervalDays: 1 }); setReviewId(session.clientId); } catch { /* mutation displays error */ } }}>{reviewId === session.clientId ? 'Revision scheduled' : 'Review tomorrow'}</button></div>
      <button className="btn btn-ghost" onClick={dismissSaved}>Continue</button></div>}
  </Dialog>;
}
