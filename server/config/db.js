import mongoose from 'mongoose';
import dns from 'dns';
import env from './env.js';

// Ensure reliable SRV lookup across all local ISP DNS providers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

/**
 * Seeds a default developer user in development mode so logins succeed immediately.
 */
export const seedDefaultUser = async () => {
  try {
    const User = (await import('../models/User.js')).default;
    const existing = await User.findOne({ email: 'ravi@nmtl.gov.in' });
    if (!existing) {
      await User.create({
        name: 'Ravi',
        email: 'ravi@nmtl.gov.in',
        password: 'password123',
        isVerified: true,
        timezone: 'Asia/Kolkata',
        dailyStudyGoal: 240,
      });
      console.log('🌱 Seeded default dev account: ravi@nmtl.gov.in / password123');
    }
  } catch (err) {
    console.error('Failed to seed default user:', err.message);
  }
};

const connectDB = async () => {
  const isTest = process.env.NODE_ENV === 'test';
  const targetUri = isTest
    ? (process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/trackhere_test')
    : env.MONGODB_URI;

  if (isTest) {
    if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(targetUri)) {
      console.error('Refusing to run tests: MONGODB_URI_TEST must point at localhost');
      process.exit(1);
    }
  }

  try {
    console.log(isTest ? 'Connecting to local test MongoDB...' : 'Connecting to MongoDB Atlas / configured URI...');
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 4000,
      maxPoolSize: 20,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    try {
      const [
        { default: StudySession },
        { default: Task },
        { default: Note },
        { default: Revision },
        { default: Problem },
        { default: DailyPlan },
        { default: DailyReview },
        { default: MockTest },
        { default: TimetableSlot },
      ] = await Promise.all([
        import('../models/StudySession.js'),
        import('../models/Task.js'),
        import('../models/Note.js'),
        import('../models/Revision.js'),
        import('../models/Problem.js'),
        import('../models/DailyPlan.js'),
        import('../models/DailyReview.js'),
        import('../models/MockTest.js'),
        import('../models/TimetableSlot.js'),
      ]);

      await Promise.allSettled([
        StudySession.syncIndexes(),
        Task.syncIndexes(),
        Note.syncIndexes(),
        Revision.syncIndexes(),
        Problem.syncIndexes(),
        DailyPlan.syncIndexes(),
        DailyReview.syncIndexes(),
        MockTest.syncIndexes(),
        TimetableSlot.syncIndexes(),
      ]);
    } catch (indexErr) {
      console.warn('Index sync notice:', indexErr.message);
    }
    if (env.NODE_ENV === 'development' && process.env.SEED_DEFAULT_USER === 'true') {
      await seedDefaultUser();
    }
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);

    console.error('The API requires its configured database to preserve study history across restarts.');
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
};

export default connectDB;
