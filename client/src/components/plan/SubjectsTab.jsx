import { subjectColor } from '@/lib/subjectColor';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as usersApi from '@/api/users';
import { plural } from '@/lib/plural';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SUBJECT_COLORS = ['--c-blue', '--c-green', '--c-amber', '--c-rose', '--c-violet', '--c-cyan', '--c-orange', '--c-slate'];

export default function SubjectsTab() {
  const { user, checkAuth } = useAuth();

  const [expandedSubject, setExpandedSubject] = useState(null);
  const [newSubjName, setNewSubjName] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubjectName, setEditingSubjectName] = useState(null);
  const [editSubjNameInput, setEditSubjNameInput] = useState('');
  const [colorPickerSubject, setColorPickerSubject] = useState(null);
  const [newChapterName, setNewChapterName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const rawSubjects = useMemo(() => {
    if (!user?.subjects || !Array.isArray(user.subjects)) return [];
    return user.subjects;
  }, [user]);

  const saveSubjectsToDatabase = async (updated) => {
    setIsSaving(true);
    try {
      await usersApi.updateProfile({ subjects: updated });
      await checkAuth();
      toast.success('Subjects updated');
    } catch (err) {
      toast.error('Failed to save subjects');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameSubject = async (oldName) => {
    const trimmed = editSubjNameInput.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingSubjectName(null);
      return;
    }
    if (trimmed.toLowerCase() !== oldName.toLowerCase()) {
      if (rawSubjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
        toast.error('A subject with this name already exists');
        return;
      }
    }
    setIsSaving(true);
    try {
      await usersApi.renameSubject({ oldName, newName: trimmed });
      await checkAuth();
      toast.success(`Subject renamed to "${trimmed}"`);
      setEditingSubjectName(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename subject');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;

    const name = newSubjName.trim();
    if (rawSubjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Subject already exists');
      return;
    }

    const randomColor = SUBJECT_COLORS[rawSubjects.length % SUBJECT_COLORS.length];
    const newSubj = {
      name,
      color: `var(${randomColor})`,
      chapters: [],
    };

    const updated = [...rawSubjects, newSubj];
    await saveSubjectsToDatabase(updated);
    setNewSubjName('');
    setShowAddSubject(false);
  };

  const handleDeleteSubject = async (subName, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete subject "${subName}" and all its chapters?`)) {
      const updated = rawSubjects.filter((s) => s.name !== subName);
      await saveSubjectsToDatabase(updated);
    }
  };

  const handleRecolorSubject = async (subName, newColor, e) => {
    if (e) e.stopPropagation();
    const updated = rawSubjects.map((s) =>
      s.name === subName ? { ...s, color: newColor } : s
    );
    await saveSubjectsToDatabase(updated);
    setColorPickerSubject(null);
  };

  const handleAddChapter = async (subName) => {
    if (!newChapterName.trim()) return;
    const updated = rawSubjects.map((s) => {
      if (s.name !== subName) return s;
      const chapters = s.chapters || [];
      return {
        ...s,
        chapters: [
          ...chapters,
          { name: newChapterName.trim(), status: 'Not started' },
        ],
      };
    });
    await saveSubjectsToDatabase(updated);
    setNewChapterName('');
  };

  const handleToggleChapter = async (subName, chapterIdx) => {
    const updated = rawSubjects.map((s) => {
      if (s.name !== subName) return s;
      const chapters = [...(s.chapters || [])];
      const cur = chapters[chapterIdx];
      const nextStatus = cur?.status === 'Completed' ? 'Not started' : 'Completed';
      chapters[chapterIdx] = {
        ...(typeof cur === 'string' ? { name: cur } : cur),
        status: nextStatus,
      };
      return { ...s, chapters };
    });
    await saveSubjectsToDatabase(updated);
  };

  const handleDeleteChapter = async (subName, chapterIdx, e) => {
    e.stopPropagation();
    const updated = rawSubjects.map((s) => {
      if (s.name !== subName) return s;
      const chapters = (s.chapters || []).filter((_, i) => i !== chapterIdx);
      return { ...s, chapters };
    });
    await saveSubjectsToDatabase(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header matching reference */}
      <div className="sec mt-0 mb-4">
        <span className="note">Subjects you create appear everywhere else.</span>
        <button
          type="button"
          data-tour="add-subject" onClick={() => setShowAddSubject(!showAddSubject)}
          className="btn g text-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add subject
        </button>
      </div>

      {/* Add subject inline form */}
      {showAddSubject && (
        <form onSubmit={handleAddSubject} className="flex gap-2 p-3 bg-[var(--sf)] rounded-xl border border-[var(--ln)]">
          <input
            type="text"
            value={newSubjName}
            onChange={(e) => setNewSubjName(e.target.value)}
            placeholder="Subject name (e.g. Algorithms)"
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)] focus:outline-none"
            autoFocus
          />
          <button type="submit" disabled={isSaving} className="btn p text-xs">
            Save
          </button>
          <button
            type="button"
            data-tour="cancel-subject" onClick={() => setShowAddSubject(false)}
            className="btn g text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {rawSubjects.length === 0 ? (
        <p className="note py-6 text-sm">No subjects yet · Click &quot;Add subject&quot; to create your first syllabus.</p>
      ) : (
        <div className="divide-y divide-[var(--ln)] border-b border-[var(--ln)]">
          {rawSubjects.map((s) => {
            const chapters = s.chapters || [];
            const completedCount = chapters.filter(
              (c) => (typeof c === 'object' ? c.status : 'Not started') === 'Completed'
            ).length;
            const pct = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;
            const isExpanded = expandedSubject === s.name;
            const colorDot = subjectColor(s.color);

            return (
              <div key={s.name} className="py-3">
                {/* Subject Summary Row */}
                {editingSubjectName === s.name ? (
                  <div className="flex items-center gap-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editSubjNameInput}
                      onChange={(e) => setEditSubjNameInput(e.target.value)}
                      onBlur={() => handleRenameSubject(s.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubject(s.name);
                        if (e.key === 'Escape') setEditingSubjectName(null);
                      }}
                      autoFocus
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--pr)] bg-[var(--sf)] text-[var(--tx)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleRenameSubject(s.name);
                      }}
                      className="btn p text-xs px-3"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setEditingSubjectName(null);
                      }}
                      className="btn g text-xs px-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedSubject(isExpanded ? null : s.name)}
                          className="text-[var(--mu)] hover:text-[var(--tx)] p-0.5 cursor-pointer bg-transparent border-0"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--mu)]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--mu)]" />
                          )}
                        </button>

                        {/* Color dot button that opens 8 color choices */}
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setColorPickerSubject(colorPickerSubject === s.name ? null : s.name);
                            }}
                            className="w-3 h-3 rounded-full border border-black/10 inline-block cursor-pointer hover:scale-125 transition-transform align-middle"
                            style={{ background: colorDot.startsWith('--') ? `var(${colorDot})` : colorDot }}
                            title="Change color"
                            aria-label={`Change color for ${s.name}`}
                          />
                          {colorPickerSubject === s.name && (
                            <div
                              className="absolute left-0 top-5 z-30 p-2 bg-[var(--sf)] border border-[var(--ln)] rounded-xl shadow-lg flex gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {SUBJECT_COLORS.map((colKey) => (
                                <button
                                  key={colKey}
                                  type="button"
                                  onClick={(e) => handleRecolorSubject(s.name, `var(${colKey})`, e)}
                                  className="w-4 h-4 rounded-full border border-black/10 hover:scale-125 transition-transform cursor-pointer"
                                  style={{ background: `var(${colKey})` }}
                                  aria-label={`Select color ${colKey}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Subject name */}
                        <span
                          className="text-sm font-medium text-[var(--tx)] cursor-pointer"
                          onClick={() => setExpandedSubject(isExpanded ? null : s.name)}
                        >
                          {s.name}
                        </span>

                        {/* Inline Rename pencil button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubjectName(s.name);
                            setEditSubjNameInput(s.name);
                          }}
                          className="btn g h-6 px-1.5 text-[var(--mu)] hover:text-[var(--tx)] cursor-pointer"
                          aria-label={`Rename ${s.name}`}
                          title={`Rename ${s.name}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="note">
                          {chapters.length === 0
                            ? 'No chapters'
                            : `${completedCount} of ${plural(chapters.length, 'chapter')}`}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSubject(s.name, e)}
                          className="text-[var(--mu)] hover:text-red-500 p-1 transition-colors cursor-pointer bg-transparent border-0"
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Meter */}
                    <div className="meter">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {/* Expanded Chapters View */}
                {isExpanded && (
                  <div className="pl-6 pt-3 mt-2 border-l-2 border-[var(--ln)] space-y-2 animate-fade-in">
                    {/* Chapters List */}
                    {chapters.map((chap, idx) => {
                      const chapName = typeof chap === 'string' ? chap : chap.name;
                      const isDone = (typeof chap === 'object' ? chap.status : '') === 'Completed';

                      return (
                        <div key={idx} className="flex items-center justify-between py-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleToggleChapter(s.name, idx)}
                              className="rounded border-[var(--ln)] text-[var(--pr)] focus:ring-[var(--pr)]"
                            />
                            <span className={isDone ? 'dn' : 'text-[var(--tx)]'}>{chapName}</span>
                          </label>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteChapter(s.name, idx, e)}
                            className="text-[var(--mu)] hover:text-red-500 text-xs p-1 cursor-pointer bg-transparent border-0"
                            aria-label={`Delete chapter ${chapName}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Inline add chapter */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChapter(s.name);
                          }
                        }}
                        placeholder="Add a chapter and press Enter"
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[var(--ln)] bg-[var(--sf)] text-[var(--tx)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChapter(s.name)}
                        className="btn text-xs px-2.5 h-7 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
