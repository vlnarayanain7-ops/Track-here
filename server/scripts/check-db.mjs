import mongoose from 'mongoose';
import env from '../config/env.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}, { projection: { email: 1, name: 1 } }).toArray();
  console.log('Current DB users in trackhere database:');
  console.log(users);
  await mongoose.disconnect();
}

main().catch(console.error);
