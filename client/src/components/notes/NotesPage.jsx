import SubjectLabel from '@/components/ui/SubjectLabel';
import EmptyIllustration from '@/components/brand/EmptyIllustration';
import { readNoteDraft, saveNoteDraft, queueNoteDraft } from '@/lib/noteDrafts';
import DOMPurify from 'dompurify';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes';
import { useCreateRevision } from '@/hooks/useRevisions';
import { Plus, Pin, Trash2, ArrowLeft, Check, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const userSubjects = useMemo(() => {
    if (!user?.subjects || !Array.isArray(user.subjects)) return [];
    return user.subjects.map((s) => s.name || s);
  }, [user]);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [activeNoteId, setActiveNoteId] = useState(searchParams.get('id') || null);
  const [mobileEditing, setMobileEditing] = useState(false);

  // Editor state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [folder, setFolder] = useState('General');
  const [isSaved, setIsSaved] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const saveTimeoutRef = useRef(null);
  const pendingDrafts = useRef(new Map());
  const currentNoteRef = useRef(null);
  const ownerId = String(user._id || user.id);
  const textareaRef = useRef(null);
  const titleInputRef = useRef(null);

  const { data: notesData, refetch } = useNotes({
    folder: selectedSubject || undefined,
  });

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const createRevisionMutation = useCreateRevision();

  const handleAddToReview = async () => {
    if (!activeNote?._id) return;
    try {
      await createRevisionMutation.mutateAsync({
        title: activeNote.title || 'Untitled note',
        type: 'note',
        linkedNote: activeNote._id,
        dueDate: new Date().toISOString(),
        intervalDays: 1,
      });
    } catch {
      // toast is already handled in useCreateRevision
    }
  };

  const notes = useMemo(() => {
    return notesData?.data?.notes || notesData?.notes || [];
  }, [notesData]);

  // Active note
  const activeNote = useMemo(() => {
    if (!notes || notes.length === 0) return null;
    if (!activeNoteId) return notes[0];
    return notes.find((n) => n._id === activeNoteId) || notes[0];
  }, [notes, activeNoteId]);

  // Load active note into editor fields
  useEffect(() => {
    if (activeNote) {
      setActiveNoteId(activeNote._id);
      currentNoteRef.current = activeNote._id;
      const draft = readNoteDraft(ownerId, activeNote);
      setTitle(draft?.title ?? activeNote.title ?? '');
      const legacy = new DOMParser().parseFromString(DOMPurify.sanitize(activeNote.contentHtml || ''), 'text/html').body.textContent;
      setBody(draft?.contentMarkdown ?? (activeNote.contentMarkdown || legacy || ''));
      setFolder(draft?.folder ?? activeNote.folder ?? 'General');
      if (draft) queueNoteDraft(ownerId, activeNote._id, draft).catch(() => setSaveError('Draft retained. Retry saving when storage is available.'));
      setIsSaved(true);
      setSaveError(null);
    } else {
      setTitle('');
      setBody('');
      setFolder(selectedSubject || 'General');
    }
  }, [activeNote?._id]);

  // Draft synchronously before debounce; queue writes use one stable key per note.
  useEffect(() => () => {
    clearTimeout(saveTimeoutRef.current);
    for (const [id, draft] of pendingDrafts.current) void queueNoteDraft(ownerId, id, draft).catch(() => {});
  }, [ownerId]);

  const triggerAutosave = (newTitle, newBody, newFolder = folder, immediate = false) => {
    if (!activeNote?._id) return;
    const id = activeNote._id;
    setIsSaved(false);
    setSaveError(null);
    let draft;
    try {
      draft = saveNoteDraft(ownerId, id, { title: newTitle || 'Untitled note', folder: newFolder || 'General', contentMarkdown: newBody, contentHtml: '' });
      pendingDrafts.current.set(id, draft);
    } catch {
      setSaveError('Device storage is full. Copy your text before leaving this page.');
      return;
    }
    clearTimeout(saveTimeoutRef.current);
    const flush = async () => {
      for (const [noteId, pending] of pendingDrafts.current) {
        try {
          await queueNoteDraft(ownerId, noteId, pending);
          if (pendingDrafts.current.get(noteId) === pending) {
            pendingDrafts.current.delete(noteId);
            if (currentNoteRef.current === noteId) setIsSaved(true);
          }
        } catch { if (currentNoteRef.current === noteId) setSaveError('Draft is retained on this device. Retry saving.'); }
      }
    };
    if (immediate) void flush();
    else saveTimeoutRef.current = setTimeout(flush, 800);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutosave(val, body, folder);
  };

  const handleBodyChange = (e) => {
    const val = e.target.value;
    setBody(val);
    triggerAutosave(title, val, folder);
  };

  const handleFolderChange = (e) => {
    const val = e.target.value;
    setFolder(val);
    triggerAutosave(title, body, val, true);
  };

  // Format toolbar helpers
  const insertFormatting = (prefix, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const nextBody = body.substring(0, start) + replacement + body.substring(end);

    setBody(nextBody);
    triggerAutosave(title, nextBody);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 0);
  };

  const handleCreateNote = async () => {
    if (createNoteMutation.isPending) return;
    const targetFolder = searchParams.get('subject') || selectedSubject || 'General';
    try {
      const res = await createNoteMutation.mutateAsync({
        title: searchParams.get('title') || 'Untitled note',
        folder: targetFolder,
        contentMarkdown: '',
        contentHtml: '',
      });
      const created = res?.data?.note || res?.note || res;
      if (created?._id) {
        setActiveNoteId(created._id);
        setMobileEditing(true);
      }
      await refetch();
    } catch (err) {
      toast.error('Failed to create note');
    }
  };

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleCreateNote();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      nextParams.delete('title');
      nextParams.delete('subject');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  const handleDeleteActiveNote = async () => {
    if (!activeNote?._id) return;
    if (window.confirm('Delete this note?')) {
      try {
        await deleteNoteMutation.mutateAsync(activeNote._id);
        toast.success('Note deleted');
        setActiveNoteId(null);
        setMobileEditing(false);
        refetch();
      } catch (err) {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleTogglePin = async () => {
    if (!activeNote?._id) return;
    try {
      await updateNoteMutation.mutateAsync({
        id: activeNote._id,
        data: { isPinned: !activeNote.isPinned },
      });
      refetch();
    } catch (err) {
      toast.error('Failed to pin note');
    }
  };

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return 'Today';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 864e5);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="sec mt-0 mb-4">
        <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--tx)]">Notes</h1>
        <button
          type="button"
          data-tour="new-note" onClick={handleCreateNote}
          className="btn flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New note
        </button>
      </div>

      {/* 2-Column Layout: List (220px) + Editor */}
      <div className="notes">
        {/* Left Column: Note List (Hidden on phone if editing) */}
        <div className={`space-y-3 ${mobileEditing ? 'hidden min-[761px]:block' : 'block'}`}>
          {/* Subject Filter in List Header */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--ln)] bg-[var(--sf)] text-[var(--tx)] focus:outline-none cursor-pointer"
            aria-label="Filter notes by subject"
          >
            <option value="">All subjects</option>
            <option value="General">General (Normal notes)</option>
            {userSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Notes list */}
          {notes.length === 0 ? (
            <div className="note py-6 text-center text-xs"><EmptyIllustration kind="notes" className="w-28 h-auto mx-auto mb-3" />No notes in this subject yet</div>
          ) : (
            <div className="nl">
              {notes.map((note) => {
                const isActive = note._id === activeNote?._id;
                return (
                  <button
                    key={note._id}
                    type="button"
                    onClick={() => {
                      setActiveNoteId(note._id);
                      setMobileEditing(true);
                    }}
                    className={`ni ${isActive ? 'on' : ''}`}
                  >
                    <b className="flex items-center gap-1.5">
                      {note.isPinned && <Pin className="w-3 h-3 text-[var(--pr)] fill-current shrink-0" />}
                      <span className="truncate">{note.title || 'Untitled note'}</span>
                    </b>
                    <span className="flex items-center justify-between text-[11px] text-[var(--mu)] mt-0.5">
                      <span>{formatRelativeDate(note.updatedAt || note.createdAt)}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--sf2)] text-[var(--mu)]">
                        {note.folder || 'General'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Editor (Hidden on phone if not editing) */}
        <div className={`ed ${!mobileEditing ? 'hidden min-[761px]:flex' : 'flex'}`}>
          {/* Mobile Back Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--ln)] min-[761px]:hidden">
            <button
              type="button"
              onClick={() => setMobileEditing(false)}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--pr)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Notes
            </button>
            <span data-testid="mobile-saved-indicator" className="text-[11px] text-[var(--mu)]">
              {isSaved ? 'Saved on device' : 'Saving...'}
            </span>
          </div>

          {/* Subject Selector for current note */}
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs text-[var(--mu)] font-medium">Subject:</span>
            <select
              value={folder}
              onChange={handleFolderChange}
              className="h-7 px-2 text-xs rounded-lg border border-[var(--ln)] bg-[var(--sf2)] text-[var(--tx)] focus:border-[var(--pr)] focus:outline-none cursor-pointer"
              aria-label="Note subject"
            >
              <option value="General">General (Normal note)</option>
              {userSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <SubjectLabel name={folder} color={user?.subjects?.find(s => s.name === folder)?.color} />
          {/* Top controls: Pin, Delete, Saved Indicator */}
          <div className="flex items-center justify-between gap-2">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Note title"
              disabled={!activeNote}
              aria-label="Title"
              className="tt"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span data-testid="desktop-saved-indicator" className="text-xs text-[var(--mu)] hidden min-[761px]:inline">
                {isSaved ? 'Saved on device' : 'Saving...'}
              </span>
              {activeNote && (
                <>
                  <button
                    type="button"
                    onClick={handleAddToReview}
                    className="btn g text-xs h-7 px-2 border border-[var(--ln)] hover:border-[var(--pr)] cursor-pointer"
                    title="Add to review queue"
                  >
                    Add to review
                  </button>
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    className={`p-1.5 rounded-lg border border-[var(--ln)] transition-colors ${
                      activeNote.isPinned ? 'bg-[var(--soft)] text-[var(--pr)]' : 'text-[var(--mu)] hover:text-[var(--tx)]'
                    }`}
                    aria-label={activeNote.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${activeNote.isPinned ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteActiveNote}
                    className="p-1.5 rounded-lg border border-[var(--ln)] text-[var(--mu)] hover:text-red-500 transition-colors"
                    aria-label="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Visible error alert on failed save with Retry button */}
          {saveError && (
            <div
              role="alert"
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)]"
            >
              <span>Could not save note: {saveError}</span>
              <button
                type="button"
                onClick={() => triggerAutosave(title, body, true)}
                className="underline font-semibold cursor-pointer bg-transparent border-0 p-0 text-[var(--danger)]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Formatting Toolbar: Appears ONLY while editor is focused */}
          <div className="tools">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('### ')}
              title="Heading"
            >
              H
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- ')}
              title="Bullet list"
            >
              •
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`')}
              title="Code snippet"
            >
              &lt;/&gt;
            </button>
          </div>

          {/* Editor Textarea */}
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleBodyChange}
            placeholder="Write your note here... Markdown is supported."
            disabled={!activeNote}
            aria-label="Note"
          />
        </div>
      </div>
    </div>
  );
}
