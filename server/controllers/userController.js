import { z } from 'zod';
import mongoose from 'mongoose';
import User from '../models/User.js';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';
import ProblemAttempt from '../models/ProblemAttempt.js';
import DailyPlan from '../models/DailyPlan.js';
import DailyReview from '../models/DailyReview.js';
import Revision from '../models/Revision.js';
import PushSubscription from '../models/PushSubscription.js';
import NotificationLog from '../models/NotificationLog.js';
import RefreshSession from '../models/RefreshSession.js';
import MockTest from '../models/MockTest.js';
import TimetableSlot from '../models/TimetableSlot.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { clearAuthCookies } from '../utils/tokens.js';
import { emitToUser } from '../services/socketService.js';

// ─── Validation Schemas ───────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  avatar: z.string().optional().nullable(),
  ageBand: z.enum(['13_17', '18_plus']).optional(),
  dailyStudyGoal: z.number().min(1).max(1440).optional(),
  timezone: z.string().optional(),
  preparationType: z.enum(['JEE', 'NEET', 'UPSC', 'GATE', 'University', 'Competitive Programming', 'Placement', 'Custom']).optional().nullable(),
  subjects: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    color: z.string().optional(),
    icon: z.string().optional(),
    chapters: z.array(z.any()).optional(),
  })).optional(),
  examDate: z.string().or(z.date()).optional().nullable(),
  examName: z.string().trim().max(100).optional().nullable(),
  onboardingCompleted: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  weekStartsOn: z.number().min(0).max(6).optional(),
  morningReminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  eveningReminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notificationsEnabled: z.boolean().optional(),
  activeNotifications: z.object({
    morning: z.boolean().optional(),
    evening: z.boolean().optional(),
    taskDeadline: z.boolean().optional(),
    revision: z.boolean().optional(),
  }).optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  activeWeekdays: z.array(z.number().min(0).max(6)).optional(),
  theme: z.enum(['dark', 'light']).optional(),
  fontPreference: z.enum(['inter', 'geist']).optional(),
  streakGraceDays: z.number().min(0).max(3).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character'),
});

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('User not found');

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!user) throw ApiError.notFound('User not found');
  emitToUser(req.user.id, 'user:updated', user);

  res.json({
    success: true,
    message: 'Profile updated',
    data: { user },
  });
});

/**
 * PUT /api/users/settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const updateData = {};

  // Flatten activeNotifications for dot-notation update
  if (req.body.activeNotifications) {
    for (const [key, value] of Object.entries(req.body.activeNotifications)) {
      updateData[`activeNotifications.${key}`] = value;
    }
    delete req.body.activeNotifications;
  }

  Object.assign(updateData, req.body);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!user) throw ApiError.notFound('User not found');
  emitToUser(req.user.id, 'user:updated', user);

  res.json({
    success: true,
    message: 'Settings updated',
    data: { user },
  });
});

/**
 * GET /api/users/me/export
 * Securely export all user data as an isolated JSON dump.
 */
export const exportData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [user, studySessions, tasks, notes, problems, problemAttempts, dailyPlans, dailyReviews, revisions, mockTests, timetableSlots] =
    await Promise.all([
      User.findById(userId),
      StudySession.find({ user: userId }).lean(),
      Task.find({ user: userId }).lean(),
      Note.find({ user: userId }).lean(),
      Problem.find({ user: userId }).lean(),
      ProblemAttempt.find({ user: userId }).lean(),
      DailyPlan.find({ user: userId }).lean(),
      DailyReview.find({ user: userId }).lean(),
      Revision.find({ user: userId }).lean(),
      MockTest.find({ user: userId }).lean(),
      TimetableSlot.find({ user: userId }).lean(),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: user?.toJSON(),
    studySessions,
    tasks,
    notes,
    problems,
    problemAttempts,
    dailyPlans,
    dailyReviews,
    revisions,
    mockTests,
    timetableSlots,
  };

  res.json({
    success: true,
    data: exportData,
  });
});

/**
 * POST /api/users/me/restore
 * Import / restore user data from JSON with comprehensive foreign key remapping and ownership protection.
 */
export const importData = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const data = req.body || {};

  const counts = {
    studySessions: 0,
    tasks: 0,
    notes: 0,
    problems: 0,
    problemAttempts: 0,
    dailyPlans: 0,
    dailyReviews: 0,
    revisions: 0,
  };

  // Maps to translate old export IDs to freshly minted ObjectIds
  const taskIdMap = new Map();
  const sessionIdMap = new Map();
  const noteIdMap = new Map();
  const problemIdMap = new Map();

  // 1. Assign new IDs for primary independent entities
  if (Array.isArray(data.tasks)) {
    data.tasks.forEach((t) => {
      const oldId = t._id?.toString() || t.id?.toString();
      if (oldId) taskIdMap.set(oldId, new mongoose.Types.ObjectId());
    });
  }

  if (Array.isArray(data.notes)) {
    data.notes.forEach((n) => {
      const oldId = n._id?.toString() || n.id?.toString();
      if (oldId) noteIdMap.set(oldId, new mongoose.Types.ObjectId());
    });
  }

  if (Array.isArray(data.problems)) {
    data.problems.forEach((p) => {
      const oldId = p._id?.toString() || p.id?.toString();
      if (oldId) problemIdMap.set(oldId, new mongoose.Types.ObjectId());
    });
  }

  if (Array.isArray(data.studySessions)) {
    data.studySessions.forEach((s) => {
      const oldId = s._id?.toString() || s.id?.toString();
      if (oldId) sessionIdMap.set(oldId, new mongoose.Types.ObjectId());
    });
  }

  // 2. Insert Tasks (relinking linkedStudySession if present)
  if (Array.isArray(data.tasks) && data.tasks.length > 0) {
    const sanitizedTasks = data.tasks.map((t) => {
      const oldId = t._id?.toString() || t.id?.toString();
      const newId = taskIdMap.get(oldId) || new mongoose.Types.ObjectId();
      const oldSession = t.linkedStudySession?.toString();
      const remappedSession = oldSession ? sessionIdMap.get(oldSession) : undefined;

      return {
        _id: newId,
        user: userId,
        title: String(t.title || 'Imported Task').slice(0, 200),
        description: t.description ? String(t.description) : undefined,
        priority: ['Low', 'Medium', 'High'].includes(t.priority) ? t.priority : 'Medium',
        status: ['Todo', 'In Progress', 'Completed', 'Cancelled'].includes(t.status) ? t.status : 'Todo',
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        category: t.category ? String(t.category) : undefined,
        tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
        estimatedDuration: Number(t.estimatedDuration) || 0,
        actualDuration: Number(t.actualDuration) || 0,
        isRecurring: Boolean(t.isRecurring),
        recurringPattern: t.recurringPattern,
        linkedStudySession: remappedSession,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      };
    });

    const result = await Task.insertMany(sanitizedTasks, { ordered: false }).catch((e) => e.insertedDocs || []);
    counts.tasks = Array.isArray(result) ? result.length : 0;
  }

  // 3. Insert Notes
  if (Array.isArray(data.notes) && data.notes.length > 0) {
    const sanitizedNotes = data.notes.map((n) => {
      const oldId = n._id?.toString() || n.id?.toString();
      const newId = noteIdMap.get(oldId) || new mongoose.Types.ObjectId();

      return {
        _id: newId,
        user: userId,
        title: String(n.title || 'Untitled Note').slice(0, 200),
        folder: String(n.folder || 'General').slice(0, 100),
        contentMarkdown: String(n.contentMarkdown || ''),
        contentHtml: String(n.contentHtml || ''),
        tags: Array.isArray(n.tags) ? n.tags.map(String) : [],
        isPinned: Boolean(n.isPinned),
        color: n.color ? String(n.color) : undefined,
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
        updatedAt: n.updatedAt ? new Date(n.updatedAt) : new Date(),
      };
    });

    const result = await Note.insertMany(sanitizedNotes, { ordered: false }).catch((e) => e.insertedDocs || []);
    counts.notes = Array.isArray(result) ? result.length : 0;
  }

  // 4. Insert Problems
  if (Array.isArray(data.problems) && data.problems.length > 0) {
    const sanitizedProblems = data.problems.map((p) => {
      const oldId = p._id?.toString() || p.id?.toString();
      const newId = problemIdMap.get(oldId) || new mongoose.Types.ObjectId();

      return {
        _id: newId,
        user: userId,
        name: String(p.name || 'Imported Problem').slice(0, 200),
        url: p.url ? String(p.url) : undefined,
        platform: ['Codeforces', 'LeetCode', 'CodeChef', 'AtCoder', 'HackerRank', 'CSES', 'Other'].includes(p.platform) ? p.platform : 'Other',
        difficulty: ['Easy', 'Medium', 'Hard', 'Expert'].includes(p.difficulty) ? p.difficulty : 'Medium',
        topic: String(p.topic || 'General').slice(0, 100),
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
        status: ['Unsolved', 'Attempted', 'Solved', 'Solved Independently'].includes(p.status) ? p.status : 'Unsolved',
        rating: Number(p.rating) || undefined,
        notes: p.notes ? String(p.notes) : undefined,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      };
    });

    const result = await Problem.insertMany(sanitizedProblems, { ordered: false }).catch((e) => e.insertedDocs || []);
    counts.problems = Array.isArray(result) ? result.length : 0;
  }

  // 5. Insert Problem Attempts (strictly remapping problem ID)
  if (Array.isArray(data.problemAttempts) && data.problemAttempts.length > 0) {
    const sanitizedAttempts = [];
    for (const a of data.problemAttempts) {
      const oldProbId = a.problem?._id?.toString() || a.problem?.toString();
      const newProbId = oldProbId ? problemIdMap.get(oldProbId) : undefined;
      // Do not import an attempt if parent problem was not in this backup
      if (!newProbId) continue;

      sanitizedAttempts.push({
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        problem: newProbId,
        attemptNumber: Number(a.attemptNumber) || 1,
        outcome: ['Solved independently', 'Solved with editorial', 'Solved with hint', 'Attempted but stuck', 'Time limit exceeded', 'Wrong answer'].includes(a.outcome) ? a.outcome : 'Solved independently',
        duration: Number(a.duration) || 0,
        approach: a.approach ? String(a.approach) : undefined,
        timeComplexity: a.timeComplexity ? String(a.timeComplexity) : undefined,
        spaceComplexity: a.spaceComplexity ? String(a.spaceComplexity) : undefined,
        mistakes: a.mistakes ? String(a.mistakes) : undefined,
        learning: a.learning ? String(a.learning) : undefined,
        attemptedAt: a.attemptedAt ? new Date(a.attemptedAt) : new Date(),
      });
    }

    if (sanitizedAttempts.length > 0) {
      const result = await ProblemAttempt.insertMany(sanitizedAttempts, { ordered: false }).catch((e) => e.insertedDocs || []);
      counts.problemAttempts = Array.isArray(result) ? result.length : 0;
    }
  }

  // 6. Insert Study Sessions (remapping linkedTask)
  if (Array.isArray(data.studySessions) && data.studySessions.length > 0) {
    const sanitizedSessions = data.studySessions.map((s) => {
      const oldId = s._id?.toString() || s.id?.toString();
      const newId = sessionIdMap.get(oldId) || new mongoose.Types.ObjectId();
      const oldTask = s.linkedTask?._id?.toString() || s.linkedTask?.toString();
      const remappedTask = oldTask ? taskIdMap.get(oldTask) : undefined;

      return {
        _id: newId,
        user: userId,
        category: s.category ? String(s.category).slice(0, 100) : 'Other',
        activityType: ['Video/tutorial', 'Reading', 'Coding', 'Problem solving', 'Revision', 'Practice'].includes(s.activityType) ? s.activityType : 'Coding',
        topic: String(s.topic || 'General study').slice(0, 200),
        subtopic: s.subtopic ? String(s.subtopic).slice(0, 200) : undefined,
        date: s.date ? new Date(s.date) : new Date(),
        focusDuration: Number(s.focusDuration) || 0,
        videoDuration: Number(s.videoDuration) || 0,
        problemsAttempted: Number(s.problemsAttempted) || 0,
        problemsSolved: Number(s.problemsSolved) || 0,
        problemsSolvedIndependently: Number(s.problemsSolvedIndependently) || 0,
        mistakes: s.mistakes ? String(s.mistakes) : undefined,
        keyLearnings: s.keyLearnings ? String(s.keyLearnings) : undefined,
        nextAction: s.nextAction ? String(s.nextAction) : undefined,
        linkedTask: remappedTask,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      };
    });

    const result = await StudySession.insertMany(sanitizedSessions, { ordered: false }).catch((e) => e.insertedDocs || []);
    counts.studySessions = Array.isArray(result) ? result.length : 0;
  }

  // 7. Insert Daily Plans (remapping priorityTasks)
  if (Array.isArray(data.dailyPlans) && data.dailyPlans.length > 0) {
    const sanitizedPlans = data.dailyPlans.map((p) => {
      const remappedTasks = Array.isArray(p.priorityTasks)
        ? p.priorityTasks
            .map((t) => taskIdMap.get(t._id?.toString() || t.toString()))
            .filter(Boolean)
        : [];

      return {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        date: String(p.date || new Date().toISOString().split('T')[0]),
        targetHours: Number(p.targetHours) || 4,
        studyTargets: p.studyTargets || {},
        priorityTasks: remappedTasks,
        intentions: p.intentions ? String(p.intentions) : undefined,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      };
    });

    const result = await DailyPlan.insertMany(sanitizedPlans, { ordered: false }).catch((e) => e.insertedDocs || []);
    counts.dailyPlans = Array.isArray(result) ? result.length : 0;
  }

  // 8. Insert Daily Reviews (remapping completedTasks)
  if (Array.isArray(data.dailyReviews) && data.dailyReviews.length > 0) {
    const sanitizedReviews = data.dailyReviews.map((r) => {
      const remappedTasks = Array.isArray(r.completedTasks)
        ? r.completedTasks
            .map((t) => taskIdMap.get(t._id?.toString() || t.toString()))
            .filter(Boolean)
        : [];

      return {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        date: String(r.date || new Date().toISOString().split('T')[0]),
        actualStudyTime: Number(r.actualStudyTime) || 0,
        problemsAttempted: Number(r.problemsAttempted) || 0,
        problemsSolved: Number(r.problemsSolved) || 0,
        goalProgress: Number(r.goalProgress) || 0,
        completedTasks: remappedTasks,
        learned: r.learned ? String(r.learned) : undefined,
        mistakes: r.mistakes ? String(r.mistakes) : undefined,
        difficulties: r.difficulties ? String(r.difficulties) : undefined,
        incompleteGoals: Array.isArray(r.incompleteGoals) ? r.incompleteGoals.map(String) : [],
        tomorrowPlan: r.tomorrowPlan ? String(r.tomorrowPlan) : undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      };
    });

    const result = await DailyReview.insertMany(sanitizedReviews, { ordered: false }).catch((e) => e.insertedDocs || []);
    counts.dailyReviews = Array.isArray(result) ? result.length : 0;
  }

  // 9. Insert Revisions (remapping linkedNote & linkedProblem)
  if (Array.isArray(data.revisions) && data.revisions.length > 0) {
    const sanitizedRevisions = data.revisions.map((r) => {
      const oldNote = r.linkedNote?._id?.toString() || r.linkedNote?.toString();
      const oldProb = r.linkedProblem?._id?.toString() || r.linkedProblem?.toString();

      return {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        type: ['topic', 'problem', 'concept'].includes(r.type) ? r.type : 'topic',
        title: String(r.title || 'Revision item').slice(0, 200),
        category: r.category ? String(r.category) : undefined,
        interval: Number(r.interval) || 1,
        repetitions: Number(r.repetitions) || 0,
        easeFactor: Number(r.easeFactor) || 2.5,
        dueDate: r.dueDate ? new Date(r.dueDate) : new Date(),
        status: ['pending', 'completed', 'skipped'].includes(r.status) ? r.status : 'pending',
        linkedNote: oldNote ? noteIdMap.get(oldNote) : undefined,
        linkedProblem: oldProb ? problemIdMap.get(oldProb) : undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      };
    });

    const result = await Revision.insertMany(sanitizedRevisions, { ordered: false }).catch((e) => e.insertedDocs || []);
    counts.revisions = Array.isArray(result) ? result.length : 0;
  }

  res.json({
    success: true,
    message: 'Data imported safely with isolated IDs and verified integrity',
    data: { counts },
  });
});

/**
 * PUT /api/users/password
 * Securely change password after validating current password.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password cannot be identical to current password');
  }

  user.password = newPassword;
  await user.save();

  // Invalidate all active refresh sessions to lock out any unauthorized devices
  await RefreshSession.deleteMany({ user: user._id });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * DELETE /api/users/me
 * Delete user account and all associated data; strictly requires password confirmation
 * (or valid reason e.g. COPPA 'under13' for profile completion).
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isUnder13 = req.body?.reason === 'under13';

  if (!isUnder13) {
    if (user.password) {
      // Email/password account: strictly verify current password
      if (!req.body?.password) {
        throw ApiError.badRequest('Password is required to confirm account deletion.');
      }
      const isMatch = await user.comparePassword(req.body.password);
      if (!isMatch) {
        throw ApiError.badRequest('Incorrect password. Account deletion aborted.');
      }
    } else {
      // OAuth accounts without password: require typing email or confirmation keyword
      const confirmInput = (req.body?.confirmation || req.body?.password || '').trim().toLowerCase();
      if (confirmInput !== user.email.toLowerCase() && confirmInput !== 'delete') {
        throw ApiError.badRequest(`Please confirm account deletion by entering your email (${user.email}) or 'delete'.`);
      }
    }
  }

  // Delete all user data in parallel
  await Promise.all([
    StudySession.deleteMany({ user: userId }),
    Task.deleteMany({ user: userId }),
    Note.deleteMany({ user: userId }),
    Problem.deleteMany({ user: userId }),
    ProblemAttempt.deleteMany({ user: userId }),
    DailyPlan.deleteMany({ user: userId }),
    DailyReview.deleteMany({ user: userId }),
    Revision.deleteMany({ user: userId }),
    MockTest.deleteMany({ user: userId }),
    TimetableSlot.deleteMany({ user: userId }),
    PushSubscription.deleteMany({ user: userId }),
    NotificationLog.deleteMany({ user: userId }),
    RefreshSession.deleteMany({ user: userId }),
    User.findByIdAndDelete(userId),
  ]);

  clearAuthCookies(res);

  res.json({
    success: true,
    message: 'Account and all data deleted successfully',
  });
});
