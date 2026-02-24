/**
 * Backend data layer: EntitlementWallet
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * EntitlementWallet
 *
 * Global packs/credits that can be consumed across episodes.
 * Initially supports scan credits. Can be extended to PDF/chat packs later.
 *
 * Additive: existing functionality is unaffected until endpoints start using it.
 */

const PackSchema = new mongoose.Schema(
  {
    packType: {
      type: String,
      enum: ['SCAN_PACK', 'PDF_PACK'],
      required: true,
      index: true,
    },
    totalCredits: { type: Number, required: true },
    remainingCredits: { type: Number, required: true },
    purchasedAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, default: null },
    meta: {
      provider: { type: String, default: '' },
      providerRef: { type: String, default: '' },
      currency: { type: String, default: 'BDT' },
      amount: { type: Number, default: 0 },
    },
  },
  { _id: true }
);

const EntitlementWalletSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, unique: true, index: true },
    packs: { type: [PackSchema], default: [] },
  },
  { timestamps: true }
);

export const EntitlementWallet = mongoose.model('EntitlementWallet', EntitlementWalletSchema);
