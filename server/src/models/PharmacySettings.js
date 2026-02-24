/**
 * Backend data layer: PharmacySettings
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

const OperatingHoursSchema = new mongoose.Schema(
  {
    day: { type: String, required: true }, // Mon, Tue, ...
    isClosed: { type: Boolean, default: false },
    open: { type: String, default: '09:00' }, // HH:mm
    close: { type: String, default: '21:00' },
  },
  { _id: false }
);

const PharmacySettingsSchema = new mongoose.Schema(
  {
    pharmacyUid: { type: String, required: true, unique: true, index: true },

    profile: {
      pharmacyName: { type: String, default: '' },
      licenseNumber: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      fullAddress: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },

    delivery: {
      deliveryZones: { type: [String], default: [] },
      deliveryFee: { type: Number, default: 0 },
      freeDeliveryThreshold: { type: Number, default: 0 },
      minimumOrderValue: { type: Number, default: 0 },
      operatingHours: {
        type: [OperatingHoursSchema],
        default: () =>
          [
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
          ].map((d) => ({ day: d, isClosed: false, open: '09:00', close: '21:00' })),
      },
    },

    compliance: {
      verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified',
      },
      licenseDocumentFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
      licenseDocumentFilename: { type: String, default: '' },
      lastReviewedAt: { type: Date, default: null },
      reviewerNote: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export const PharmacySettings = mongoose.model('PharmacySettings', PharmacySettingsSchema);
