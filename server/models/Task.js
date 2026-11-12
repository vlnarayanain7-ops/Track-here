import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: String,
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Todo',
    },
    dueDate: {
      type: Date,
      index: true,
    },
    category: {
      type: String,
      trim: true,
    },
    tags: [String],
    estimatedDuration: Number, // in minutes
    actualDuration: Number,    // in minutes
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
      },
      interval: Number,
      daysOfWeek: [Number],
      endDate: Date,
    },
    completedAt: Date,
    linkedStudySession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudySession',
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
