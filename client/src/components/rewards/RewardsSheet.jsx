import { useState } from 'react';
import { compressImage, toBase64 } from '../../lib/proofImage';
import SideSheet from '../SideSheet';

const Row = ({ title, hint, done, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--line)' }}>
    <span aria-hidden style={{ width: 20, height: 20, borderRadius: 10, background: done ? 'var(--flame)' : 'var(--surface-2)', flex: 'none' }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 500 }}>{title}</div>
      <div className="note">{hint}</div>
    </div>
    {action}
  </div>
);

function ProofForm({ month, onSubmit }) {
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pick = async (e) => {
    try {
      setFiles(await Promise.all([...e.target.files].slice(0, 3).map((f) => compressImage(f))));
      setErr('');
    } catch (x) {
      setErr(x.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await onSubmit({
        month,
        note: note.trim(),
        link: link || undefined,
        files: await Promise.all(
          files.map(async (f) => ({ type: 'image/jpeg', data: await toBase64(f) }))
        ),
      });
    } catch (x) {
      setErr(x.message || 'Could not send. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="stack space-y-2 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--line)]">
      <label className="fl text-xs font-medium" htmlFor={`proof-${month}`}>
        Show your work: up to 3 photos or screenshots
      </label>
      <input id={`proof-${month}`} type="file" accept="image/*" multiple onChange={pick} className="text-xs" />
      <input
        className="input w-full text-xs"
        maxLength={300}
        placeholder="What did you work on this month?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        aria-label="Short description"
      />
      <input
        className="input w-full text-xs"
        type="url"
        placeholder="Link to your work (optional)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        aria-label="Link"
      />
      <p className="note text-[11px]">Photos are shrunk on your device, checked by a person, then deleted.</p>
      {err && (
        <p role="alert" className="note" style={{ color: 'var(--danger)' }}>
          {err}
        </p>
      )}
      <button className="btn btn-primary text-xs" disabled={busy || (!files.length && !link)}>
        {busy ? 'Sending…' : `Submit month ${month}`}
      </button>
    </form>
  );
}

function ClaimForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await onSubmit({ name, line1, line2: line2 || undefined, city, state, zip, phone: phone || undefined });
    } catch (x) {
      setErr(x.message || 'Could not send claim.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="stack space-y-2 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--line)]">
      <h3 className="text-sm font-semibold">Claim the surprise reward</h3>
      <p className="note text-[11px]">US shipping address only. Address data is purged after fulfillment.</p>
      <input className="input w-full text-xs" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input w-full text-xs" placeholder="Street address line 1" value={line1} onChange={(e) => setLine1(e.target.value)} required />
      <input className="input w-full text-xs" placeholder="Apartment / suite (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <input className="input w-full text-xs" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
        <input className="input w-full text-xs uppercase" maxLength={2} placeholder="State (e.g. CA)" value={state} onChange={(e) => setState(e.target.value)} required />
        <input className="input w-full text-xs" placeholder="ZIP (e.g. 94105)" value={zip} onChange={(e) => setZip(e.target.value)} required />
      </div>
      <input className="input w-full text-xs" type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      {err && <p role="alert" className="note" style={{ color: 'var(--danger)' }}>{err}</p>}
      <button className="btn btn-primary text-xs" disabled={busy}>{busy ? 'Submitting…' : 'Submit claim'}</button>
    </form>
  );
}

export function RewardsContent({ data, onProof, onCertificate, onClaim }) {
  const {
    milestoneRun = 0,
    rewardRun = 0,
    milestones = [],
    proofs = [],
    eligible = true,
    claim = null,
  } = data || {};

  const has = (d) => milestones.includes(d);
  const status = (m) => proofs.find((p) => p.month === m)?.status;
  const approvedCount = proofs.filter((p) => p.status === 'approved').length;
  const canClaim = eligible && rewardRun >= 150 && approvedCount >= 5 && !claim;

  return (
    <div className="stack space-y-4">
      <div>
        <Row
          title="7-day badge"
          done={has(7)}
          hint={has(7) ? 'Earned' : `${Math.min(milestoneRun, 7)} of 7 days`}
        />
        <Row
          title="30-day certificate"
          done={has(30)}
          hint={has(30) ? 'Earned' : `${Math.min(milestoneRun, 30)} of 30 days`}
          action={has(30) && <button className="btn text-xs" onClick={onCertificate}>Download</button>}
        />
      </div>
      <p className="note text-xs">
        Timer minutes = sessions created by the real timer with a heartbeat at least once a minute. Badges and certificates count timer time only (25+ minutes a day).
      </p>

      <section className="space-y-3 pt-2">
        <h2 style={{ fontSize: 16 }} className="font-heading font-semibold text-[var(--text)]">Surprise reward</h2>
        {!eligible ? (
          <p className="note text-xs">
            A limited surprise reward exists for users aged 18+ in the US. See the{' '}
            <a href="/rewards-rules" className="underline text-[var(--primary)]">
              Rewards Rules
            </a>
            .
          </p>
        ) : (
          <>
            <p className="note text-xs">
              Study 60+ timer minutes every day for 150 days and show your work each month. Day {Math.min(rewardRun, 150)} of 150.
            </p>
            {[1, 2, 3, 4, 5].map((m) => {
              const s = status(m);
              const open = !s && rewardRun >= m * 30;
              return (
                <div key={m} className="space-y-2">
                  <Row
                    title={`Month ${m} work`}
                    done={s === 'approved'}
                    hint={
                      s === 'approved'
                        ? 'Approved'
                        : s === 'pending'
                        ? 'Waiting for review'
                        : s === 'rejected'
                        ? 'Not accepted, please resubmit'
                        : open
                        ? 'Ready to submit'
                        : `Unlocks at day ${m * 30}`
                    }
                  />
                  {(open || s === 'rejected') && <ProofForm month={m} onSubmit={onProof} />}
                </div>
              );
            })}

            {canClaim && onClaim && <ClaimForm onSubmit={onClaim} />}
            {claim && (
              <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--line)]">
                <span className="font-semibold text-xs">Claim status:</span>{' '}
                <span className="text-xs uppercase font-mono font-medium text-[var(--primary)]">{claim.status}</span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer Legal Links */}
      <div className="flex items-center justify-center gap-3 pt-4 border-t border-[var(--line)] text-[11px] text-[var(--muted)]">
        <a href="/terms" className="hover:underline hover:text-[var(--text)]">Terms</a>
        <span>·</span>
        <a href="/privacy" className="hover:underline hover:text-[var(--text)]">Privacy</a>
        <span>·</span>
        <a href="/rewards-rules" className="hover:underline hover:text-[var(--text)]">Rewards Rules</a>
      </div>
    </div>
  );
}

export default function RewardsSheet({ open, onClose, data, onProof, onCertificate, onClaim }) {
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title="Rewards & Milestones"
      description="Track verified focus milestones, badges, and progress toward the surprise reward"
    >
      <div className="py-2">
        <RewardsContent data={data} onProof={onProof} onCertificate={onCertificate} onClaim={onClaim} />
      </div>
    </SideSheet>
  );
}
