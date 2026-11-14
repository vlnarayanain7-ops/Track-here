import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['morning', 'evening', 'taskDeadline', 'revision', 'custom'],
    },
    title: {
      type: String,
      required: true,
    },
    body: String,
    sentAt: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
    snoozedUntil: Date,
    deduplicationKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationLogSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationLogSchema.index({ user: 1, createdAt: -1 });

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

export default NotificationLog;
