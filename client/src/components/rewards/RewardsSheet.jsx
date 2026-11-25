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

export function RewardsContent({ data, onCertificate }) {
  const {
    milestoneRun = 0,
    milestones = [],
    proofs = [],
    claim = null,
  } = data || {};

  const has = (d) => milestones.includes(d);
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

      <section>
        <p className="note text-xs">Physical reward submissions are closed. Existing claims continue through review and fulfillment.</p>
        {claim && <p>Claim status: {claim.status}</p>}
        {proofs.map(proof => <p key={proof.month}>Month {proof.month} proof: {proof.status}</p>)}
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

export default function RewardsSheet({ open, onClose, data, onCertificate }) {
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title="Rewards & Milestones"
      description="Track verified focus milestones, badges, and certificates"
    >
      <div className="py-2">
        <RewardsContent data={data} onCertificate={onCertificate} />
      </div>
    </SideSheet>
  );
}
