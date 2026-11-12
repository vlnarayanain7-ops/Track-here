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

const ProblemAttempt = mongoose.model('ProblemAttempt', problemAttemptSchema);

export default ProblemAttempt;
