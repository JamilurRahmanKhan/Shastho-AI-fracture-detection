/**
 * Backend data layer: DeliveryRider
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Delivery riders belong to a specific pharmacy account.
// We keep this simple (name/phone/vehicle) but structured enough for future scaling.

const DeliveryRiderSchema = new mongoose.Schema(
  {
    pharmacyUid: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    vehicleType: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export const DeliveryRider = mongoose.model('DeliveryRider', DeliveryRiderSchema);
