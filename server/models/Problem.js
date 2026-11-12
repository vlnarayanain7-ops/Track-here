import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Problem name is required'],
      trim: true,
    },
    url: String,
    platform: {
      type: String,
      enum: ['Codeforces', 'CodeChef', 'LeetCode', 'Other'],
    },
    topic: String,
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
    },
    tags: [String],
    status: {
      type: String,
      enum: ['Unsolved', 'Attempted', 'Solved'],
      default: 'Unsolved',
    },
    solvedIndependently: {
      type: Boolean,
      default: false,
    },
    nextRevisionDate: Date,
  },
  {
    timestamps: true,
  }
);

problemSchema.index({ user: 1, platform: 1 });
problemSchema.index({ user: 1, status: 1 });

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;
