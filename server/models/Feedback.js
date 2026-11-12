import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // can be submitted anonymously or by authenticated user
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Bug', 'Idea', 'Other', 'bug', 'idea', 'other'],
      default: 'idea',
      required: true,
    },
    kind: {
      type: String,
      enum: ['bug', 'idea', 'other', 'Bug', 'Idea', 'Other'],
      default: 'idea',
    },
    message: {
      type: String,
      required: [true, 'Feedback message is required'],
      minlength: [3, 'Feedback must be at least 3 characters'],
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
      trim: true,
    },
    route: {
      type: String,
      default: '/',
    },
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    deviceInfo: {
      userAgent: String,
      screenWidth: Number,
      screenHeight: Number,
    },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'resolved'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ user: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;

