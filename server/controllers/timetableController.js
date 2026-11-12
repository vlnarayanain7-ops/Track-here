import { z } from 'zod';
import TimetableSlot from '../models/TimetableSlot.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';

// ─── Validation Schemas ───────────────────────────────────────

export const createTimetableSlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'),
  subject: z.string().trim().min(1, 'Subject is required').max(100),
  topic: z.string().trim().max(200).optional().nullable(),
  activityType: z.enum(['Video/Tutorial', 'Reading', 'Coding', 'Problem Solving', 'Revision', 'Practice', 'Mock Test']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  notes: z.string().trim().optional().nullable(),
}).strict();

export const updateTimetableSlotSchema = createTimetableSlotSchema.partial().strict();

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/timetable
 */
export const getTimetableSlots = asyncHandler(async (req, res) => {
  const { dayOfWeek } = req.query;
  const query = { user: req.user.id };

  if (dayOfWeek !== undefined && dayOfWeek !== '') {
    query.dayOfWeek = Number(dayOfWeek);
  }

  const slots = await TimetableSlot.find(query).sort({ dayOfWeek: 1, startTime: 1 });

  res.json({
    success: true,
    data: { slots },
  });
});

/**
 * POST /api/timetable
 */
export const createTimetableSlot = asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.create({
    ...req.body,
    user: req.user.id,
  });
  emitToUser(req.user.id, 'timetable:updated', slot);

  res.status(201).json({
    success: true,
    message: 'Timetable slot created',
    data: { slot },
  });
});

/**
 * PUT /api/timetable/:id
 */
export const updateTimetableSlot = asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!slot) throw ApiError.notFound('Timetable slot not found');
  emitToUser(req.user.id, 'timetable:updated', slot);

  res.json({
    success: true,
    message: 'Timetable slot updated',
    data: { slot },
  });
});

/**
 * DELETE /api/timetable/:id
 */
export const deleteTimetableSlot = asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!slot) throw ApiError.notFound('Timetable slot not found');
  emitToUser(req.user.id, 'timetable:updated', { _id: req.params.id });

  res.json({
    success: true,
    message: 'Timetable slot deleted',
  });
});

