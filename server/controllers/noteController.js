import { z } from 'zod';
import Note from '../models/Note.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── Validation Schemas ───────────────────────────────────────

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().optional().nullable(),
  contentMarkdown: z.string().optional().nullable(),
  contentHtml: z.string().optional().nullable(),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
}).strict();

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').optional(),
  content: z.string().optional().nullable(),
  contentMarkdown: z.string().optional().nullable(),
  contentHtml: z.string().optional().nullable(),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  lastEditedAt: z.string().or(z.date()).optional().nullable(),
}).strict();

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/notes
 */
export const getNotes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, folder, tags, search, pinned, sort = '-updatedAt' } = req.query;

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
  const safeSort = typeof sort === 'string' ? sort : '-updatedAt';

  const query = { user: req.user.id };

  if (typeof folder === 'string' && folder) query.folder = folder;
  if (pinned === 'true') query.isPinned = true;
  if (typeof tags === 'string' && tags) {
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagArray.length > 0) query.tags = { $in: tagArray };
  }
  if (typeof search === 'string' && search.trim()) {
    const safeSearch = escapeRegex(search.trim().slice(0, 100));
    query.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { contentMarkdown: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const skip = (safePage - 1) * safeLimit;

  const [notes, total] = await Promise.all([
    Note.find(query)
      .select('-content -contentHtml') // Exclude heavy fields from list
      .sort(safeSort)
      .skip(skip)
      .limit(safeLimit),
    Note.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      notes,
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
 * POST /api/notes
 */
export const createNote = asyncHandler(async (req, res) => {
  const noteData = {
    ...req.body,
    user: req.user.id,
    lastEditedAt: new Date(),
  };

  const note = await Note.create(noteData);
  emitToUser(req.user.id, 'note:created', note);

  res.status(201).json({
    success: true,
    message: 'Note created',
    data: { note },
  });
});

/**
 * GET /api/notes/:id
 */
export const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!note) throw ApiError.notFound('Note not found');

  res.json({
    success: true,
    data: { note },
  });
});

/**
 * PUT /api/notes/:id
 */
export const updateNote = asyncHandler(async (req, res) => {
  const updateData = {
    ...req.body,
    lastEditedAt: new Date(),
  };

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!note) throw ApiError.notFound('Note not found');
  emitToUser(req.user.id, 'note:updated', note);

  res.json({
    success: true,
    message: 'Note updated',
    data: { note },
  });
});

/**
 * DELETE /api/notes/:id
 */
export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!note) throw ApiError.notFound('Note not found');
  emitToUser(req.user.id, 'note:deleted', { _id: req.params.id });

  res.json({
    success: true,
    message: 'Note deleted',
  });
});

/**
 * GET /api/notes/folders
 * List all distinct folders for the user.
 */
export const getFolders = asyncHandler(async (req, res) => {
  const folders = await Note.distinct('folder', { user: req.user.id });

  res.json({
    success: true,
    data: { folders: folders.sort() },
  });
});
