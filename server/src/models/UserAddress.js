/**
 * Backend data layer: UserAddress
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Saved shipping addresses for store users.
// Each user can maintain multiple addresses and choose a default.

const UserAddressSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },

    label: { type: String, default: 'Home', trim: true },
    fullName: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },

    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    postalCode: { type: String, default: '', trim: true },
    country: { type: String, default: 'Bangladesh', trim: true },

    isDefault: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

UserAddressSchema.index({ userUid: 1, isDefault: 1 });

export const UserAddress = mongoose.model('UserAddress', UserAddressSchema);
