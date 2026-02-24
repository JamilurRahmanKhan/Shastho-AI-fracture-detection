/**
 * Backend data layer: StoreOrder
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Master order placed by an end user. Contains a full snapshot of items at the time of purchase.
// A separate PharmacyOrder is generated per pharmacy for fulfillment.

const StoreOrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    pharmacyUid: { type: String, required: true, index: true },

    // Snapshot fields
    name: { type: String, required: true },
    genericName: { type: String, default: '' },
    category: { type: String, default: '' },
    dosage: { type: String, default: '' },
    form: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    requiresPrescription: { type: Boolean, default: false },
    imageFileId: { type: mongoose.Schema.Types.ObjectId, default: null },

    unitPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
  currencySymbol: { type: String, default: '' },
  pricingSnapshot: {
    taxRate: { type: Number, default: null },
    shippingFee: { type: Number, default: null },
    freeShippingThreshold: { type: Number, default: null },
    countryCode: { type: String, default: '' },
  },
    quantity: { type: Number, required: true, min: 1, max: 999 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Optional prescription metadata for orders that contain Rx-required items.
// Stored on the master StoreOrder and copied to each PharmacyOrder.
const PrescriptionSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    filename: { type: String, default: '' },
    contentType: { type: String, default: '' },
    size: { type: Number, default: 0 },

    uploadedByUid: { type: String, default: '' },
    uploadedAt: { type: Date, default: null },
    doctorNote: { type: String, default: '', trim: true },

    status: {
      type: String,
      default: 'not_required',
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      index: true,
    },

    reviewedByUid: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const StoreOrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    userUid: { type: String, required: true, index: true },

    items: { type: [StoreOrderItemSchema], required: true },

    // Totals
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
  currencySymbol: { type: String, default: '' },
  pricingSnapshot: {
    taxRate: { type: Number, default: null },
    shippingFee: { type: Number, default: null },
    freeShippingThreshold: { type: Number, default: null },
    countryCode: { type: String, default: '' },
  },

    // COD only for this project
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'pending' },

    // Delivery / contact
    shippingAddress: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },

    status: {
      type: String,
      default: 'placed',
      enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
      index: true,
    },

    // Prescription info (only required when any item requiresPrescription=true)
    prescription: { type: PrescriptionSchema, default: () => ({ status: 'not_required' }) },
  },
  { timestamps: true }
);

export const StoreOrder = mongoose.model('StoreOrder', StoreOrderSchema);
