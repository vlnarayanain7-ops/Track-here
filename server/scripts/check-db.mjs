import mongoose from 'mongoose';
import env from '../config/env.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}, { projection: { email: 1, name: 1 } }).toArray();
  const sessions = await db.collection('studysessions').find({}).toArray();
  console.log('Current DB users:');
  console.log(users);
  console.log('Current DB sessions:');
  console.log(sessions);
  await mongoose.disconnect();
}

main().catch(console.error);
