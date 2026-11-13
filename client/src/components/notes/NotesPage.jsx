import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes';
import { Plus, Pin, Trash2, ArrowLeft, Check } from 'lucide-react';
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
  const [isSaved, setIsSaved] = useState(true);
  const saveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: notesData, refetch } = useNotes({
    folder: selectedSubject || undefined,
  });

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

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
      setTitle(activeNote.title || '');
      setBody(activeNote.contentMarkdown || activeNote.contentHtml || '');
      setIsSaved(true);
    } else {
      setTitle('');
      setBody('');
    }
  }, [activeNote?._id]);

  // Autosave with 800ms debounce
  const triggerAutosave = (newTitle, newBody) => {
    setIsSaved(false);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (activeNote?._id) {
          await updateNoteMutation.mutateAsync({
            id: activeNote._id,
            data: {
              title: newTitle || 'Untitled note',
              contentMarkdown: newBody,
              contentHtml: newBody,
            },
          });
        } else if (newTitle?.trim() || newBody?.trim()) {
          const res = await createNoteMutation.mutateAsync({
            title: newTitle.trim() || 'Untitled note',
            folder: selectedSubject || userSubjects[0] || 'General',
            contentMarkdown: newBody,
            contentHtml: newBody,
          });
          const created = res?.data?.note || res?.note || res;
          if (created?._id) {
            setActiveNoteId(created._id);
          }
          refetch();
        }
        setIsSaved(true);
      } catch (err) {
        toast.error('Failed to save note');
      }
    }, 800);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutosave(val, body);
  };

  const handleBodyChange = (e) => {
    const val = e.target.value;
    setBody(val);
    triggerAutosave(title, val);
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
    try {
      const res = await createNoteMutation.mutateAsync({
        title: 'Untitled note',
        folder: selectedSubject || userSubjects[0] || 'General',
        contentMarkdown: '',
        contentHtml: '',
      });
      const created = res?.data?.note || res?.note || res;
      if (created?._id) {
        setActiveNoteId(created._id);
        setMobileEditing(true);
      }
      refetch();
    } catch (err) {
      toast.error('Failed to create note');
    }
  };

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
        data: { pinned: !activeNote.pinned },
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
    <div className="max-w-[880px] mx-auto px-4 sm:px-8 py-6">
      {/* Page Header */}
      <div className="sec mt-0 mb-4">
        <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--tx)]">Notes</h1>
        <button
          type="button"
          onClick={() => {
            setActiveNoteId(null);
            setTitle('');
            setBody('');
            setMobileEditing(true);
          }}
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
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--ln)] bg-[var(--sf)] text-[var(--tx)] focus:outline-none"
          >
            <option value="">All subjects</option>
            {userSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="note py-6 text-center text-xs">No notes yet</p>
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
                      {note.pinned && <Pin className="w-3 h-3 text-[var(--pr)] fill-current shrink-0" />}
                      <span className="truncate">{note.title || 'Untitled note'}</span>
                    </b>
                    <span>{formatRelativeDate(note.updatedAt || note.createdAt)}</span>
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
              {isSaved ? 'Saved' : 'Saving...'}
            </span>
          </div>

          {/* Top controls: Pin, Delete, Saved Indicator */}
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Note title"
              aria-label="Title"
              className="tt"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span data-testid="desktop-saved-indicator" className="text-xs text-[var(--mu)] hidden min-[761px]:inline">
                {isSaved ? 'Saved' : 'Saving...'}
              </span>
              {activeNote && (
                <>
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    className={`p-1.5 rounded-lg border border-[var(--ln)] transition-colors ${
                      activeNote.pinned ? 'bg-[var(--soft)] text-[var(--pr)]' : 'text-[var(--mu)] hover:text-[var(--tx)]'
                    }`}
                    aria-label={activeNote.pinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${activeNote.pinned ? 'fill-current' : ''}`} />
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
            aria-label="Note"
          />
        </div>
      </div>
    </div>
  );
}
