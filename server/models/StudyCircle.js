import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const { Schema } = mongoose;
const checkIn = new Schema({
  day: { type: String, required: true },
  activity: { type: String, required: true },
  cheers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { _id: false });

const member = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  checkIns: [checkIn],
});

const circle = new Schema({
  _id: { type: String, default: () => randomUUID() },
  name: { type: String, required: true, maxlength: 50 },
  target: { type: Number, required: true, min: 1, max: 56 },
  members: [member],
}, { timestamps: true });
circle.index({ 'members.user': 1, updatedAt: -1 });
export default mongoose.model('StudyCircle', circle);
