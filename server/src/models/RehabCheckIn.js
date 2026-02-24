/**
 * Backend data layer: RehabCheckIn
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * RehabCheckIn
 *
 * Episode-scoped progress tracker check-in.
 * Kept minimal to avoid changing existing UI; future UIs can extend.
 */

const RehabCheckInSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InjuryEpisode', required: true, index: true },

    // Date key used to enforce at-most-one check-in per calendar day (optional).
    // Stored as YYYY-MM-DD in UTC.
    dateKey: { type: String, required: true, index: true },

    pain: { type: Number, min: 0, max: 10, default: null },
    swelling: { type: String, enum: ['low', 'medium', 'high', 'unknown'], default: 'unknown' },
    numbnessTingling: { type: Boolean, default: false },
    mobility: { type: String, enum: ['worse', 'same', 'better', 'unknown'], default: 'unknown' },
    redFlags: { type: Boolean, default: false },
    notes: { type: String, default: '' },

    sourceType: { type: String, enum: ['PLAN', 'TRIAL'], default: 'PLAN' },
    sourceCode: { type: String, default: '' },
  },
  { timestamps: true }
);

RehabCheckInSchema.index({ userUid: 1, episodeId: 1, dateKey: 1 }, { unique: true });

export const RehabCheckIn = mongoose.model('RehabCheckIn', RehabCheckInSchema);
