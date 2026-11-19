import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId, // One membership per account
  week: { type: String, required: true, index: true },
  goal: { type: Number, required: true, min: 1, max: 84 },
  joinedAt: { type: Date, required: true },
  shared: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudySession' }],
});
export default mongoose.model('FinalsMembership', schema);
