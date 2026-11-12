import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';
import asyncHandler from '../utils/asyncHandler.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/search
 * Global search across StudySessions, Tasks, Notes, and Problems
 */
export const search = asyncHandler(async (req, res) => {
  const rawQ = typeof req.query.q === 'string' ? req.query.q : '';
  const q = rawQ.trim();

  if (!q || q.length === 0) {
    return res.json({
      sessions: [],
      tasks: [],
      notes: [],
      problems: [],
    });
  }

  const searchRegex = new RegExp(escapeRegex(q.slice(0, 100)), 'i');
  const userId = req.user.id;

  const [sessions, tasks, notes, problems] = await Promise.all([
    StudySession.find({
      user: userId,
      $or: [
        { topic: searchRegex },
        { subtopic: searchRegex },
        { mistakes: searchRegex },
        { keyLearnings: searchRegex },
      ],
    })
      .sort({ date: -1 })
      .limit(10)
      .select('topic subtopic category focusDuration date activityType'),

    Task.find({
      user: userId,
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ],
    })
      .sort({ dueDate: 1 })
      .limit(10)
      .select('title status priority dueDate category'),

    Note.find({
      user: userId,
      $or: [
        { title: searchRegex },
        { contentMarkdown: searchRegex },
        { tags: searchRegex },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title folder tags isPinned updatedAt'),

    Problem.find({
      user: userId,
      $or: [
        { name: searchRegex },
        { topic: searchRegex },
        { tags: searchRegex },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('name platform difficulty status solvedIndependently'),
  ]);

  res.json({
    sessions,
    tasks,
    notes,
    problems,
  });
});

