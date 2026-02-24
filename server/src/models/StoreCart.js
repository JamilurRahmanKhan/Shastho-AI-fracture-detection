/**
 * Backend data layer: StoreCart
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Persisted shopping cart for authenticated users.
// Guest carts remain client-side (localStorage) and can be merged into this cart after login.

const StoreCartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PharmacyInventoryItem',
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 1, max: 999 },
    addedAt: { type: Date, default: Date.now },

    // Snapshot of the unit price (after discount if applicable) when the user added it.
    // Used to show “price updated” warnings if the pharmacy changes pricing.
    unitPriceSnapshot: { type: Number, default: null },
    currencySnapshot: { type: String, default: '' },
  },
  { _id: false }
);

const StoreCartSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, unique: true, index: true },
    items: { type: [StoreCartItemSchema], default: [] },
  },
  { timestamps: true }
);

export const StoreCart = mongoose.model('StoreCart', StoreCartSchema);
