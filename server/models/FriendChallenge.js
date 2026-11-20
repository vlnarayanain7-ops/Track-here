import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const schema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  cheers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  started: { type: Date, default: Date.now },
  ends: { type: Date, required: true },
  goalDays: { type: Number, enum: [3, 5, 7], default: 5 },
});
schema.index({ members: 1, started: -1 });
export default mongoose.model('FriendChallenge', schema);
