/**
 * Backend data layer: EntitlementLedger
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * EntitlementLedger
 *
 * Immutable audit log for entitlement consumption & admin adjustments.
 * Helps debugging "why blocked" and supports admin monitoring.
 */

const EntitlementLedgerSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InjuryEpisode', default: null, index: true },

    // Where the entitlement came from
    sourceType: {
      type: String,
      enum: ['PLAN', 'TRIAL', 'PACK', 'FREE_BASE', 'ADMIN_ADJUST'],
      required: true,
      index: true,
    },
    sourceId: { type: String, default: '' },

    // What was consumed or adjusted
    actionType: {
      type: String,
      enum: [
        'SCAN',
        'PDF_EXPORT',
        'SHARE_LINK',
        'COMPARE',
        'CHAT_SCAN_CONTEXT',
        'CHAT_GENERAL',
        'RECORD_UPLOAD',
        'MED_ADD',
        'CHECKIN',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, default: 1 },

    // Optional context
    xrayCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'XrayCase', default: null },
    chatSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', default: null },

    note: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

EntitlementLedgerSchema.index({ userUid: 1, createdAt: -1 });

export const EntitlementLedger = mongoose.model('EntitlementLedger', EntitlementLedgerSchema);
