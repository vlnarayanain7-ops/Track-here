import mongoose from 'mongoose';
import env from '../config/env.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  const res = await db.collection('users').deleteMany({});
  console.log(`Deleted ${res.deletedCount} users. Total users remaining: 0`);
  await mongoose.disconnect();
}

main().catch(console.error);
