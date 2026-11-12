import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dialog from '@/components/ui/Dialog';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import { Download, Upload, Trash2, AlertTriangle, MessageSquarePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function DataSettings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Deletion form state
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await usersApi.exportData();
      const payload = res.data || res;
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `track-here-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('All study data exported successfully!');
    } catch (err) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const dataToImport = json.data || json;
        await usersApi.importData(dataToImport);
        toast.success('Data imported successfully! Refreshing...');
        window.location.reload();
      } catch (err) {
        toast.error('Failed to parse or import backup file: ' + err.message);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAccount = async (e) => {
    e?.preventDefault();
    if (deleteConfirmationText.trim() !== 'DELETE') {
      toast.error('Please type DELETE in capital letters to confirm.');
      return;
    }
    if (!deletePassword) {
      toast.error('Please enter your password to confirm account deletion.');
      return;
    }

    setDeleting(true);
    try {
      await usersApi.deleteAccount({ password: deletePassword });
      toast.success('Account and all associated records permanently purged.');
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account. Please verify password.');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Portability */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold">Data Backup &amp; Portability</CardTitle>
          <p className="text-xs text-text-secondary">
            Export a full JSON backup of all sessions, tasks, notes, and problems, or restore from a backup
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface/40 border border-border">
            <div>
              <span className="text-xs font-semibold text-text-primary block">
                Export Complete Data (JSON)
              </span>
              <span className="text-xs text-text-secondary">
                Includes all private study sessions, task history, notes, and problem attempts
              </span>
            </div>
            <Button
              onClick={handleExport}
              loading={exporting}
              variant="outline"
              size="sm"
              icon={Download}
              className="text-xs shrink-0"
            >
              Export JSON
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface/40 border border-border">
            <div>
              <span className="text-xs font-semibold text-text-primary block">
                Restore from Backup
              </span>
              <span className="text-xs text-text-secondary">
                Upload a previously exported Track Here JSON file (auto-validated with new IDs)
              </span>
            </div>
            <label className="inline-flex items-center justify-center rounded-lg font-medium transition-colors border border-border bg-transparent text-text-primary hover:bg-surface h-8 px-3 text-xs gap-1.5 cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>{importing ? 'Importing...' : 'Upload Backup'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
                disabled={importing}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Community & Feedback */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-semibold">Beta Feedback</CardTitle>
          <p className="text-xs text-text-secondary">
            Share ideas, report bugs, or request features directly to the founder
          </p>
        </CardHeader>
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-text-primary block">
              Send Feedback &amp; Suggestions
            </span>
            <span className="text-xs text-text-secondary">
              Help shape Track Here during the beta program. All suggestions are reviewed.
            </span>
          </div>
          <Button
            onClick={() => setFeedbackModalOpen(true)}
            variant="outline"
            size="sm"
            icon={MessageSquarePlus}
            className="text-xs shrink-0"
          >
            Send Feedback
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-900/40 bg-rose-950/10">
        <CardHeader className="pb-3 border-b border-rose-900/30">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <CardTitle className="text-base font-semibold text-rose-400">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-text-primary block">
              Delete Account &amp; Permanently Purge All Data
            </span>
            <span className="text-xs text-text-secondary">
              This action cannot be undone. All your study sessions, tasks, notes, and records will be deleted forever.
            </span>
          </div>
          <Button
            onClick={() => {
              setDeleteConfirmationText('');
              setDeletePassword('');
              setDeleteModalOpen(true);
            }}
            variant="destructive"
            size="sm"
            icon={Trash2}
            className="text-xs shrink-0"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Secure Typed Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Permanently Delete Account"
        size="sm"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed">
            <p className="font-semibold mb-1">Warning: Irreversible Action</p>
            This will permanently erase your user account and all your study sessions, tasks, notes, problem logs, and revision queues.
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1 font-heading">
              Type <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm:
            </label>
            <Input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1 font-heading">
              Confirm your password:
            </label>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your current password"
              className="text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              loading={deleting}
              disabled={deleteConfirmationText.trim() !== 'DELETE' || !deletePassword}
            >
              Permanently Delete Account
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Feedback Modal */}
      <FeedbackModal open={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    </div>
  );
}
