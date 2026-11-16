import mongoose from 'mongoose';
import env from '../config/env.js';
import { cleanupTestUsers } from '../lib/cleanupTestUsers.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  const res = await cleanupTestUsers();
  console.log(`Cleaned up ${res.deletedUsersCount} fake/test users and their associated records.`);

  const remainingUsers = await mongoose.connection.db.collection('users').find({}, { projection: { email: 1, name: 1 } }).toArray();
  console.log('Remaining users in database:');
  console.log(remainingUsers);

  await mongoose.disconnect();
}

main().catch(console.error);
