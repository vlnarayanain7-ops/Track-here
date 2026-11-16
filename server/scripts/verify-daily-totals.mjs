import connectDB from '../config/db.js';
import StudySession from '../models/StudySession.js';
import { DailyTotal } from '../models/rewards.js';

await connectDB();

const [sessionSum] = await StudySession.aggregate([
  { $group: { _id: null, totalMinutes: { $sum: '$focusDuration' }, count: { $sum: 1 } } },
]);

const [dailySum] = await DailyTotal.aggregate([
  { $group: { _id: null, totalMinutes: { $sum: '$minutes' }, totalSessions: { $sum: '$sessions' }, count: { $sum: 1 } } },
]);

console.log('TOTALS VERIFICATION:');
console.log('StudySessions total minutes:', sessionSum?.totalMinutes, 'sessions count:', sessionSum?.count);
console.log('DailyTotals total minutes:', dailySum?.totalMinutes, 'sessions count:', dailySum?.totalSessions);

if (sessionSum?.totalMinutes === dailySum?.totalMinutes && sessionSum?.count === dailySum?.totalSessions) {
  console.log('✅ PROOF: Totals and session counts match EXACTLY!');
} else {
  console.log('Comparison:', { sessionSum, dailySum });
}
process.exit(0);
