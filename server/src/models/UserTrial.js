/**
 * Backend data layer: UserTrial
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * UserTrial
 *
 * FREE_ThreeDays global trial state for a single user.
 * Tied to a single "trial episode" at a time.
 */

const EntitlementsSchema = new mongoose.Schema(
  {
    scanCredits: { type: Number, default: 0 },
    pdfExports: { type: Number, default: 0 },
    shareLinks: { type: Number, default: 0 },
    compareActions: { type: Number, default: 0 },
    scanContextChat: { type: Number, default: 0 },
    generalChat: { type: Number, default: 0 },
    reportsCap: { type: Number, default: 0 },
    recordsCap: { type: Number, default: 0 },
    activeMedsCap: { type: Number, default: 0 },
    checkinsCap: { type: Number, default: 0 },
  },
  { _id: false }
);

const UsageSchema = new mongoose.Schema(
  {
    scansUsed: { type: Number, default: 0 },
    pdfUsed: { type: Number, default: 0 },
    shareLinksUsed: { type: Number, default: 0 },
    comparesUsed: { type: Number, default: 0 },
    scanContextChatUsed: { type: Number, default: 0 },
    generalChatUsed: { type: Number, default: 0 },
    reportsCounted: { type: Number, default: 0 },
    recordsCounted: { type: Number, default: 0 },
    activeMedsCounted: { type: Number, default: 0 },
    checkinsUsed: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserTrialSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, unique: true, index: true },

    // Stable identifier for the trial product
    code: { type: String, default: 'FREE_THREEDAYS', index: true },

    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'expired',
      index: true,
    },

    trialStartAt: { type: Date, default: null },
    trialEndAt: { type: Date, default: null, index: true },
    nextEligibleAt: { type: Date, default: null, index: true },

    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InjuryEpisode', default: null, index: true },

    entitlements: { type: EntitlementsSchema, default: () => ({}) },
    usage: { type: UsageSchema, default: () => ({}) },

    // Audit
    activatedBy: { type: String, default: 'user' },
    activatedFromIp: { type: String, default: '' },
  },
  { timestamps: true }
);

export const UserTrial = mongoose.model('UserTrial', UserTrialSchema);
