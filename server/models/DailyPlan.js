import mongoose from 'mongoose';

const dailyPlanSchema = new mongoose.Schema(
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
    studyTargets: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    targetHours: Number,
    priorityTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    intentions: String,
    yesterdayIncomplete: [String],
  },
  {
    timestamps: true,
  }
);

dailyPlanSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyPlan = mongoose.model('DailyPlan', dailyPlanSchema);

export default DailyPlan;
