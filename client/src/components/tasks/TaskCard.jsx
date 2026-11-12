import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Tag,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { useUpdateTaskStatus } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

export default function TaskCard({ task, onEdit, onDelete, viewMode = 'table' }) {
  const updateStatusMutation = useUpdateTaskStatus();

  const handleToggle = () => {
    let nextStatus = 'Completed';
    if (task.status === 'Completed') {
      nextStatus = 'Todo';
    } else if (task.status === 'Todo') {
      nextStatus = 'In Progress';
    } else if (task.status === 'In Progress') {
      nextStatus = 'Completed';
    }
    updateStatusMutation.mutate({ id: task._id, status: nextStatus });
  };

  const isCompleted = task.status === 'Completed';

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Done</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  // Notion Table Row style
  if (viewMode === 'table') {
    return (
      <div className={cn(
        'group flex items-center justify-between py-2.5 px-3 border-b border-border/80 transition-colors text-xs hover:bg-stone-50/80',
        isCompleted && 'bg-stone-50/40 opacity-70'
      )}>
        {/* Checkbox + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
          <button
            onClick={handleToggle}
            className="text-stone-400 hover:text-emerald-700 transition-colors shrink-0"
            title="Toggle Status"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
            ) : task.status === 'In Progress' ? (
              <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            ) : (
              <Circle className="w-4.5 h-4.5 text-stone-400 hover:text-emerald-700" />
            )}
          </button>

          <span className={cn(
            'font-medium text-text-primary truncate',
            isCompleted && 'line-through text-text-muted'
          )}>
            {task.title}
          </span>
        </div>

        {/* Status Pill */}
        <div className="w-32 shrink-0 hidden sm:block">
          <button onClick={handleToggle} className="text-left">
            {getStatusBadge(task.status)}
          </button>
        </div>

        {/* Priority */}
        <div className="w-24 shrink-0 hidden md:block">
          {getPriorityBadge(task.priority)}
        </div>

        {/* Category */}
        <div className="w-32 shrink-0 hidden lg:block">
          {task.category && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
              {task.category}
            </span>
          )}
        </div>

        {/* Due Date */}
        <div className="w-28 shrink-0 text-[11px] text-text-muted font-mono hidden sm:block">
          {task.dueDate ? formatRelativeDate(task.dueDate) : '—'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-stone-200/60 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Card view for board/mobile
  return (
    <div className="p-4 rounded-2xl border border-border bg-card hover:border-emerald-200 hover:shadow-xs transition-all space-y-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <button onClick={handleToggle} className="mt-0.5 shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
            ) : (
              <Circle className="w-4.5 h-4.5 text-stone-400" />
            )}
          </button>
          <h3 className={cn('text-xs font-bold leading-snug', isCompleted ? 'line-through text-text-muted' : 'text-text-primary')}>
            {task.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(task)} className="p-1 hover:text-text-primary">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(task._id)} className="p-1 hover:text-rose-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {getStatusBadge(task.status)}
        {getPriorityBadge(task.priority)}
        {task.category && (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-700 border border-stone-200">
            {task.category}
          </span>
        )}
      </div>
    </div>
  );
}
