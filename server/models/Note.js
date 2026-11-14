import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
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
    content: String,        // rich text JSON
    contentMarkdown: String, // markdown version
    contentHtml: String,     // rendered HTML
    folder: {
      type: String,
      default: 'General',
    },
    tags: [String],
    isPinned: {
      type: Boolean,
      default: false,
    },
    lastEditedAt: Date,
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ user: 1, folder: 1 });
noteSchema.index({ user: 1, isPinned: -1 });
noteSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ user: 1, folder: 1, updatedAt: -1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
