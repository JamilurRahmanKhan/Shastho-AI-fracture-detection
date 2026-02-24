/**
 * Backend data layer: StorePricingConfig
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Global pricing configuration for the Medical Store.
// Supports optional per-country overrides.

const CountryOverrideSchema = new mongoose.Schema(
  {
    countryCode: { type: String, required: true, trim: true, uppercase: true },

    // Optional overrides (fallback to base config when empty)
    currencyCode: { type: String, default: '' },
    currencySymbol: { type: String, default: '' },

    // Rates are decimals (e.g., 0.08 for 8%)
    taxRate: { type: Number, default: null, min: 0, max: 1 },
    shippingFee: { type: Number, default: null, min: 0 },
    freeShippingThreshold: { type: Number, default: null, min: 0 },
  },
  { _id: false }
);

const StorePricingConfigSchema = new mongoose.Schema(
  {
    baseCurrencyCode: { type: String, default: 'BDT', trim: true, uppercase: true },
    baseCurrencySymbol: { type: String, default: '৳', trim: true },

    defaultTaxRate: { type: Number, default: 0.08, min: 0, max: 1 },
    defaultShippingFee: { type: Number, default: 5.99, min: 0 },
    freeShippingThreshold: { type: Number, default: 50, min: 0 },

    countryOverrides: { type: [CountryOverrideSchema], default: [] },

    // Optional audit metadata
    updatedByUid: { type: String, default: '' },
  },
  { timestamps: true }
);

export const StorePricingConfig = mongoose.model('StorePricingConfig', StorePricingConfigSchema);
