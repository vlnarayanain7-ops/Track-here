import mongoose from 'mongoose';
import env from '../config/env.js';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  console.log('\n--- Collections & Counts Before Cleaning ---');
  for (const name of collectionNames) {
    const count = await db.collection(name).countDocuments();
    console.log(`  ${name.padEnd(25)}: ${count}`);
  }

  // Collections to wipe completely for a clean slate
  const collectionsToClear = [
    'users',
    'refreshsessions',
    'pushsubscriptions',
    'studysessions',
    'dailytotals',
    'dailyreports',
    'tasks',
    'notes',
    'dailyplans',
    'dailyreviews',
    'problems',
    'problemattempts',
    'revisions',
    'mocktests',
    'timetableslots',
    'certificates',
    'proofs',
    'proofhashes',
    'claims',
    'feedbacks',
    'notificationlogs',
  ];

  console.log('\n--- Cleaning Collections ---');
  for (const name of collectionsToClear) {
    if (collectionNames.includes(name)) {
      const res = await db.collection(name).deleteMany({});
      console.log(`  Cleared ${name.padEnd(25)}: deleted ${res.deletedCount} documents`);
    }
  }

  // Reset RewardCounter to 0 claims count if exists
  if (collectionNames.includes('rewardcounters')) {
    await db.collection('rewardcounters').updateOne(
      { key: 'surprise_reward_v1' },
      { $set: { count: 0 } },
      { upsert: true }
    );
    console.log('  Reset rewardcounters count to 0');
  }

  console.log('\n--- Collections & Counts After Cleaning ---');
  for (const name of collectionNames) {
    const count = await db.collection(name).countDocuments();
    console.log(`  ${name.padEnd(25)}: ${count}`);
  }

  await mongoose.disconnect();
  console.log('\nDatabase cleanup complete. Database is now in a clean, fresh state.');
}

main().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
