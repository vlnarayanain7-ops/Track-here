import { z } from 'zod';
import Task from '../models/Task.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';

// ─── Validation Schemas ───────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Todo', 'In Progress', 'Completed', 'Cancelled']).optional(),
  dueDate: z.string().or(z.date()).optional().nullable(),
  dueOn: z.string().or(z.date()).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  subjectId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  estimatedDuration: z.number().min(0).optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    interval: z.number().min(1).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    endDate: z.string().or(z.date()).optional().nullable(),
  }).optional().nullable(),
  linkedStudySession: z.string().optional().nullable(),
}).strict();

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Todo', 'In Progress', 'Completed', 'Cancelled']).optional(),
  dueDate: z.string().or(z.date()).optional().nullable(),
  dueOn: z.string().or(z.date()).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  subjectId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  estimatedDuration: z.number().min(0).optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    interval: z.number().min(1).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    endDate: z.string().or(z.date()).optional().nullable(),
  }).optional().nullable(),
  linkedStudySession: z.string().optional().nullable(),
  completedAt: z.string().or(z.date()).optional().nullable(),
}).strict();

export const updateStatusSchema = z.object({
  status: z.enum(['Todo', 'In Progress', 'Completed', 'Cancelled']),
}).strict();

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/tasks
 */
export const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    priority,
    category,
    dueDateStart,
    dueDateEnd,
    sort = '-createdAt',
  } = req.query;

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
  const safeSort = typeof sort === 'string' ? sort : '-createdAt';

  const query = { user: req.user.id };

  if (typeof status === 'string' && status) query.status = status;
  if (typeof priority === 'string' && priority) query.priority = priority;
  if (typeof category === 'string' && category) query.category = category;
  if (typeof dueDateStart === 'string' && !isNaN(Date.parse(dueDateStart))) {
    query.dueDate = query.dueDate || {};
    query.dueDate.$gte = new Date(dueDateStart);
  }
  if (typeof dueDateEnd === 'string' && !isNaN(Date.parse(dueDateEnd))) {
    query.dueDate = query.dueDate || {};
    query.dueDate.$lte = new Date(dueDateEnd);
  }

  const skip = (safePage - 1) * safeLimit;

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .sort(safeSort)
      .skip(skip)
      .limit(safeLimit)
      .populate('linkedStudySession', 'topic focusDuration date'),
    Task.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      tasks,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    },
  });
});

/**
 * POST /api/tasks
 */
export const createTask = asyncHandler(async (req, res) => {
  const taskData = {
    ...req.body,
    user: req.user.id,
  };

  if (taskData.dueOn && !taskData.dueDate) {
    taskData.dueDate = new Date(taskData.dueOn);
  }
  if (taskData.dueDate) taskData.dueDate = new Date(taskData.dueDate);

  const task = await Task.create(taskData);
  emitToUser(req.user.id, 'task:created', task);

  res.status(201).json({
    success: true,
    message: 'Task created',
    data: { task },
  });
});

/**
 * GET /api/tasks/:id
 */
export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate('linkedStudySession', 'topic focusDuration date');

  if (!task) throw ApiError.notFound('Task not found');

  res.json({
    success: true,
    data: { task },
  });
});

/**
 * PUT /api/tasks/:id
 */
export const updateTask = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

  // Auto-set completedAt when status changes to Completed
  if (updateData.status === 'Completed' && !updateData.completedAt) {
    updateData.completedAt = new Date();
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!task) throw ApiError.notFound('Task not found');
  emitToUser(req.user.id, 'task:updated', task);

  res.json({
    success: true,
    message: 'Task updated',
    data: { task },
  });
});

/**
 * DELETE /api/tasks/:id
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!task) throw ApiError.notFound('Task not found');
  emitToUser(req.user.id, 'task:deleted', { _id: req.params.id });

  res.json({
    success: true,
    message: 'Task deleted',
  });
});

/**
 * PUT /api/tasks/:id/status
 */
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const updateData = { status };
  if (status === 'Completed') {
    updateData.completedAt = new Date();
  } else {
    updateData.completedAt = null;
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!task) throw ApiError.notFound('Task not found');
  emitToUser(req.user.id, 'task:updated', task);

  res.json({
    success: true,
    message: `Task marked as ${status}`,
    data: { task },
  });
});
