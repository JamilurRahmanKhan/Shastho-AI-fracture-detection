/**
 * Backend data layer: XrayCase
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

const XrayCaseSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },

    // Optional: attach scans to an InjuryEpisode (subscription feature).
    // Backward-compatible: older documents may not have this field.
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InjuryEpisode', default: null, index: true },

    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    // Public URL served by this server: /uploads/<fileName>
    fileUrl: { type: String, required: true },

    // AI analysis (stub now, model later)
    analysis: {
      fractureDetected: { type: Boolean, default: false },
      probability: { type: Number, default: 0 },
      fractureType: { type: String, default: '' },
      severity: { type: String, default: '' },
      region: { type: String, default: '' },
      recoveryTimeline: { type: String, default: '' },
      recommendations: { type: [String], default: [] },
      rehabExercises: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

export const XrayCase = mongoose.model('XrayCase', XrayCaseSchema);
