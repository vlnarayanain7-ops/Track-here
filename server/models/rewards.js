import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = { type: Schema.Types.ObjectId, ref: 'User', required: true };

const dailySchema = new Schema({
  user: ref,
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },      // the user's LOCAL date
  minutes: { type: Number, default: 0 },                                      // all focus minutes
  validMinutes: { type: Number, default: 0 },                                 // verified timer minutes only
  sessions: { type: Number, default: 0 },
  bySubject: { type: Map, of: Number },                                       // minutes per subject name (for reports)
}, { versionKey: false });
dailySchema.index({ user: 1, date: 1 }, { unique: true });
export const DailyTotal = mongoose.models.DailyTotal || model('DailyTotal', dailySchema);

const certSchema = new Schema({
  user: ref, milestone: { type: Number, required: true }, serial: { type: String, unique: true },
  issuedAt: { type: Date, default: Date.now }, showName: { type: Boolean, default: false }, displayName: { type: String, maxlength: 60 },
}, { versionKey: false });
certSchema.index({ user: 1, milestone: 1 }, { unique: true });
export const Certificate = mongoose.models.Certificate || model('Certificate', certSchema);

const proofSchema = new Schema({
  user: ref, month: { type: Number, min: 1, max: 5, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  note: { type: String, maxlength: 300, default: '' }, link: { type: String, maxlength: 300 },
  files: [{ data: Buffer, type: String, sha: String }],                       // max 3 files, 200 KB each, deleted at review
  reviewNote: { type: String, maxlength: 300 }, reviewedAt: Date, submittedAt: { type: Date, default: Date.now },
  expireAt: Date,                                                             // pending: +45 days; decided: +400 days (metadata only)
}, { versionKey: false });
proofSchema.index({ user: 1, month: 1 }, { unique: true });
proofSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });                // MongoDB deletes the document at expireAt
export const Proof = mongoose.models.Proof || model('Proof', proofSchema);

export const ProofHash = mongoose.models.ProofHash || model('ProofHash', new Schema({ sha: { type: String, unique: true }, user: ref, month: Number }, { versionKey: false }));

const dailyReportSchema = new Schema({
  user: ref, date: { type: String, required: true }, summary: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });
dailyReportSchema.index({ user: 1, date: 1 }, { unique: true });
dailyReportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 24 * 3600 });   // deleted automatically after 2 days
export const DailyReport = mongoose.models.DailyReport || model('DailyReport', dailyReportSchema);

export const RewardCounter = mongoose.models.RewardCounter || model('RewardCounter', new Schema({ _id: String, claimed: { type: Number, default: 0 } }, { versionKey: false }));

const claimSchema = new Schema({
  user: { ...ref, unique: true }, status: { type: String, enum: ['pending', 'approved', 'shipped', 'rejected'], default: 'pending' },
  addrHash: { type: String, unique: true },                                    // one claim per address
  address: { name: String, line1: String, line2: String, city: String, state: String, zip: String, phone: String },
  createdAt: { type: Date, default: Date.now }, purgeAt: Date,                  // set to +60 days when shipped or rejected
}, { versionKey: false });
claimSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
export const Claim = mongoose.models.Claim || model('Claim', claimSchema);

export default {
  DailyTotal,
  Certificate,
  Proof,
  ProofHash,
  DailyReport,
  RewardCounter,
  Claim,
};
