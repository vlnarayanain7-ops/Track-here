import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ShieldAlert, Check, X, HardDrive, Database, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, proofsRes, claimsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/proofs'),
        api.get('/admin/claims'),
      ]);
      setStats(statsRes.data);
      setProofs(proofsRes.data?.proofs || []);
      setClaims(claimsRes.data?.claims || []);
    } catch (err) {
      if ([401, 403, 404].includes(err.response?.status)) {
        setIsForbidden(true);
      } else {
        toast.error('Failed to load admin dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (proofId, status) => {
    const note = reviewNotes[proofId] || '';
    try {
      await api.post(`/admin/proofs/${proofId}/review`, { status, note });
      toast.success(`Proof ${status}`);
      fetchData();
    } catch {
      toast.error('Failed to submit review');
    }
  };

  const handleClaimStatus = async (claimId, status) => {
    try {
      await api.patch(`/admin/claims/${claimId}`, { status });
      toast.success(`Claim set to ${status}`);
      fetchData();
    } catch {
      toast.error('Failed to update claim');
    }
  };

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-heading font-bold mb-2">404</h1>
        <p className="text-xs text-[var(--muted)]">The requested page was not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-xs text-[var(--muted)]">
        Loading admin console…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6 sm:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-2xl font-bold font-heading">Admin Operations</h1>
          <p className="text-xs text-[var(--muted)] mt-1">Review proofs of work, claim fulfillment, and free tier storage</p>
        </div>
      </div>

      {/* Storage Limit Monitor */}
      {stats && (
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="text-sm font-semibold">MongoDB Atlas Storage (512 MB Free Tier)</h2>
            </div>
            <span className="text-xs font-mono font-medium">
              {stats.storageMB} MB / 512 MB ({stats.usedPct}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className={`h-full transition-all ${
                stats.usedPct >= 70 ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]'
              }`}
              style={{ width: `${Math.min(100, stats.usedPct)}%` }}
            />
          </div>

          {stats.usedPct >= 70 && (
            <div className="flex items-center gap-2 text-xs text-[var(--danger)] bg-[var(--danger-soft)] p-2.5 rounded-xl border border-[var(--danger)]/20">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Warning: Storage usage is above 70%. Run compaction script to purge expired sessions.</span>
            </div>
          )}
        </div>
      )}

      {/* Pending Proofs of Work */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold font-heading">Pending Monthly Proofs ({proofs.length})</h2>
        {proofs.length === 0 ? (
          <p className="note p-6 text-center bg-[var(--surface)] rounded-2xl border border-[var(--line)] text-xs">
            No pending submissions waiting for review.
          </p>
        ) : (
          <div className="space-y-4">
            {proofs.map((p) => (
              <div key={p._id} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold">{p.user?.name || 'User'}</span>{' '}
                    <span className="text-xs text-[var(--muted)]">({p.user?.email})</span>
                  </div>
                  <span className="text-xs font-mono bg-[var(--surface-2)] px-2 py-0.5 rounded">
                    Month {p.month} · {p.user?.rewardRun || 0} Reward Days
                  </span>
                </div>

                {p.note && <p className="text-xs text-[var(--text)] italic">&ldquo;{p.note}&rdquo;</p>}
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-[var(--primary)] underline block">
                    {p.link}
                  </a>
                )}

                {/* Display submitted images if pending */}
                {p.files?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {p.files.map((f, idx) => (
                      <img
                        key={idx}
                        src={`data:${f.type};base64,${f.data?.toString('base64') || f.data}`}
                        alt="Proof screenshot"
                        className="rounded-lg border border-[var(--line)] object-cover max-h-40 w-full"
                      />
                    ))}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Optional review note..."
                    value={reviewNotes[p._id] || ''}
                    onChange={(e) => setReviewNotes({ ...reviewNotes, [p._id]: e.target.value })}
                    className="input text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleReview(p._id, 'approved')}
                    className="btn btn-primary text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(p._id, 'rejected')}
                    className="btn btn-secondary text-xs flex items-center gap-1 text-[var(--danger)]"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim Allocations */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold font-heading">Claim Submissions ({claims.length})</h2>
        {claims.length === 0 ? (
          <p className="note p-6 text-center bg-[var(--surface)] rounded-2xl border border-[var(--line)] text-xs">
            No claims submitted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {claims.map((c) => (
              <div key={c._id} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">{c.address?.name || c.user?.name}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {c.address?.line1}, {c.address?.city}, {c.address?.state} {c.address?.zip}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[var(--surface-2)]">
                    {c.status}
                  </span>
                  {c.status === 'pending' && (
                    <>
                      <button onClick={() => handleClaimStatus(c._id, 'approved')} className="btn text-xs">Approve</button>
                      <button onClick={() => handleClaimStatus(c._id, 'shipped')} className="btn btn-primary text-xs">Mark Shipped</button>
                      <button onClick={() => handleClaimStatus(c._id, 'rejected')} className="btn text-xs text-[var(--danger)]">Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
