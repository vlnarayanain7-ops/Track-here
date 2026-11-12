import { useState } from 'react';
import DOMPurify from 'dompurify';
import Textarea from '@/components/ui/Textarea';
import { Columns, Eye, Edit3 } from 'lucide-react';

export default function MarkdownEditor({ content = '', onChange }) {
  const [viewMode, setViewMode] = useState('split'); // split, edit, preview

  // Basic markdown parser for preview
  const renderMarkdown = (md) => {
    if (!md) return '<p class="text-text-muted italic text-sm">Nothing to preview</p>';

    let html = md
      // Escape HTML tags
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-text-primary mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-text-primary mt-5 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-text-primary mt-6 mb-3 border-b border-border/40 pb-1">$1</h1>')
      // Code blocks (triple backtick)
      .replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre class="bg-surface/60 border border-border/50 p-3 rounded-xl font-mono text-xs overflow-x-auto my-3 text-emerald-400"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-surface/60 px-1.5 py-0.5 rounded-md font-mono text-xs text-accent border border-border/30">$1</code>')
      // Bold & Italic
      .replace(/\*\*([^*]+)\*\*/gim, '<strong class="font-bold text-text-primary">$1</strong>')
      .replace(/\*([^*]+)\*/gim, '<em class="italic text-text-primary">$1</em>')
      // Blockquotes
      .replace(/^\\> (.*$)/gim, '<blockquote class="border-l-2 border-accent/60 pl-3 my-2 text-text-secondary italic">$1</blockquote>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-sm text-text-primary">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-sm text-text-primary">$1</li>')
      // Checkboxes
      .replace(/\[ \]/gim, '<input type="checkbox" disabled class="mr-2 rounded accent-accent" />')
      .replace(/\[x\]/gim, '<input type="checkbox" checked disabled class="mr-2 rounded accent-accent" />')
      // Only permit safe absolute HTTP(S) links; the markdown text was already HTML-escaped.
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">$1</a>')
      // Line breaks
      .replace(/\n\n/gim, '<br/><br/>');

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'h1', 'h2', 'h3', 'strong', 'em', 'blockquote',
        'pre', 'code', 'ul', 'ol', 'li', 'input', 'a', 'br',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'type', 'checked', 'disabled'],
    });
  };

  const ModeButton = ({ mode: m, icon: Icon, label }) => (
    <button
      type="button"
      onClick={() => setViewMode(m)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${
        viewMode === m
          ? 'bg-accent/10 text-accent border border-accent/20 shadow-xs'
          : 'text-text-muted hover:text-text-primary'
      }`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="border border-border/60 rounded-xl bg-card overflow-hidden flex flex-col">
      {/* Mode toggle bar */}
      <div className="flex items-center justify-between p-2 bg-surface/30 border-b border-border/50 text-xs">
        <span className="font-mono text-text-muted text-[10px] px-2 uppercase tracking-widest font-bold">Markdown</span>
        <div className="flex bg-card rounded-lg p-0.5 border border-border/50">
          <ModeButton mode="edit" icon={Edit3} label="Write" />
          <ModeButton mode="split" icon={Columns} label="Split" />
          <ModeButton mode="preview" icon={Eye} label="Preview" />
        </div>
      </div>

      {/* Editor Body */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/40 min-h-[350px]">
        {/* Write Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`p-4 flex flex-col ${viewMode === 'edit' ? 'sm:col-span-2' : ''}`}>
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type markdown syntax here (e.g., # Topic, ```cpp ...```)..."
              className="w-full flex-1 bg-transparent text-text-primary font-mono text-xs resize-none focus:outline-none min-h-[300px] leading-relaxed placeholder:text-text-muted/40"
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`p-4 bg-surface/10 overflow-y-auto ${viewMode === 'preview' ? 'sm:col-span-2' : ''}`}>
            <div
              className="prose prose-invert max-w-none text-sm text-text-primary"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
