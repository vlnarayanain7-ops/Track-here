import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    activityType: {
      type: String,
      required: [true, 'Activity type is required'],
      enum: ['Video/Tutorial', 'Reading', 'Coding', 'Problem Solving', 'Revision', 'Practice'],
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    subtopic: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    startTime: Date,
    endTime: Date,
    focusDuration: {
      type: Number,
      required: [true, 'Focus duration is required'],
    },
    videoDuration: {
      type: Number,
      default: 0,
    },
    problemsAttempted: {
      type: Number,
      default: 0,
    },
    problemsSolved: {
      type: Number,
      default: 0,
    },
    problemsSolvedIndependently: {
      type: Number,
      default: 0,
    },
    mistakes: String,
    keyLearnings: String,
    nextAction: String,
    linkedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    isTimerSession: {
      type: Boolean,
      default: false,
    },
    activeTimerKey: {
      type: String,
      default: null,
    },
    timerState: {
      status: {
        type: String,
        enum: ['running', 'paused', 'completed'],
      },
      startedAt: Date,
      pausedAt: Date,
      totalPausedDuration: {
        type: Number,
        default: 0,
      },
      accumulatedDuration: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

studySessionSchema.index({ user: 1, date: -1 });
studySessionSchema.index({ user: 1, category: 1 });
// Enforces one running/paused timer per user even when two devices start simultaneously.
studySessionSchema.index({ user: 1, activeTimerKey: 1 }, { unique: true, partialFilterExpression: { activeTimerKey: 'active' } });

const StudySession = mongoose.model('StudySession', studySessionSchema);

export default StudySession;
