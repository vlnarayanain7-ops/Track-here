import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    ageBand: {
      type: String,
      enum: ['13_17', '18_plus'],
      default: '18_plus',
    },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    avatar: String,
    dailyStudyGoal: {
      type: Number,
      default: 240, // 4 hours in minutes
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    weekStartsOn: {
      type: Number,
      default: 1, // Monday
    },
    morningReminderTime: {
      type: String,
      default: '07:00',
    },
    eveningReminderTime: {
      type: String,
      default: '21:00',
    },
    notificationsEnabled: {
      type: Boolean,
      default: false,
    },
    activeNotifications: {
      morning: { type: Boolean, default: true },
      evening: { type: Boolean, default: true },
      taskDeadline: { type: Boolean, default: true },
      revision: { type: Boolean, default: true },
    },
    quietHoursStart: String,
    quietHoursEnd: String,
    activeWeekdays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6, 0],
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'light',
    },
    fontPreference: {
      type: String,
      enum: ['inter', 'geist'],
      default: 'inter',
    },
    streakGraceDays: {
      type: Number,
      default: 0,
    },
    preparationType: {
      type: String,
      enum: ['JEE', 'NEET', 'UPSC', 'GATE', 'University', 'Competitive Programming', 'Placement', 'Custom'],
      default: 'Custom',
    },
    subjects: [
      {
        name: { type: String, required: true },
        color: { type: String, default: '#63B6D7' },
        icon: { type: String, default: 'BookOpen' },
        chapters: [mongoose.Schema.Types.Mixed],
      },
    ],
    examDate: Date,
    examName: String,
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    prefs: {
      type: mongoose.Schema.Types.Mixed,
      default: { show_habits: false, theme: 'light' },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
