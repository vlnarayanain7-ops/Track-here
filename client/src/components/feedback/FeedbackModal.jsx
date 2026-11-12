import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { MessageSquarePlus, Send, Bug, Lightbulb, HelpCircle } from 'lucide-react';

export default function FeedbackModal({ open, onClose }) {
  const location = useLocation();
  const [type, setType] = useState('Idea');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanMsg = message.trim();
    if (cleanMsg.length < 3) {
      toast.error('Feedback must be at least 3 characters.');
      return;
    }
    if (cleanMsg.length > 2000) {
      toast.error('Feedback cannot exceed 2000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/feedback', {
        type,
        message: cleanMsg,
        route: location.pathname + location.search,
        appVersion: '1.0.0',
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
        },
      });
      toast.success('Thank you! Your feedback has been received.');
      setMessage('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Send Feedback to Developer" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-[var(--muted)]">
          Help improve Track Here! Found a bug or have an idea? Tell us what you think.
        </p>

        <div>
          <label className="block text-xs font-semibold text-[var(--text)] mb-1.5 font-heading">
            Feedback Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Idea', label: 'Idea', icon: Lightbulb },
              { id: 'Bug', label: 'Bug', icon: Bug },
              { id: 'Other', label: 'Other', icon: HelpCircle },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-2xs'
                      : 'bg-[var(--surface-2)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[var(--text)] font-heading">
              Your Message
            </label>
            <span className="text-[11px] text-[var(--muted)] font-mono">
              {message.length} / 2000
            </span>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what happened or what you'd love to see..."
            rows={5}
            maxLength={2000}
            className="text-xs resize-none"
            required
          />
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
          <span>Route: {location.pathname}</span>
          <span>v1.0.0</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" icon={Send} loading={submitting}>
            Submit Feedback
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

