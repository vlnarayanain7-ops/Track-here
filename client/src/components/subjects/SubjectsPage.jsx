import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Circle,
  ChevronDown,
  ChevronRight,
  Play,
  Layers,
  ArrowRight,
  FolderPlus,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dialog from '@/components/ui/Dialog';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import { SUBJECT_COLOR_KEYS, DEFAULT_STUDY_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  'Not started': { label: 'Not started', color: 'text-stone-700 bg-stone-100 border-stone-200', icon: Circle },
  'In progress': { label: 'In progress', color: 'text-amber-800 bg-amber-50 border-amber-200', icon: Clock },
  'Completed': { label: 'Completed', color: 'text-emerald-800 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  'Needs revision': { label: 'Needs revision', color: 'text-rose-800 bg-rose-50 border-rose-200', icon: RotateCcw },
};

export default function SubjectsPage() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  // Normalize subjects: ensure chapters are objects with { name, status, topics: [{ name, status }] }
  const rawSubjects = user?.subjects && Array.isArray(user.subjects) ? user.subjects : [];

  const normalizedSubjects = rawSubjects.map((sub) => {
    const chapters = (sub.chapters || []).map((chap) => {
      if (typeof chap === 'string') {
        return { name: chap, status: 'Not started', topics: [] };
      }
      return {
        name: chap.name || 'Untitled Chapter',
        status: chap.status || 'Not started',
        topics: (chap.topics || []).map((top) => {
          if (typeof top === 'string') return { name: top, status: 'Not started' };
          return { name: top.name || 'Untitled Topic', status: top.status || 'Not started' };
        }),
      };
    });
    return { ...sub, chapters };
  });

  const [subjects, setSubjects] = useState(normalizedSubjects);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('green');

  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  const [newTopicInput, setNewTopicInput] = useState({});

  const activeSubject = subjects[selectedSubjectIndex] || subjects[0];

  // Calculate genuine syllabus completion for the active subject
  let totalTopics = 0;
  let completedTopics = 0;
  if (activeSubject) {
    activeSubject.chapters.forEach((chap) => {
      if (chap.topics.length === 0) {
        totalTopics += 1;
        if (chap.status === 'Completed') completedTopics += 1;
      } else {
        chap.topics.forEach((top) => {
          totalTopics += 1;
          if (top.status === 'Completed') completedTopics += 1;
        });
      }
    });
  }
  const syllabusPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const saveSubjectsToDatabase = async (updatedSubjects) => {
    setIsSaving(true);
    try {
      await usersApi.updateProfile({ subjects: updatedSubjects });
      await checkAuth();
      toast.success('Syllabus progress updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save syllabus');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSub = {
      name: newSubjectName.trim(),
      color: newSubjectColor,
      icon: 'BookOpen',
      chapters: [],
    };
    const updated = [...subjects, newSub];
    setSubjects(updated);
    setSelectedSubjectIndex(updated.length - 1);
    setIsAddSubjectOpen(false);
    setNewSubjectName('');
    await saveSubjectsToDatabase(updated);
  };

  const handleDeleteSubject = async (idx) => {
    if (!window.confirm(`Delete subject "${subjects[idx].name}" and all its chapters?`)) return;
    const updated = subjects.filter((_, i) => i !== idx);
    setSubjects(updated);
    setSelectedSubjectIndex(Math.max(0, idx - 1));
    await saveSubjectsToDatabase(updated);
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterName.trim() || !activeSubject) return;

    const updated = [...subjects];
    updated[selectedSubjectIndex].chapters.push({
      name: newChapterName.trim(),
      status: 'Not started',
      topics: [],
    });
    setSubjects(updated);
    setIsAddChapterOpen(false);
    setNewChapterName('');
    await saveSubjectsToDatabase(updated);
  };

  const handleDeleteChapter = async (chapIndex) => {
    const updated = [...subjects];
    updated[selectedSubjectIndex].chapters.splice(chapIndex, 1);
    setSubjects(updated);
    await saveSubjectsToDatabase(updated);
  };

  const handleToggleChapterStatus = async (chapIndex) => {
    const statuses = ['Not started', 'In progress', 'Completed', 'Needs revision'];
    const updated = [...subjects];
    const current = updated[selectedSubjectIndex].chapters[chapIndex].status;
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    updated[selectedSubjectIndex].chapters[chapIndex].status = next;
    setSubjects(updated);
    await saveSubjectsToDatabase(updated);
  };

  const handleAddTopic = async (chapIndex) => {
    const topicName = (newTopicInput[chapIndex] || '').trim();
    if (!topicName) return;

    const updated = [...subjects];
    updated[selectedSubjectIndex].chapters[chapIndex].topics.push({
      name: topicName,
      status: 'Not started',
    });
    setSubjects(updated);
    setNewTopicInput((prev) => ({ ...prev, [chapIndex]: '' }));
    await saveSubjectsToDatabase(updated);
  };

  const handleToggleTopicStatus = async (chapIndex, topIndex) => {
    const statuses = ['Not started', 'In progress', 'Completed', 'Needs revision'];
    const updated = [...subjects];
    const current = updated[selectedSubjectIndex].chapters[chapIndex].topics[topIndex].status;
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    updated[selectedSubjectIndex].chapters[chapIndex].topics[topIndex].status = next;

    // Auto-update chapter status if all topics completed
    const allCompleted = updated[selectedSubjectIndex].chapters[chapIndex].topics.every((t) => t.status === 'Completed');
    if (allCompleted) {
      updated[selectedSubjectIndex].chapters[chapIndex].status = 'Completed';
    } else if (updated[selectedSubjectIndex].chapters[chapIndex].topics.some((t) => t.status === 'In progress' || t.status === 'Completed')) {
      updated[selectedSubjectIndex].chapters[chapIndex].status = 'In progress';
    }

    setSubjects(updated);
    await saveSubjectsToDatabase(updated);
  };

  const handleDeleteTopic = async (chapIndex, topIndex) => {
    const updated = [...subjects];
    updated[selectedSubjectIndex].chapters[chapIndex].topics.splice(topIndex, 1);
    setSubjects(updated);
    await saveSubjectsToDatabase(updated);
  };

  const toggleChapterExpand = (idx) => {
    setExpandedChapters((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center border border-accent/30 shrink-0">
            <Layers className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Subject &amp; Syllabus Manager
            </h1>
            <p className="text-[11px] text-text-muted mt-0.5">
              Organize chapters, track real syllabus completion status, and structure your preparation targets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddSubjectOpen(true)}
            icon={Plus}
            className="text-xs gap-1.5"
          >
            <span>Add Subject</span>
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Subjects Tab List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted px-1">
            <span className="font-semibold uppercase tracking-wider font-mono">My Subjects</span>
            <span>{subjects.length} Tracks</span>
          </div>

          {subjects.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border text-center bg-white">
              <p className="text-xs text-text-muted mb-3">No subjects created yet.</p>
              <Button
                size="sm"
                onClick={() => setIsAddSubjectOpen(true)}
                icon={Plus}
                className="text-xs mx-auto"
              >
                + Add Subject
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {subjects.map((sub, idx) => {
                const isSelected = selectedSubjectIndex === idx;
                const chapCount = sub.chapters?.length || 0;
                return (
                  <div
                    key={sub.name || idx}
                    onClick={() => setSelectedSubjectIndex(idx)}
                    className={cn(
                      'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group',
                      isSelected
                        ? 'bg-card border-border shadow-card ring-1 ring-accent/30'
                        : 'bg-card/50 border-border/70 hover:bg-surface/50 hover:border-border-light'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${sub.color}20`,
                          border: `1px solid ${sub.color}40`,
                          color: sub.color,
                        }}
                      >
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {sub.name}
                        </h3>
                        <p className="text-[11px] text-text-muted">
                          {chapCount} chapter{chapCount === 1 ? '' : 's'} defined
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-danger rounded text-text-muted transition-opacity"
                        title="Delete subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Syllabus Detail & Chapters Tree */}
        <div className="lg:col-span-8 space-y-4">
          {activeSubject ? (
            <Card className="bg-card border-border overflow-hidden">
              {/* Subject Cover Header Strip */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: activeSubject.color }}
              />

              <CardHeader className="p-5 pb-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: activeSubject.color }}
                    />
                    <CardTitle className="text-lg font-bold text-text-primary">
                      {activeSubject.name}
                    </CardTitle>
                    <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                      {activeSubject.chapters.length} Chapters
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">
                    Syllabus Completion:{' '}
                    <strong className="text-text-primary font-mono">{syllabusPct}%</strong>{' '}
                    ({completedTopics} of {totalTopics} items completed)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddChapterOpen(true)}
                    icon={FolderPlus}
                    className="text-xs h-8 gap-1"
                  >
                    <span>Add Chapter</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/study?category=${encodeURIComponent(activeSubject.name)}`)}
                    icon={Play}
                    className="text-xs h-8 gap-1"
                  >
                    <span>Start Study</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Chapters & Topics List */}
                {activeSubject.chapters.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Layers className="w-10 h-10 text-text-muted mx-auto opacity-40" />
                    <p className="text-xs text-text-muted max-w-sm mx-auto">
                      No chapters defined for this subject yet. Add your chapters and topics to track your genuine syllabus coverage.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddChapterOpen(true)}
                      icon={Plus}
                      className="text-xs"
                    >
                      Create First Chapter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeSubject.chapters.map((chap, cIdx) => {
                      const isExpanded = expandedChapters[cIdx] !== false; // expanded by default
                      const chapStatusCfg = STATUS_CONFIG[chap.status] || STATUS_CONFIG['Not started'];
                      const ChapIcon = chapStatusCfg.icon;

                      return (
                        <div
                          key={cIdx}
                          className="rounded-lg border border-border bg-surface/30 overflow-hidden transition-colors"
                        >
                          {/* Chapter Bar */}
                          <div className="p-3.5 flex items-center justify-between gap-3 bg-surface/50 border-b border-border/50">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                onClick={() => toggleChapterExpand(cIdx)}
                                className="p-1 hover:text-text-primary text-text-muted transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <span className="text-xs font-mono text-text-muted shrink-0">
                                Ch.{cIdx + 1}
                              </span>
                              <span className="text-xs font-semibold text-text-primary truncate">
                                {chap.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Status Toggle Button */}
                              <button
                                onClick={() => handleToggleChapterStatus(cIdx)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors',
                                  chapStatusCfg.color
                                )}
                                title="Click to cycle status"
                              >
                                <ChapIcon className="w-3 h-3" />
                                <span>{chapStatusCfg.label}</span>
                              </button>

                              {/* Start study for this chapter */}
                              <button
                                onClick={() =>
                                  navigate(
                                    `/study?category=${encodeURIComponent(
                                      activeSubject.name
                                    )}&action=log`
                                  )
                                }
                                className="p-1 text-text-muted hover:text-accent rounded transition-colors"
                                title="Study this chapter"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteChapter(cIdx)}
                                className="p-1 text-text-muted hover:text-danger rounded transition-colors"
                                title="Delete chapter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Nested Topics List */}
                          {isExpanded && (
                            <div className="p-3 space-y-2 bg-background/50">
                              {chap.topics.length > 0 ? (
                                <div className="space-y-1.5 pl-6">
                                  {chap.topics.map((top, tIdx) => {
                                    const topStatusCfg = STATUS_CONFIG[top.status] || STATUS_CONFIG['Not started'];
                                    const TopIcon = topStatusCfg.icon;

                                    return (
                                      <div
                                        key={tIdx}
                                        className="flex items-center justify-between p-2 rounded-md bg-card/70 border border-border/70 hover:border-border-light transition-colors text-xs"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                                          <span className="text-text-primary truncate">
                                            {top.name}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            onClick={() => handleToggleTopicStatus(cIdx, tIdx)}
                                            className={cn(
                                              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-colors',
                                              topStatusCfg.color
                                            )}
                                            title="Click to cycle status"
                                          >
                                            <TopIcon className="w-2.5 h-2.5" />
                                            <span>{topStatusCfg.label}</span>
                                          </button>

                                          <button
                                            onClick={() => handleDeleteTopic(cIdx, tIdx)}
                                            className="p-1 text-text-muted hover:text-danger rounded transition-colors"
                                            title="Delete topic"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[11px] text-text-muted italic pl-6 py-1">
                                  No subtopics added yet. Add key topics below.
                                </p>
                              )}

                              {/* Add Topic Input */}
                              <div className="pl-6 pt-1 flex items-center gap-2">
                                <Input
                                  placeholder="Add subtopic / concept..."
                                  value={newTopicInput[cIdx] || ''}
                                  onChange={(e) =>
                                    setNewTopicInput((prev) => ({
                                      ...prev,
                                      [cIdx]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) =>
                                    e.key === 'Enter' && (e.preventDefault(), handleAddTopic(cIdx))
                                  }
                                  className="text-xs h-7 flex-1"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddTopic(cIdx)}
                                  className="h-7 text-xs px-2.5"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 rounded-2xl border border-border text-center bg-white">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 mx-auto mb-3 shadow-2xs">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1">No Subjects Yet</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
                Add your study subjects (e.g. Physics, Chemistry, DSA, History) to track syllabus chapters and topics.
              </p>
              <Button
                size="sm"
                onClick={() => setIsAddSubjectOpen(true)}
                icon={Plus}
                className="text-xs"
              >
                + Add First Subject
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      <Dialog
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        title="Add New Subject or Learning Track"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4 pt-2">
          <Input
            label="Subject Name"
            placeholder="e.g. Zoology, Organic Chemistry, Operating Systems"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
              Subject Color Theme
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {SUBJECT_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewSubjectColor(key)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-transform border border-black/10',
                    newSubjectColor === key && 'scale-125 ring-2 ring-[var(--ring)] ring-offset-2'
                  )}
                  style={{ backgroundColor: `var(--c-${key})` }}
                  title={key}
                  aria-label={key}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddSubjectOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Subject</Button>
          </div>
        </form>
      </Dialog>

      {/* Add Chapter Modal */}
      <Dialog
        isOpen={isAddChapterOpen}
        onClose={() => setIsAddChapterOpen(false)}
        title={`Add Chapter to ${activeSubject?.name || 'Subject'}`}
      >
        <form onSubmit={handleAddChapter} className="space-y-4 pt-2">
          <Input
            label="Chapter Name"
            placeholder="e.g. Plant Physiology, Electrostatics, Trees and Graphs"
            value={newChapterName}
            onChange={(e) => setNewChapterName(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddChapterOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Chapter</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

