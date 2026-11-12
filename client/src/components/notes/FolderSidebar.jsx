import { useState } from 'react';
import { Folder, FolderPlus, Pin, Hash, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function FolderSidebar({
  folders = [],
  selectedFolder,
  onSelectFolder,
  showPinnedOnly,
  onTogglePinnedOnly,
  onAddFolder,
}) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-56 shrink-0 bg-card border border-border rounded-2xl p-3.5 space-y-4 hidden md:block shadow-xs">
      {/* Quick Filters */}
      <div className="space-y-1">
        <button
          onClick={() => {
            onSelectFolder(null);
            if (showPinnedOnly) onTogglePinnedOnly();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
            !selectedFolder && !showPinnedOnly
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-semibold shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${!selectedFolder && !showPinnedOnly ? 'bg-emerald-100 text-emerald-800' : 'bg-surface text-text-muted'}`}>
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span>All Notes</span>
        </button>

        <button
          onClick={onTogglePinnedOnly}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
            showPinnedOnly
              ? 'bg-amber-50 text-amber-900 border border-amber-200/80 font-semibold shadow-2xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${showPinnedOnly ? 'bg-amber-100 text-amber-800' : 'bg-surface text-text-muted'}`}>
            <Pin className="w-3.5 h-3.5" />
          </div>
          <span>Pinned</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-border/60" />

      {/* Folders List */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">
            Folders
          </span>
          <button
            type="button"
            onClick={() => setIsAdding((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline px-1 py-0.5"
            title="New folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New folder</span>
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreateFolder} className="mb-2">
            <Input
              size="sm"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="text-xs h-7"
              autoFocus
            />
          </form>
        )}

        <div className="space-y-0.5 max-h-56 overflow-y-auto">
          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => onSelectFolder(folder)}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left truncate ${
                selectedFolder === folder
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/60 font-semibold shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              <Folder className={`w-3.5 h-3.5 shrink-0 ${selectedFolder === folder ? 'text-emerald-700' : 'text-text-muted'}`} />
              <span className="truncate">{folder}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
