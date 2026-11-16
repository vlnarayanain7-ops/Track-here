import { useState, useEffect, useRef } from 'react';
import axios from '@/api/axios';
import { drawReportCard, shareReportCard } from '@/lib/reportCard';
import { saveReportLocal } from '@/lib/localStore';
import { Download, Share2, Bookmark, Check, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportModal({
  open,
  onClose,
  type = 'daily', // 'daily' | 'weekly'
  dateStr = new Date().toISOString().split('T')[0],
  minutes = 0,
  sessions = 0,
  streak = 0,
  topSubject = null,
  userName = '',
  onSaved,
}) {
  const [showName, setShowName] = useState(false);
  const [displayName, setDisplayName] = useState(userName || '');
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  // Generate card on device canvas whenever parameters change
  useEffect(() => {
    if (!open) return;
    let active = true;

    async function generate() {
      setGenerating(true);
      try {
        const b = await drawReportCard({
          type,
          dateStr,
          minutes,
          sessions,
          streak,
          topSubject,
          showName,
          displayName,
        });
        if (active) {
          setBlob(b);
          setPreviewUrl(URL.createObjectURL(b));
        }
      } catch (err) {
        console.error('Failed to draw report card:', err);
      } finally {
        if (active) setGenerating(false);
      }
    }

    generate();
    return () => {
      active = false;
    };
  }, [open, type, dateStr, minutes, sessions, streak, topSubject, showName, displayName]);

  if (!open) return null;

  const handleSave = async () => {
    if (!blob) return;
    try {
      const id = `${type}-${dateStr}-${Date.now()}`;
      const summary = {
        type,
        date: dateStr,
        minutes,
        sessions,
        streak,
        topSubject,
      };

      // 1. Save to device IndexedDB
      await saveReportLocal(id, blob, summary);

      // 2. If daily and online, write tiny summary row to server (auto deleted after 2 days by TTL)
      if (type === 'daily') {
        try {
          await axios.post('/api/reports/daily', {
            date: dateStr,
            summary: {
              minutes,
              sessions,
              streak,
              topSubject,
            },
          });
        } catch {
          // If offline, device copy is completely sufficient
        }
      }

      setSaved(true);
      toast.success('Report saved to device');
      onSaved?.();
    } catch (err) {
      toast.error('Failed to save report: ' + err.message);
    }
  };

  const handleDownload = async () => {
    if (!blob) return;
    const filename = `track-here-${type}-report-${dateStr}.png`;
    await shareReportCard(blob, filename);
  };

  const handleShare = async () => {
    if (!blob) return;
    const filename = `track-here-${type}-report-${dateStr}.png`;
    await shareReportCard(blob, filename, `Track Here ${type === 'weekly' ? 'Weekly' : 'Daily'} Report`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-base font-bold font-heading text-[var(--text)]">
              {type === 'weekly' ? 'This Week’s Report' : 'Today’s Report'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Canvas Preview */}
        <div className="rounded-xl overflow-hidden border border-[var(--line)] bg-black/30 flex items-center justify-center min-h-[220px]">
          {generating || !previewUrl ? (
            <div className="text-xs text-[var(--muted)] animate-pulse">Drawing card on device…</div>
          ) : (
            <img
              src={previewUrl}
              alt="Report Card Preview"
              className="w-full h-auto object-contain rounded-lg shadow-sm"
            />
          )}
        </div>

        {/* Display name toggle */}
        <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-[var(--text)] select-none">
            <input
              type="checkbox"
              checked={showName}
              onChange={(e) => setShowName(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--primary)]"
            />
            <span>Include my name on this card</span>
          </label>
          {showName && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              maxLength={40}
              className="input w-full text-xs"
            />
          )}
          <p className="note text-[11px] text-[var(--muted)]">
            Contains no email, no task titles, and no personal notes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!blob || saved}
            className="btn text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved on device' : 'Save to device'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!blob}
            className="btn text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={!blob}
            className="btn btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
