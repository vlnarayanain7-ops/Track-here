import mongoose from 'mongoose';

const timetableSlotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required (0-6)'],
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 09:00)'],
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 11:00)'],
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 100,
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    activityType: {
      type: String,
      enum: ['Video/Tutorial', 'Reading', 'Coding', 'Problem Solving', 'Revision', 'Practice', 'Mock Test'],
      default: 'Reading',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

timetableSlotSchema.index({ user: 1, dayOfWeek: 1, startTime: 1 });

const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);

export default TimetableSlot;

