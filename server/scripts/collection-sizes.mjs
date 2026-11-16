import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/track-here';

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('--- COLLECTION SIZES & DOCUMENT COUNTS ---');
  for (const c of collections) {
    const stats = await db.command({ collStats: c.name }).catch(() => null);
    if (stats) {
      console.log(`${c.name.padEnd(25)}: ${stats.count} docs, size: ${(stats.size / 1024).toFixed(1)} KB, storage: ${(stats.storageSize / 1024).toFixed(1)} KB`);
    } else {
      const count = await db.collection(c.name).countDocuments();
      console.log(`${c.name.padEnd(25)}: ${count} docs`);
    }
  }
  const dbStats = await db.stats();
  console.log('--- DATABASE TOTALS ---');
  console.log(`Total Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Free Tier (512 MB) Used: ${((dbStats.storageSize / (512 * 1024 * 1024)) * 100).toFixed(2)}%`);
  await mongoose.disconnect();
}

run().catch(console.error);
