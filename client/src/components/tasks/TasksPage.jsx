import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_STUDY_CATEGORIES } from '@/lib/constants';
import { useTasks, useDeleteTask } from '@/hooks/useTasks';
import {
  Plus,
  CheckSquare,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronRight,
  Folder,
  Layers,
  Table,
  Kanban,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function TasksPage() {
  const { user } = useAuth();
  const userSubjects =
    user?.subjects && Array.isArray(user.subjects)
      ? user.subjects.map((s) => s.name)
      : [];

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('byProject'); // 'byProject', 'allTasks'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Check URL query parameters for action or tab (redirect timetable tab to dedicated /timetable route)
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsFormOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
    if (searchParams.get('tab') === 'timetable') {
      navigate('/timetable', { replace: true });
    }
  }, [searchParams, setSearchParams, navigate]);

  const { data, isLoading } = useTasks({
    priority: priorityFilter || undefined,
  });

  const deleteTaskMutation = useDeleteTask();
  const allTasks = data?.data?.tasks || data?.tasks || [];

  // Filter tasks based on search, status
  const filteredTasks = allTasks.filter((task) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (statusFilter && task.status !== statusFilter) {
      return false;
    }
    if (priorityFilter && task.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  // Group tasks by category / subject (Notion-style grouping)
  const groupedTasks = {};
  filteredTasks.forEach((task) => {
    const group = task.category || 'General';
    if (!groupedTasks[group]) groupedTasks[group] = [];
    groupedTasks[group].push(task);
  });

  const groupKeys = Object.keys(groupedTasks);

  const toggleGroup = (group) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      await deleteTaskMutation.mutateAsync(taskToDelete);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800">
            <CheckSquare className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Tasks &amp; Milestones</h1>
            <p className="text-xs text-text-muted">Structured project and chapter preparation tracker</p>
          </div>
        </div>

        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Notion-style Views + Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border/80">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('byProject')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'byProject'
                ? 'bg-white text-emerald-900 border border-border shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>By Subject</span>
          </button>

          <button
            onClick={() => setViewMode('allTasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'allTasks'
                ? 'bg-white text-emerald-900 border border-border shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>All Tasks</span>
            <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded-full ml-1">
              {filteredTasks.length}
            </span>
          </button>
        </div>

        {/* Right: Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-border bg-white text-xs font-medium text-text-secondary focus:outline-none focus:border-emerald-600"
            >
              <option value="">Status: All</option>
              <option value="Todo">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Done</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-border bg-white text-xs font-medium text-text-secondary focus:outline-none focus:border-emerald-600"
            >
              <option value="">Priority: All</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Search input */}
            <div className="relative">
              <Search className="w-3 h-3 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tasks..."
                className="h-8 pl-7 pr-3 rounded-xl border border-border bg-white text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-600 w-36 sm:w-44"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Table Column Headers */}
        <div className="hidden sm:flex items-center justify-between py-2.5 px-4 bg-stone-50/70 border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider font-mono">
          <div className="flex-1 mr-4">Task Name</div>
          <div className="w-32">Status</div>
          <div className="w-24 hidden md:block">Priority</div>
          <div className="w-32 hidden lg:block">Subject</div>
          <div className="w-28">Due Date</div>
          <div className="w-12 text-right">Actions</div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            <p>No tasks match the selected view or filters.</p>
            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsFormOpen(true);
              }}
              className="mt-2 text-emerald-700 font-semibold hover:underline inline-block"
            >
              + Create a new task
            </button>
          </div>
        ) : viewMode === 'byProject' ? (
          /* Grouped by Subject / Project */
          <div className="divide-y divide-border/60">
            {groupKeys.map((group) => {
              const groupList = groupedTasks[group] || [];
              const completedCount = groupList.filter((t) => t.status === 'Completed').length;
              const isCollapsed = !!collapsedGroups[group];

              return (
                <div key={group}>
                  {/* Group Header */}
                  <div
                    onClick={() => toggleGroup(group)}
                    className="flex items-center justify-between px-4 py-2.5 bg-stone-50/50 hover:bg-stone-100/60 cursor-pointer select-none transition-colors border-b border-border/40"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                      )}
                      <span className="text-xs font-bold text-text-primary">{group}</span>
                      <span className="text-[11px] font-mono text-text-muted">
                        ({groupList.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-text-muted font-medium">
                        COMPLETE {completedCount}/{groupList.length}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToEdit({ category: group });
                          setIsFormOpen(true);
                        }}
                        className="text-text-muted hover:text-emerald-700 p-0.5 rounded"
                        title="Add task in this subject"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tasks rows */}
                  {!isCollapsed && (
                    <div className="divide-y divide-border/50">
                      {groupList.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onEdit={(t) => {
                            setTaskToEdit(t);
                            setIsFormOpen(true);
                          }}
                          onDelete={(id) => setTaskToDelete(id)}
                          viewMode="table"
                        />
                      ))}
                      {/* "+ New" row at bottom */}
                      <button
                        onClick={() => {
                          setTaskToEdit({ category: group });
                          setIsFormOpen(true);
                        }}
                        className="w-full text-left py-2 px-4 text-xs text-text-muted hover:text-emerald-800 hover:bg-stone-50 flex items-center gap-2 font-medium transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat All Tasks Table */
          <div className="divide-y divide-border/50">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={(t) => {
                  setTaskToEdit(t);
                  setIsFormOpen(true);
                }}
                onDelete={(id) => setTaskToDelete(id)}
                viewMode="table"
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Form Dialog */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        description="Are you sure you want to permanently delete this task?"
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
