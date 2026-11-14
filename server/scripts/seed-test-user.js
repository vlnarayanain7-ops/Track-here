import mongoose from 'mongoose';
import User from '../models/User.js';

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/trackhere');
  const email = 'test_action_user@trackhere.dev';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Action Tester',
      email,
      password: 'Password123!',
      isVerified: true,
      onboardingCompleted: true,
      ageBand: '18_plus',
      subjects: [
        { name: 'Algorithms', color: 'var(--c1)', chapters: [] },
        { name: 'Operating Systems', color: 'var(--c2)', chapters: [] },
      ],
    });
    console.log('Created test action user:', user.email);
  } else {
    user.password = 'Password123!';
    user.isVerified = true;
    user.onboardingCompleted = true;
    user.ageBand = '18_plus';
    if (!user.subjects || user.subjects.length === 0) {
      user.subjects = [
        { name: 'Algorithms', color: 'var(--c1)', chapters: [] },
        { name: 'Operating Systems', color: 'var(--c2)', chapters: [] },
      ];
    }
    await user.save();
    console.log('Updated test action user:', user.email);
  }
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
