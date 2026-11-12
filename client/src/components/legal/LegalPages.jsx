import { Link } from 'react-router-dom';
import { ArrowLeft, Target, ShieldCheck, FileText } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] p-6 sm:p-12 antialiased">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Track Here
        </Link>

        <div className="space-y-3 pb-6 border-b border-[var(--line)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-[var(--text)]">Terms of Service</h1>
          <p className="text-xs text-[var(--muted)]">Effective Date: November 2026</p>
        </div>

        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-heading font-bold text-[var(--text)]">1. Age Requirement</h2>
            <p>
              Track Here is intended solely for individuals aged 13 and older. If you are under 13, you are strictly prohibited from creating an account or submitting personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-heading font-bold text-[var(--text)]">2. User Accounts and Data</h2>
            <p>
              You own all study notes, tasks, problems, and session records you submit. Track Here does not sell, license, or monetize your study notes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-heading font-bold text-[var(--text)]">3. Account Deletion and Export</h2>
            <p>
              You may export all your data or permanently delete your account at any time from your Account Settings. Account deletion is permanent and wipes all associated records.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] p-6 sm:p-12 antialiased">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Track Here
        </Link>

        <div className="space-y-3 pb-6 border-b border-[var(--line)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-[var(--text)]">Privacy Policy</h1>
          <p className="text-xs text-[var(--muted)]">Effective Date: November 2026</p>
        </div>

        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-heading font-bold text-[var(--text)]">1. Minimal Data Collection</h2>
            <p>
              We collect only the information necessary to provide the service: your name, email address, password hash, and age band (<code className="text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">13_17</code> or <code className="text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">18_plus</code>). We never collect or store your date of birth.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-heading font-bold text-[var(--text)]">2. No Third-Party Tracking or Ads</h2>
            <p>
              Track Here contains no advertising networks, data brokers, or marketing trackers. Your focus habits, notes, and metrics remain private to your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-heading font-bold text-[var(--text)]">3. Security and Storage</h2>
            <p>
              Authentication sessions use secure cryptographic tokens, password hashes are salted with bcrypt, and all requests are encrypted in transit.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

