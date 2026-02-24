/**
 * Backend data layer: StoreReview
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// User reviews for store products.
// One review per user per product (enforced via compound unique index).

const StoreReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PharmacyInventoryItem',
      required: true,
      index: true,
    },
    userUid: { type: String, required: true, index: true },

    // Display name shown on UI. If missing, frontend will fall back to masked email/uid.
    userDisplayName: { type: String, default: '' },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 2000 },

    // Derived from StoreOrder at the time of writing the review.
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

StoreReviewSchema.index({ productId: 1, userUid: 1 }, { unique: true });

export const StoreReview = mongoose.model('StoreReview', StoreReviewSchema);
