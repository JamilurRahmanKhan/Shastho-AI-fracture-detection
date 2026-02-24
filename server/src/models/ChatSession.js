/**
 * Backend data layer: ChatSession
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

const ChatSessionSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    title: { type: String, default: 'X-ray Assistant' },
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);
