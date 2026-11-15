import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log('Total users:', users.length);
  for (const u of users) {
    console.log({
      id: u._id,
      email: u.email,
      name: u.name,
      hasPassword: !!u.password,
      isVerified: u.isVerified,
      googleId: !!u.googleId,
    });
  }
  process.exit(0);
}

check().catch(console.error);
