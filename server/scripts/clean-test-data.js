/**
 * One-time cleanup script to remove test subjects (e.g. "ss") or leftover test data
 * Usage: node server/scripts/clean-test-data.js [userEmail]
 */
import mongoose from 'mongoose';
import User from '../models/User.js';
import env from '../config/env.js';

async function cleanData() {
  const targetEmail = process.argv[2];
  console.log('Connecting to database...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected.');

  const filter = targetEmail ? { email: targetEmail.toLowerCase() } : {};
  const users = await User.find(filter);

  console.log(`Auditing ${users.length} user(s)...`);

  let cleanedUsersCount = 0;
  for (const user of users) {
    const originalSubjectCount = user.subjects?.length || 0;
    // Filter out "ss" and "General Study" test placeholders
    user.subjects = (user.subjects || []).filter((s) => {
      const name = (s.name || '').trim().toLowerCase();
      return name !== 'ss' && name !== 'general study';
    });

    if (user.subjects.length !== originalSubjectCount) {
      await user.save();
      cleanedUsersCount++;
      console.log(`Cleaned test subjects from user: ${user.email} (${originalSubjectCount} -> ${user.subjects.length})`);
    }
  }

  console.log(`Cleanup complete. Cleaned ${cleanedUsersCount} user(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

cleanData().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});

