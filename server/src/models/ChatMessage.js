/**
 * Backend data layer: ChatMessage
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
    userUid: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    // optional link to x-ray case
    xrayCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'XrayCase', required: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
