/**
 * Backend data layer: PharmacyInventoryItem
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Pharmacy-owned inventory item.
// Scoped by pharmacyUid (Firebase uid of the pharmacy account).
// This design is "industry-ready" for an MVP: supports CRUD, search, filters,
// expiry tracking, low-stock alerts, and future expansion (batches, staff roles).

const PharmacyInventoryItemSchema = new mongoose.Schema(
  {
    pharmacyUid: { type: String, required: true, index: true },

    // Core product fields
    name: { type: String, required: true, trim: true },
    genericName: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    dosage: { type: String, default: '', trim: true }, // e.g., 500mg
    form: { type: String, default: '', trim: true }, // tablet/syrup/etc
    manufacturer: { type: String, default: '', trim: true },
    sku: { type: String, default: '', trim: true },

    // Pricing
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'BDT' },

    // Inventory
    stockQuantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, default: null },
    batchNo: { type: String, default: '', trim: true },
    supplier: { type: String, default: '', trim: true },

    requiresPrescription: { type: Boolean, default: false },
    description: { type: String, default: '', trim: true },

    // Store (user-facing) content fields
    // These make the product details page fully dynamic.
    longDescription: { type: String, default: '', trim: true },
    keyBenefits: { type: [String], default: [] },
    usageInstructions: { type: String, default: '', trim: true },
    warnings: { type: String, default: '', trim: true },

    tags: { type: [String], default: [] },

    // Optional image stored in GridFS (pharmacy_inventory_images bucket)
    imageFileId: { type: mongoose.Schema.Types.ObjectId },
    imageMeta: {
      filename: { type: String, default: '' },
      contentType: { type: String, default: '' },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date },
    },


    // Soft delete support (safer for auditability)
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    // Future: staff roles
    createdByUid: { type: String, default: '' },
    updatedByUid: { type: String, default: '' },
  },
  { timestamps: true }
);

// Text search for inventory management.
PharmacyInventoryItemSchema.index({
  name: 'text',
  genericName: 'text',
  manufacturer: 'text',
  category: 'text',
  tags: 'text',
});



// Indexes
// Text index for search in inventory list (used by $text search in pharmacyInventory routes)
PharmacyInventoryItemSchema.index(
  { name: 'text', genericName: 'text', manufacturer: 'text', category: 'text', tags: 'text', batchNo: 'text' },
  { name: 'pharmacy_inventory_text' }
);

// Common query index for fast listing/filtering
PharmacyInventoryItemSchema.index({ pharmacyUid: 1, isDeleted: 1, createdAt: -1 }, { name: 'pharmacy_inventory_list' });

export const PharmacyInventoryItem = mongoose.model('PharmacyInventoryItem', PharmacyInventoryItemSchema);
