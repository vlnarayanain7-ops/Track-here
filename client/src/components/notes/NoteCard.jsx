import { Pin, Trash2, Folder, Calendar } from 'lucide-react';
import Card, { CardContent } from '@/components/ui/Card';
import { formatRelativeDate } from '@/lib/utils';

export default function NoteCard({ note, isSelected, onSelect, onTogglePin, onDelete }) {
  return (
    <Card
      onClick={() => onSelect(note)}
      className={`cursor-pointer transition-all duration-200 rounded-2xl overflow-hidden ${
        isSelected
          ? 'border-emerald-400 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-300'
          : 'bg-card border-border hover:border-emerald-200 hover:shadow-2xs'
      }`}
    >
      {/* Colored left accent when selected */}
      <CardContent className={`p-4 space-y-2.5 ${isSelected ? 'border-l-3 border-l-emerald-600' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {note.isPinned && (
              <Pin className="w-3 h-3 text-amber-600 shrink-0 -rotate-45" />
            )}
            <h3 className={`text-[13px] font-bold line-clamp-1 flex-1 tracking-tight ${isSelected ? 'text-emerald-950' : 'text-text-primary'}`}>
              {note.title || 'Untitled Note'}
            </h3>
          </div>

          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onTogglePin(note)}
              className={`p-1 rounded-md transition-colors ${
                note.isPinned
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface'
              }`}
              title={note.isPinned ? 'Unpin' : 'Pin note'}
            >
              <Pin className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(note._id)}
              className="p-1 text-text-muted hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Snippet preview */}
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
          {note.contentMarkdown || note.contentHtml?.replace(/<[^>]+>/g, '') || 'No content yet...'}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 truncate">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface text-text-secondary border border-border/80">
              {note.folder || 'General'}
            </span>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-text-muted">{formatRelativeDate(note.updatedAt || note.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
