import { BookOpen } from 'lucide-react';
import { subjectColor } from '@/lib/subjectColor';
export default function SubjectLabel({ name, color }) {
  return <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: subjectColor(color) }}><BookOpen size={14} aria-hidden="true" />{name}</span>;
}
