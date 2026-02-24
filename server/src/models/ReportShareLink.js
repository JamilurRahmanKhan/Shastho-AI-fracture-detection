/**
 * Backend data layer: ReportShareLink
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * ReportShareLink
 *
 * A public, time-limited link to view a specific X-ray report.
 * Token must be unguessable.
 */

const ReportShareLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },

    userUid: { type: String, required: true, index: true },
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InjuryEpisode', required: true, index: true },
    xrayCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'XrayCase', required: true, index: true },

    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },

    accessCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: null },

    sourceType: { type: String, enum: ['PLAN', 'TRIAL'], default: 'PLAN' },
    sourceCode: { type: String, default: '' },
  },
  { timestamps: true }
);

ReportShareLinkSchema.index({ userUid: 1, createdAt: -1 });

export const ReportShareLink = mongoose.model('ReportShareLink', ReportShareLinkSchema);
