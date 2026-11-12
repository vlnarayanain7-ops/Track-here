import mongoose from 'mongoose';

const dailyReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    actualStudyTime: Number, // in minutes
    completedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    problemsAttempted: Number,
    problemsSolved: Number,
    goalProgress: Number, // percentage
    learned: String,
    mistakes: String,
    difficulties: String,
    incompleteGoals: [String],
    tomorrowPlan: String,
  },
  {
    timestamps: true,
  }
);

dailyReviewSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyReview = mongoose.model('DailyReview', dailyReviewSchema);

export default DailyReview;
