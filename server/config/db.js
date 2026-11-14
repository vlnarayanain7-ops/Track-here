import mongoose from 'mongoose';
import dns from 'dns';
import env from './env.js';

// Ensure reliable SRV lookup across all local ISP DNS providers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

let mongod = null;

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
    });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    try {
      const StudySession = (await import('../models/StudySession.js')).default;
      await StudySession.syncIndexes();
    } catch (indexErr) {
      console.warn('Index sync notice:', indexErr.message);
    }
    if (env.NODE_ENV === 'development') {
      await seedDefaultUser();
    }
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);

    if (env.NODE_ENV === 'development') {
      try {
        console.log('Checking for local MongoDB service on 127.0.0.1:27017...');
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/trackhere', {
          serverSelectionTimeoutMS: 2000,
        });
        console.log(`✅ Real Local MongoDB connected successfully: ${localConn.connection.host} (${localConn.connection.name})`);
        await seedDefaultUser();
        return localConn;
      } catch (localErr) {
        console.warn('Local MongoDB service on 27017 not available, falling back to in-memory MongoDB...');
      }

      try {
        console.warn('DEVELOPMENT ONLY: starting an in-memory MongoDB fallback. Data will be lost when this process stops.');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongod = await MongoMemoryServer.create({
          instance: { launchTimeout: 30000 },
        });
        const uri = mongod.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`✅ In-Memory MongoDB connected: ${conn.connection.host} (${uri})`);
        console.warn('DEVELOPMENT ONLY: this is not an Atlas persistence verification.');
        await seedDefaultUser();
        return conn;
      } catch (memError) {
        console.error('Failed to start in-memory MongoDB:', memError.message);
      }
    }

    console.error(`FATAL: MongoDB connection failed and no fallback is permitted in ${env.NODE_ENV} mode. The API will not start. (${error.message})`);
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
