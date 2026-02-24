/**
 * Backend data layer: InjuryEpisode
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * InjuryEpisode
 *
 * Episode-based container for fracture/recovery workflows.
 *
 * This is an additive model. Existing features remain unaffected until we
 * start attaching items (X-rays, rehab, check-ins) to episodes.
 */

const InjuryEpisodeSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },

    // Optional human-friendly label (e.g., "Right wrist fall")
    title: { type: String, default: '' },

    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },

    closedAt: { type: Date, default: null },

    // Optional metadata for future features (kept flexible)
    meta: {
      bodyPart: { type: String, default: '' },
      side: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

InjuryEpisodeSchema.index({ userUid: 1, createdAt: -1 });

export const InjuryEpisode = mongoose.model('InjuryEpisode', InjuryEpisodeSchema);
