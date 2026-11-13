import { z } from 'zod';
import MockTest from '../models/MockTest.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { emitToUser } from '../services/socketService.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── Validation Schemas ───────────────────────────────────────

export const createMockTestSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  examType: z.string().optional().default('Custom'),
  testDate: z.string().or(z.date()).optional(),
  totalMarks: z.number().or(z.string()).transform(Number).optional().default(100),
  obtainedMarks: z.number().or(z.string()).transform(Number).optional(),
  score: z.number().or(z.string()).transform(Number).optional(),
  totalQuestions: z.number().min(0).optional(),
  correctCount: z.number().min(0).optional(),
  incorrectCount: z.number().min(0).optional(),
  unattemptedCount: z.number().min(0).optional(),
  durationMinutes: z.number().min(0).optional(),
  subjectScores: z.array(
    z.object({
      subject: z.string().trim().min(1),
      totalMarks: z.number().min(0).optional(),
      obtainedMarks: z.number().optional(),
    })
  ).optional(),
  mistakes: z.string().trim().optional().nullable(),
  weakTopics: z.array(z.string().trim()).optional(),
  notes: z.string().trim().optional().nullable(),
}).passthrough().transform((val) => ({
  ...val,
  obtainedMarks: val.obtainedMarks !== undefined ? val.obtainedMarks : (val.score !== undefined ? val.score : 0),
  totalMarks: val.totalMarks || 100,
  examType: ['NEET', 'JEE', 'UPSC', 'GATE', 'University', 'Placement', 'Competitive Programming'].includes(val.examType) ? val.examType : 'Custom',
}));

export const updateMockTestSchema = z.object({
  title: z.string().trim().max(200).optional(),
  examType: z.string().optional(),
  testDate: z.string().or(z.date()).optional(),
  totalMarks: z.number().or(z.string()).transform(Number).optional(),
  obtainedMarks: z.number().or(z.string()).transform(Number).optional(),
  score: z.number().or(z.string()).transform(Number).optional(),
  totalQuestions: z.number().min(0).optional(),
  correctCount: z.number().min(0).optional(),
  incorrectCount: z.number().min(0).optional(),
  unattemptedCount: z.number().min(0).optional(),
  durationMinutes: z.number().min(0).optional(),
  subjectScores: z.array(
    z.object({
      subject: z.string().trim().min(1),
      totalMarks: z.number().min(0).optional(),
      obtainedMarks: z.number().optional(),
    })
  ).optional(),
  mistakes: z.string().trim().optional().nullable(),
  weakTopics: z.array(z.string().trim()).optional(),
  notes: z.string().trim().optional().nullable(),
}).passthrough();

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/mock-tests
 */
export const getMockTests = asyncHandler(async (req, res) => {
  const { examType, search, page = 1, limit = 20 } = req.query;
  const query = { user: req.user.id };

  if (typeof examType === 'string' && examType) query.examType = examType;
  if (typeof search === 'string' && search.trim()) {
    query.title = { $regex: escapeRegex(search.trim().slice(0, 100)), $options: 'i' };
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [tests, total] = await Promise.all([
    MockTest.find(query)
      .sort({ testDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    MockTest.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      tests,
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
 * GET /api/mock-tests/stats
 */
export const getMockTestStats = asyncHandler(async (req, res) => {
  const tests = await MockTest.find({ user: req.user.id }).sort({ testDate: 1 });

  const totalTests = tests.length;
  if (totalTests === 0) {
    return res.json({
      success: true,
      data: {
        totalTests: 0,
        averagePercentage: 0,
        highestPercentage: 0,
        averageAccuracy: 0,
        recentScores: [],
        subjectAverages: {},
      },
    });
  }

  let totalPctSum = 0;
  let highestPct = 0;
  let accuracySum = 0;
  let testsWithAccuracy = 0;
  const subjectMap = {};

  tests.forEach((t) => {
    const pct = t.totalMarks > 0 ? (t.obtainedMarks / t.totalMarks) * 100 : 0;
    totalPctSum += pct;
    if (pct > highestPct) highestPct = pct;

    if (t.accuracy > 0) {
      accuracySum += t.accuracy;
      testsWithAccuracy += 1;
    }

    if (t.subjectScores && t.subjectScores.length > 0) {
      t.subjectScores.forEach((ss) => {
        if (!subjectMap[ss.subject]) {
          subjectMap[ss.subject] = { totalObtained: 0, totalMax: 0, count: 0 };
        }
        subjectMap[ss.subject].totalObtained += ss.obtainedMarks || 0;
        subjectMap[ss.subject].totalMax += ss.totalMarks || 0;
        subjectMap[ss.subject].count += 1;
      });
    }
  });

  const subjectAverages = {};
  for (const [sub, data] of Object.entries(subjectMap)) {
    subjectAverages[sub] = data.totalMax > 0 ? Math.round((data.totalObtained / data.totalMax) * 100) : 0;
  }

  const recentScores = tests.slice(-10).map((t) => ({
    id: t._id,
    title: t.title,
    date: t.testDate,
    obtained: t.obtainedMarks,
    total: t.totalMarks,
    percentage: t.totalMarks > 0 ? Math.round((t.obtainedMarks / t.totalMarks) * 100) : 0,
    accuracy: t.accuracy,
  }));

  res.json({
    success: true,
    data: {
      totalTests,
      averagePercentage: Math.round(totalPctSum / totalTests),
      highestPercentage: Math.round(highestPct),
      averageAccuracy: testsWithAccuracy > 0 ? Math.round(accuracySum / testsWithAccuracy) : 0,
      recentScores,
      subjectAverages,
    },
  });
});

/**
 * GET /api/mock-tests/:id
 */
export const getMockTest = asyncHandler(async (req, res) => {
  const test = await MockTest.findOne({ _id: req.params.id, user: req.user.id });
  if (!test) throw ApiError.notFound('Mock test record not found');

  res.json({
    success: true,
    data: { test },
  });
});

/**
 * POST /api/mock-tests
 */
export const createMockTest = asyncHandler(async (req, res) => {
  const test = await MockTest.create({
    ...req.body,
    user: req.user.id,
  });
  emitToUser(req.user.id, 'mockTest:created', test);

  res.status(201).json({
    success: true,
    message: 'Mock test logged successfully',
    data: { test },
  });
});

/**
 * PUT /api/mock-tests/:id
 */
export const updateMockTest = asyncHandler(async (req, res) => {
  const test = await MockTest.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!test) throw ApiError.notFound('Mock test record not found');
  emitToUser(req.user.id, 'mockTest:updated', test);

  res.json({
    success: true,
    message: 'Mock test updated',
    data: { test },
  });
});

/**
 * DELETE /api/mock-tests/:id
 */
export const deleteMockTest = asyncHandler(async (req, res) => {
  const test = await MockTest.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!test) throw ApiError.notFound('Mock test record not found');
  emitToUser(req.user.id, 'mockTest:deleted', { _id: req.params.id });

  res.json({
    success: true,
    message: 'Mock test deleted successfully',
  });
});

