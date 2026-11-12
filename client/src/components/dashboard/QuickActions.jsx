import { useNavigate } from 'react-router-dom';
import Dialog from '@/components/ui/Dialog';
import {
  Timer,
  PlusCircle,
  CheckSquare,
  FileText,
  Code2,
  Sun,
  Moon,
} from 'lucide-react';

export default function QuickActionsModal({ isOpen, onClose, onSelectAction }) {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Start Focus Timer',
      description: 'Track real focused study time right now',
      icon: Timer,
      color: '#15803D',
      action: () => {
        onClose();
        navigate('/study?action=timer');
      },
    },
    {
      title: 'Log Study Session',
      description: 'Record completed study or video session',
      icon: PlusCircle,
      color: '#16A34A',
      action: () => {
        onClose();
        navigate('/study?action=log');
      },
    },
    {
      title: 'Create Task',
      description: 'Add a new priority task with due date',
      icon: CheckSquare,
      color: '#4F46E5',
      action: () => {
        onClose();
        navigate('/tasks?action=new');
      },
    },
    {
      title: 'New Note',
      description: 'Create rich-text or markdown study notes',
      icon: FileText,
      color: '#D97706',
      action: () => {
        onClose();
        navigate('/notes?action=new');
      },
    },
    {
      title: 'Record Problem Attempt',
      description: 'Save problem from LeetCode, Codeforces, etc.',
      icon: Code2,
      color: '#DC2626',
      action: () => {
        onClose();
        navigate('/problems?action=new');
      },
    },
    {
      title: 'Morning Check-In',
      description: 'Plan daily targets and set today priorities',
      icon: Sun,
      color: '#E6AD56',
      action: () => {
        onClose();
        navigate('/accountability?tab=morning');
      },
    },
    {
      title: 'Evening Review',
      description: 'Reflect on today progress and learnings',
      icon: Moon,
      color: '#A78BFA',
      action: () => {
        onClose();
        navigate('/accountability?tab=evening');
      },
    },
  ];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Quick Actions">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              onClick={act.action}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-border hover:border-emerald-300 hover:shadow-xs text-left transition-all duration-150 group active:scale-[0.98]"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105"
                style={{
                  backgroundColor: `${act.color}15`,
                  border: `1px solid ${act.color}30`,
                  color: act.color,
                }}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary group-hover:text-emerald-900 transition-colors">
                  {act.title}
                </p>
                <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                  {act.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
