import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FolderSidebar from './FolderSidebar';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useFolders } from '@/hooks/useNotes';
import { Plus, Search, FileText, X, PenLine } from 'lucide-react';

export default function NotesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const { data: notesData, isLoading } = useNotes({
    folder: selectedFolder || undefined,
    pinned: showPinnedOnly ? 'true' : undefined,
    search: search || undefined,
  });

  const { data: foldersData } = useFolders();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  const notes = notesData?.data?.notes || notesData?.notes || [];
  const folders = foldersData?.data?.folders || foldersData?.folders || ['General', 'C++', 'DSA', 'Competitive Programming'];

  // Select note from URL ?id=... or auto-select first note
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && notes.length > 0) {
      const match = notes.find((n) => n._id === idParam);
      if (match) {
        setSelectedNote(match);
        return;
      }
    }
    if (!selectedNote && notes.length > 0) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote, searchParams]);

  // Handle URL query parameter ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleCreateNote();
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const handleCreateNote = async (folderName = null) => {
    const targetFolder = folderName || selectedFolder || 'General';
    const newNote = await createNoteMutation.mutateAsync({
      title: 'Untitled Note',
      folder: targetFolder,
      contentHtml: '',
      contentMarkdown: '',
      tags: [],
    });
    const created = newNote?.data?.note || newNote?.note || newNote;
    setSelectedNote(created);
  };

  const handleTogglePin = async (note) => {
    await updateNoteMutation.mutateAsync({
      id: note._id,
      data: { isPinned: !note.isPinned },
    });
  };

  const handleConfirmDelete = async () => {
    if (noteToDelete) {
      await deleteNoteMutation.mutateAsync(noteToDelete);
      if (selectedNote?._id === noteToDelete) {
        setSelectedNote(null);
      }
      setNoteToDelete(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Notes Workspace</h1>
            <p className="text-xs text-text-muted mt-0.5">
              Notion-style rich text &amp; Markdown notes with syntax highlighting and autosave
            </p>
          </div>
        </div>

        <Button onClick={handleCreateNote} icon={Plus} size="sm" className="text-xs rounded-xl shadow-xs">
          New Note
        </Button>
      </div>

      {/* Main 3-column / 2-column layout */}
      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-210px)] min-h-[500px]">
        {/* Left: Folders Sidebar */}
        <FolderSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          showPinnedOnly={showPinnedOnly}
          onTogglePinnedOnly={() => setShowPinnedOnly((p) => !p)}
          onAddFolder={(name) => {
            setSelectedFolder(name);
            handleCreateNote(name);
          }}
        />

        {/* Middle: Notes List */}
        <div className={`w-full md:w-72 lg:w-80 shrink-0 flex flex-col space-y-3 bg-card border border-border rounded-2xl p-3.5 shadow-xs ${selectedNote ? 'hidden md:flex' : 'flex'}`}>
          <div className="relative">
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-8 h-8"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {notes.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                <p className="text-xs text-text-muted">No notes found.</p>
              </div>
            ) : (
              notes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  isSelected={selectedNote?._id === note._id}
                  onSelect={setSelectedNote}
                  onTogglePin={handleTogglePin}
                  onDelete={(id) => setNoteToDelete(id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Active Note Editor */}
        <div className={`flex-1 min-w-0 bg-card border border-border rounded-2xl p-5 shadow-xs overflow-hidden ${!selectedNote ? 'hidden md:block' : 'block'}`}>
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              folders={folders}
              onDelete={(id) => setNoteToDelete(id)}
              onBack={() => setSelectedNote(null)}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No note selected"
              description="Choose a note from the list or create a new one to begin editing."
              actionLabel="Create Note"
              onAction={handleCreateNote}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete Note"
        variant="destructive"
        loading={deleteNoteMutation.isPending}
      />
    </div>
  );
}
