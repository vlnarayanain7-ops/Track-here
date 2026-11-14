import mongoose from 'mongoose';

const problemAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    duration: Number, // in minutes
    outcome: {
      type: String,
      enum: [
        'Solved independently',
        'Solved with hints',
        'Solved after viewing solution',
        'Not solved',
      ],
    },
    approach: String,
    timeComplexity: String,
    spaceComplexity: String,
    mistakes: String,
    learning: String,
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

problemAttemptSchema.index({ problem: 1, user: 1, attemptNumber: 1 });
problemAttemptSchema.index({ user: 1, attemptedAt: -1 });

const ProblemAttempt = mongoose.model('ProblemAttempt', problemAttemptSchema);

export default ProblemAttempt;
