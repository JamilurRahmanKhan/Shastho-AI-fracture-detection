/**
 * Backend data layer: XrayComparison
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * XrayComparison
 *
 * Stores a compare action result for two scans within an episode.
 * This is intentionally lightweight; the UI can render the images side-by-side.
 */

const XrayComparisonSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InjuryEpisode', required: true, index: true },

    leftXrayCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'XrayCase', required: true },
    rightXrayCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'XrayCase', required: true },

    // Simple derived metrics (optional)
    leftProbability: { type: Number, default: null },
    rightProbability: { type: Number, default: null },
    deltaProbability: { type: Number, default: null },

    notes: { type: String, default: '' },

    sourceType: { type: String, enum: ['PLAN', 'TRIAL'], default: 'PLAN' },
    sourceCode: { type: String, default: '' },
  },
  { timestamps: true }
);

XrayComparisonSchema.index({ userUid: 1, episodeId: 1, createdAt: -1 });

export const XrayComparison = mongoose.model('XrayComparison', XrayComparisonSchema);
