import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { longestRun, MILESTONE_MINUTES } from '../lib/streaks.js';

// Use the native driver so inspecting a database never initializes model indexes.
export async function auditExistingAwards(db) {
  const accounts = db.collection('users');
  const sessions = db.collection('studysessions');
  const certificates = { reviewed: 0, supportedByRetainedSessions: 0, insufficientEvidence: 0 };
  for await (const certificate of db.collection('certificates').find({}, {
    projection: { user: 1, issuedAt: 1, milestone: 1 },
  })) {
    certificates.reviewed++;
    const owner = await accounts.findOne({ _id: certificate.user }, { projection: { timezone: 1 } });
    let supported = false;
    if (owner && certificate.issuedAt instanceof Date && certificate.milestone === 30) {
      const zone = owner.timezone || 'Asia/Kolkata';
      let validZone = true;
      try { new Intl.DateTimeFormat('en', { timeZone: zone }); } catch { validZone = false; }
      if (validZone) {
        const rows = await sessions.aggregate([
          { $match: { user: certificate.user, isTimerSession: true, source: 'timer', heartbeatOk: true,
            'timerState.status': 'completed', startedAt: { $type: 'date', $lte: certificate.issuedAt },
            endTime: { $type: 'date', $lte: certificate.issuedAt }, durationSec: { $gt: 0, $lte: 21600 } } },
          { $match: { $expr: { $lte: [{ $multiply: ['$durationSec', 1000] }, { $subtract: ['$endTime', '$startedAt'] }] } } },
          { $group: { _id: { $dateToString: { date: '$startedAt', timezone: zone, format: '%Y-%m-%d' } }, seconds: { $sum: '$durationSec' } } },
        ]).toArray();
        const minutes = new Map(rows.map(row => [row._id, Math.floor(row.seconds / 60)]));
        supported = longestRun(minutes, MILESTONE_MINUTES) >= certificate.milestone;
      }
    }
    certificates[supported ? 'supportedByRetainedSessions' : 'insufficientEvidence']++;
  }

  const claims = { reviewed: 0, missingOwner: 0, missingFiveApprovedCheckpointsAtSubmission: 0 };
  for await (const claim of db.collection('claims').find({}, { projection: { user: 1, createdAt: 1 } })) {
    claims.reviewed++;
    if (!await accounts.findOne({ _id: claim.user }, { projection: { _id: 1 } })) claims.missingOwner++;
    const months = claim.createdAt instanceof Date ? await db.collection('proofs').distinct('month', {
      user: claim.user, status: 'approved', reviewedAt: { $lte: claim.createdAt, $type: 'date' },
    }) : [];
    if (![1, 2, 3, 4, 5].every(month => months.includes(month))) claims.missingFiveApprovedCheckpointsAtSubmission++;
  }
  const ageBands = await accounts.aggregate([
    { $group: { _id: { $cond: [{ $in: ['$ageBand', ['13_17', '18_plus']] }, '$ageBand', 'missingOrInvalid'] }, count: { $sum: 1 } } },
  ]).toArray();
  return { certificates, claims, storedAgeBands: Object.fromEntries(ageBands.map(row => [row._id, row.count])),
    interpretation: 'Stored age bands lack historical declaration provenance. Deleted sessions, expired proofs or timezone changes may leave insufficient evidence.' };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const uri = process.env.TRACK_AUDIT_URI;
  if (!uri) throw new Error('Set TRACK_AUDIT_URI to a read-only connection for the intended database.');
  const client = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    console.log(JSON.stringify(await auditExistingAwards(client.db()), null, 2));
  } catch (error) {
    console.error('Database audit failed:', error.name);
    process.exitCode = 1;
  } finally { await client.close(); }
}
