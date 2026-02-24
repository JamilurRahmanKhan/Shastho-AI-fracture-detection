/**
 * Backend data layer: PharmacyOrder
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Per-pharmacy fulfillment order derived from a StoreOrder.
// This allows pharmacies to see only their own items.

const PharmacyOrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
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

// Copied from the master StoreOrder if the pharmacy order contains Rx-required items.
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

const PharmacyOrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    storeOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreOrder', required: true, index: true },
    pharmacyUid: { type: String, required: true, index: true },
    userUid: { type: String, required: true, index: true },

    items: { type: [PharmacyOrderItemSchema], required: true },

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

    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'pending' },

    shippingAddress: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },

    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'accepted', 'shipped', 'delivered', 'cancelled'],
      index: true,
    },

    // Optional fulfillment metadata
    acceptedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '', trim: true },

    // Idempotency guard: stock should be restored only once when cancelling.
    stockRestoredOnCancel: { type: Boolean, default: false },

    // Prescription info (only relevant if any item requiresPrescription=true)
    prescription: { type: PrescriptionSchema, default: () => ({ status: 'not_required' }) },

    // -----------------------------
    // Delivery Management (Phase 9+)
    // -----------------------------
    // Delivery tracking is intentionally separate from order.status so we can represent
    // real-world delivery states (assigned/out_for_delivery/etc.) without breaking the
    // existing fulfillment pipeline.
    delivery: {
      status: {
        type: String,
        default: 'pending_rider',
        enum: ['pending_rider', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'returned'],
        index: true,
      },
      riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryRider', default: null },
      riderName: { type: String, default: '' },
      riderPhone: { type: String, default: '' },
      etaMinutes: { type: Number, default: null, min: 0 },
      note: { type: String, default: '', trim: true },
      history: {
        type: [
          {
            status: {
              type: String,
              enum: ['pending_rider', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'returned'],
              required: true,
            },
            at: { type: Date, required: true },
            byUid: { type: String, default: '' },
            note: { type: String, default: '', trim: true },
          },
        ],
        default: () => [],
      },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export const PharmacyOrder = mongoose.model('PharmacyOrder', PharmacyOrderSchema);
