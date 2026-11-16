import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Award, Calendar, ArrowLeft } from 'lucide-react';

export default function VerifyCertificatePage() {
  const { serial } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVerification() {
      try {
        setLoading(true);
        const res = await axios.get(`/api/verify/${encodeURIComponent(serial)}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Verification service temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    }
    if (serial) {
      fetchVerification();
    }
  }, [serial]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
          <Link to="/" className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Track Here</span>
          </Link>
          <span className="text-[11px] font-mono tracking-wider px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted)]">
            {serial?.toUpperCase()}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--muted)] animate-pulse">
            Verifying certificate authenticity…
          </div>
        ) : error ? (
          <div className="text-center py-6 space-y-2">
            <XCircle className="w-10 h-10 text-[var(--danger)] mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : data?.valid ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-500 tracking-wide uppercase">Verified Certificate</span>
                <h1 className="text-lg font-bold font-heading text-[var(--text)]">30-day focus streak</h1>
              </div>
            </div>

            <div className="space-y-3 bg-[var(--surface-2)] p-4 rounded-xl text-xs">
              {data.name && (
                <div className="flex justify-between items-center py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">Issued to</span>
                  <span className="font-semibold text-[var(--text)]">{data.name}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-[var(--line)]">
                <span className="text-[var(--muted)]">Achievement</span>
                <span className="font-medium text-[var(--text)]">30-day focus streak</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[var(--muted)]">Issued date</span>
                <span className="font-medium text-[var(--text)]">
                  {new Date(data.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <p className="note text-[11px] text-center text-[var(--muted)]">
              Not academic credit or a professional accreditation.
            </p>
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <XCircle className="w-12 h-12 text-[var(--danger)] mx-auto" />
            <h2 className="text-base font-bold font-heading">Invalid Certificate</h2>
            <p className="text-xs text-[var(--muted)]">
              No verified certificate was found matching serial number <span className="font-mono">{serial}</span>.
            </p>
            <p className="note text-[11px] text-[var(--muted)]">
              Not academic credit or a professional accreditation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
