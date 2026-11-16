import mongoose from 'mongoose';
import env from '../config/env.js';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const stats = await db.command({ dbStats: 1 });
  const collections = await db.listCollections().toArray();

  console.log('=== MongoDB Database Storage Statistics ===');
  console.log(`Database Name : ${stats.db}`);
  console.log(`Collections   : ${stats.collections}`);
  console.log(`Objects/Docs  : ${stats.objects}`);
  console.log(`Data Size     : ${formatBytes(stats.dataSize)} (${stats.dataSize} bytes)`);
  console.log(`Storage Size  : ${formatBytes(stats.storageSize)} (${stats.storageSize} bytes)`);
  console.log(`Indexes       : ${stats.indexes}`);
  console.log(`Index Size    : ${formatBytes(stats.indexSize)} (${stats.indexSize} bytes)`);
  console.log(`Total Size    : ${formatBytes(stats.totalSize || (stats.storageSize + stats.indexSize))} (${stats.totalSize || (stats.storageSize + stats.indexSize)} bytes)`);
  console.log(`Scale Factor  : ${stats.scaleFactor || 1}`);

  console.log('\n--- Collection Storage Breakdown ---');
  for (const c of collections) {
    try {
      const collStats = await db.command({ collStats: c.name });
      console.log(
        `${c.name.padEnd(22)}: docs=${String(collStats.count).padEnd(4)} ` +
        `data=${formatBytes(collStats.size).padEnd(9)} ` +
        `storage=${formatBytes(collStats.storageSize).padEnd(9)} ` +
        `indexes=${formatBytes(collStats.totalIndexSize)}`
      );
    } catch (e) {
      // Some special views or collections may not support collStats
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
