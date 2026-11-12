import mongoose from 'mongoose';

const mockTestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Mock test title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    examType: {
      type: String,
      enum: ['NEET', 'JEE', 'UPSC', 'GATE', 'University', 'Placement', 'Competitive Programming', 'Custom'],
      default: 'Custom',
    },
    testDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: [1, 'Total marks must be positive'],
    },
    obtainedMarks: {
      type: Number,
      required: [true, 'Obtained marks are required'],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    unattemptedCount: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    subjectScores: [
      {
        subject: { type: String, required: true },
        totalMarks: { type: Number, default: 0 },
        obtainedMarks: { type: Number, default: 0 },
      },
    ],
    mistakes: {
      type: String,
      trim: true,
    },
    weakTopics: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

mockTestSchema.index({ user: 1, testDate: -1 });

// Automatically compute accuracy before saving if questions are provided
mockTestSchema.pre('save', function () {
  const attempted = (this.correctCount || 0) + (this.incorrectCount || 0);
  if (attempted > 0) {
    this.accuracy = Math.round(((this.correctCount || 0) / attempted) * 100);
  } else if (this.totalMarks > 0) {
    this.accuracy = Math.max(0, Math.round(((this.obtainedMarks || 0) / this.totalMarks) * 100));
  }
});

const MockTest = mongoose.model('MockTest', mockTestSchema);

export default MockTest;

