import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    revokedAt: Date,
    userAgent: String,
    ip: String,
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — MongoDB will automatically delete expired documents
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);

export default RefreshSession;
