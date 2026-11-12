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

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

export default NotificationLog;
