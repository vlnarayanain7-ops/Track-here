import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Plus, ListTodo } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useUpdateTaskStatus } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

export default function TodayTasks({ tasks = [], onNewTask }) {
  const updateStatusMutation = useUpdateTaskStatus();

  const handleToggle = (task) => {
    const nextStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
    updateStatusMutation.mutate({ id: task._id, status: nextStatus });
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700">
            <ListTodo className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-text-primary">
            Priority Tasks &amp; Goals
          </h2>
          {tasks.length > 0 && (
            <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
              {tasks.length}
            </span>
          )}
        </div>
        <Link
          to="/tasks"
          className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold transition-colors"
        >
          <span>View all tasks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="py-8 flex flex-col items-center text-center gap-2">
            <p className="text-xs text-text-muted">No pending tasks for today. You&apos;re all caught up!</p>
            <Link
              to="/tasks?action=new"
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              + Add a new task
            </Link>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            return (
              <div
                key={task._id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-all duration-150',
                  isCompleted
                    ? 'bg-stone-50/70 border-stone-200/60 opacity-60'
                    : 'bg-white border-border hover:border-emerald-200 hover:shadow-2xs'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggle(task)}
                    className="shrink-0 text-text-muted hover:text-emerald-700 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-stone-400 hover:text-emerald-700" />
                    )}
                  </button>
                  <span
                    className={cn(
                      'text-xs truncate font-medium',
                      isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                    )}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {task.category && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                      {task.category}
                    </span>
                  )}
                  {task.priority && (
                    <Badge variant={getPriorityVariant(task.priority)} size="xs">
                      {task.priority}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
