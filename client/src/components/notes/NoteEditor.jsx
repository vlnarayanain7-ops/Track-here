import { useState, useEffect, useRef, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';
import MarkdownEditor from './MarkdownEditor';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useUpdateNote, useDeleteNote } from '@/hooks/useNotes';
import { Pin, Trash2, Check, AlertCircle, Loader2, Code, FileText, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function NoteEditor({ note, folders = [], onDelete, onBack }) {
  const updateMutation = useUpdateNote();

  const [title, setTitle] = useState(note?.title || '');
  const [folder, setFolder] = useState(note?.folder || 'General');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [isPinned, setIsPinned] = useState(!!note?.isPinned);
  const [mode, setMode] = useState('rich'); // 'rich' or 'markdown'

  // Content states
  const [contentHtml, setContentHtml] = useState(note?.contentHtml || '');
  const [contentMarkdown, setContentMarkdown] = useState(note?.contentMarkdown || '');

  // Saving states: 'idle' | 'saving' | 'saved' | 'failed'
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSavedAt, setLastSavedAt] = useState(note?.updatedAt ? new Date(note.updatedAt) : new Date());

  const debounceTimerRef = useRef(null);

  // Sync state when selected note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setFolder(note.folder || 'General');
      setTags(note.tags?.join(', ') || '');
      setIsPinned(!!note.isPinned);
      setContentHtml(note.contentHtml || '');
      setContentMarkdown(note.contentMarkdown || '');
      setSaveStatus('saved');
      setLastSavedAt(note.updatedAt ? new Date(note.updatedAt) : new Date());
    }
  }, [note?._id]);

  const saveNote = useCallback(
    async (updatedFields = {}) => {
      if (!note?._id) return;
      setSaveStatus('saving');

      const payload = {
        title: updatedFields.title ?? title,
        folder: updatedFields.folder ?? folder,
        tags: (updatedFields.tags ?? tags)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isPinned: updatedFields.isPinned ?? isPinned,
        contentHtml: updatedFields.contentHtml ?? contentHtml,
        contentMarkdown: updatedFields.contentMarkdown ?? contentMarkdown,
      };

      try {
        await updateMutation.mutateAsync({ id: note._id, data: payload });
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      } catch (err) {
        setSaveStatus('failed');
      }
    },
    [note?._id, title, folder, tags, isPinned, contentHtml, contentMarkdown, updateMutation]
  );

  const triggerAutosave = (fields = {}) => {
    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      saveNote(fields);
    }, 1200);
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    triggerAutosave({ title: val });
  };

  const handleFolderChange = (val) => {
    setFolder(val);
    saveNote({ folder: val });
  };

  const handleTogglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    saveNote({ isPinned: next });
  };

  const handleRichTextChange = ({ html, text }) => {
    setContentHtml(html);
    setContentMarkdown(text);
    triggerAutosave({ contentHtml: html, contentMarkdown: text });
  };

  const handleMarkdownChange = (md) => {
    setContentMarkdown(md);
    setContentHtml('');
    triggerAutosave({ contentMarkdown: md });
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface/50 rounded-2xl border border-border">
        {/* Left: Mode toggle & Folder select */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 text-xs"
              aria-label="Back to notes list"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <div className="flex bg-card rounded-xl p-0.5 border border-border">
            <button
              onClick={() => setMode('rich')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                mode === 'rich'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Rich Text</span>
            </button>
            <button
              onClick={() => setMode('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                mode === 'markdown'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>

          <div className="w-36">
            <Select
              value={folder}
              onChange={(e) => handleFolderChange(e.target.value)}
              className="text-xs h-8"
            >
              <option value="General">General</option>
              {folders
                .filter((f) => f !== 'General')
                .map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
            </Select>
          </div>
        </div>

        {/* Right: Saving State Indicator & Action buttons */}
        <div className="flex items-center gap-2.5">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-text-muted">
                <Loader2 className="w-3 h-3 animate-spin text-accent" />
                <span className="text-[11px]">Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-success" />
                <span className="text-[10px] text-text-muted font-mono">
                  {format(lastSavedAt, 'h:mm a')}
                </span>
              </span>
            )}
            {saveStatus === 'failed' && (
              <button
                onClick={() => saveNote()}
                className="flex items-center gap-1.5 text-danger hover:underline text-[11px]"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>

          {/* Pin */}
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg border transition-all duration-200 ${
              isPinned
                ? 'border-warning/40 bg-warning/10 text-warning shadow-xs'
                : 'border-border/60 text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
            title={isPinned ? 'Pinned' : 'Pin note'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(note._id)}
            className="p-1.5 rounded-lg border border-border/60 text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all duration-200"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note Title..."
          className="w-full bg-transparent text-xl font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none border-b border-border/30 pb-2 focus:border-accent/40 transition-colors"
        />
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'rich' ? (
          <RichTextEditor
            content={contentHtml || contentMarkdown}
            onChange={handleRichTextChange}
          />
        ) : (
          <MarkdownEditor
            content={contentMarkdown}
            onChange={handleMarkdownChange}
          />
        )}
      </div>
    </div>
  );
}
