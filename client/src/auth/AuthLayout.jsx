import { Link } from 'react-router-dom';
import { Target, CheckCircle2, Flame, Clock } from 'lucide-react';

export function AuthLayout({ title, sub, children }) {
  return (
    <div className="min-h-[100dvh] w-full flex bg-[var(--bg)] text-[var(--text)] antialiased select-none">
      {/* Left Branding & Dashboard Preview Pane (Hidden under 900px / lg) */}
      <div className="hidden min-[900px]:flex min-[900px]:w-1/2 p-10 lg:p-14 bg-[var(--surface-2)] border-r border-[var(--line)] flex-col justify-between relative overflow-hidden">
        {/* Top Brand */}
        <Link to="/" className="flex items-center gap-3 w-fit group">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="font-heading font-bold text-[var(--text)] text-2xl tracking-tight">
            Track Here
          </span>
        </Link>

        {/* Center Headline & Value Proposition */}
        <div className="space-y-6 max-w-lg my-auto py-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-semibold tracking-wide uppercase font-mono">
              The Study Operating System
            </span>
            <h1 className="text-4xl lg:text-5xl font-heading font-bold text-[var(--text)] tracking-tight leading-[1.15]">
              Plan it. Focus. Review.
            </h1>
            <p className="text-base text-[var(--muted)] leading-relaxed">
              Build unstoppable study consistency, eliminate guesswork, log your problem journal, and protect your streak every single day.
            </p>
          </div>

          {/* Static Mini Preview Card of Dashboard */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                <span className="font-heading font-bold text-sm text-[var(--text)]">Today's Focus</span>
              </div>
              <span className="text-xs font-mono text-[var(--primary)] font-bold">4.0 hrs target</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[11px] text-[var(--muted)] block font-medium">Streak</span>
                <b className="text-sm font-heading font-bold text-[var(--warn)] flex items-center gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 fill-current" /> 14 Days
                </b>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[11px] text-[var(--muted)] block font-medium">Completed</span>
                <b className="text-sm font-heading font-bold text-[var(--primary)] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 8 Tasks
                </b>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
                <span className="text-[11px] text-[var(--muted)] block font-medium">Logged</span>
                <b className="text-sm font-heading font-bold text-[var(--text)] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" /> 3h 45m
                </b>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Guarantee */}
        <div className="text-xs text-[var(--muted)] font-medium">
          Free early access · No credit card required
        </div>
      </div>

      {/* Right Form Pane: Centered form card (max-w-[420px]) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto">
        {/* Mobile Header Brand (< 900px) */}
        <div className="min-[900px]:hidden mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold">
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-heading font-bold text-xl text-[var(--text)]">Track Here</span>
          </Link>
        </div>

        <div className="w-full max-w-[420px] space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--text)] tracking-tight">
              {title}
            </h2>
            {sub && <p className="text-sm text-[var(--muted)]">{sub}</p>}
          </div>

          <div className="card p-6 sm:p-8" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;

