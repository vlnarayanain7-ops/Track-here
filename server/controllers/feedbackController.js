import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { z } from 'zod';

const createFeedbackSchema = z
  .object({
    kind: z.enum(['bug', 'idea', 'other', 'Bug', 'Idea', 'Other']).optional(),
    type: z.enum(['bug', 'idea', 'other', 'Bug', 'Idea', 'Other']).optional(),
    message: z
      .string()
      .min(3, 'Message must be at least 3 characters')
      .max(2000, 'Message cannot exceed 2000 characters'),
    route: z.string().max(200, 'Route cannot exceed 200 characters').optional().default('/'),
    appVersion: z.string().max(50).optional().default('1.0.0'),
    deviceInfo: z
      .object({
        userAgent: z.string().optional(),
        screenWidth: z.number().optional(),
        screenHeight: z.number().optional(),
      })
      .optional(),
  })
  .strict();

/**
 * POST /api/feedback
 * Submit bug reports, ideas, or feedback from beta testers
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  const parsed = createFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error?.issues?.[0]?.message || parsed.error?.errors?.[0]?.message || 'Invalid feedback payload';
    throw ApiError.badRequest(errorMsg);
  }

  const rawKind = parsed.data.kind || parsed.data.type || 'idea';
  const kindVal = rawKind.toLowerCase();

  const user = await User.findById(req.user.id).select('name email');

  const feedback = await Feedback.create({
    user: req.user.id || req.user._id,
    userEmail: user?.email || req.user.email || null,
    userName: user?.name || req.user.name || null,
    type: kindVal,
    kind: kindVal,
    message: parsed.data.message,
    route: parsed.data.route,
    appVersion: parsed.data.appVersion,
    deviceInfo: parsed.data.deviceInfo,
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for your feedback! It helps improve Track Here.',
    data: {
      id: feedback._id,
      kind: feedback.kind,
      createdAt: feedback.createdAt,
    },
  });
});

/**
 * GET /api/feedback
 * List feedback submissions strictly for the authenticated owner
 * (A user can never read other users' feedback)
 */
export const listFeedback = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const items = await Feedback.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({
    success: true,
    data: items,
  });
});

