/**
 * Backend: db
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Server entrypoint and core backend wiring for ShasthoAI.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

export async function connectDB(mongoUri) {
  if (!mongoUri) throw new Error('Missing MONGODB_URI');

  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    autoIndex: true,
  });

  return mongoose.connection;
}
