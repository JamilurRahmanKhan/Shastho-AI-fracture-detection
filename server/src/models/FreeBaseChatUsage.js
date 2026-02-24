/**
 * Backend data layer: FreeBaseChatUsage
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * FreeBaseChatUsage
 *
 * Tracks weekly general-chat usage for users who are not covered by
 * an active episode plan or trial general-chat quota.
 *
 * We keep this separate from plan/trial usage because FREE_BASE chat limits
 * are periodic (weekly), whereas plans/trials are total counts within their window.
 */

const FreeBaseChatUsageSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    // ISO week key like "2026-W03"
    weekKey: { type: String, required: true, index: true },
    generalChatUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FreeBaseChatUsageSchema.index({ userUid: 1, weekKey: 1 }, { unique: true });

export const FreeBaseChatUsage = mongoose.model('FreeBaseChatUsage', FreeBaseChatUsageSchema);
