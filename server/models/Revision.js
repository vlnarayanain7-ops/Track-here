import mongoose from 'mongoose';

const revisionSchema = new mongoose.Schema(
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
    },
    type: {
      type: String,
      enum: ['topic', 'note', 'problem'],
    },
    linkedNote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
    },
    linkedProblem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending',
    },
    feedback: {
      type: String,
      enum: ['Easy', 'Correct but slow', 'Needed hint', 'Forgot'],
    },
    intervalDays: {
      type: Number,
      default: 1,
    },
    completedAt: Date,
    history: [
      {
        date: Date,
        feedback: String,
        nextInterval: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

revisionSchema.index({ user: 1, dueDate: 1, status: 1 });

const Revision = mongoose.model('Revision', revisionSchema);

export default Revision;
