/**
 * Backend data layer: EpisodePlan
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * EpisodePlan
 *
 * Represents a paid, time-boxed episode plan attached to a single InjuryEpisode.
 * We store an immutable snapshot of entitlements at purchase time so future
 * catalog changes do not alter existing users' access.
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

const EpisodePlanSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InjuryEpisode', required: true, index: true },

    // Stable codes, used for UI and admin reporting
    planCode: {
      type: String,
      enum: ['ACCIDENT_PASS_7D', 'RECOVERY_6W', 'RECOVERY_PLUS_12W'],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'archived'],
      default: 'active',
      index: true,
    },

    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },

    entitlements: { type: EntitlementsSchema, default: () => ({}) },
    usage: { type: UsageSchema, default: () => ({}) },

    // Optional billing metadata (kept flexible)
    billing: {
      currency: { type: String, default: 'BDT' },
      amount: { type: Number, default: 0 },
      provider: { type: String, default: '' },
      providerRef: { type: String, default: '' },
      purchasedAt: { type: Date, default: null },
    },

    // Admin support / audit
    grantedByUid: { type: String, default: '' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

EpisodePlanSchema.index({ episodeId: 1, status: 1 });
EpisodePlanSchema.index({ userUid: 1, status: 1, endAt: -1 });

export const EpisodePlan = mongoose.model('EpisodePlan', EpisodePlanSchema);
