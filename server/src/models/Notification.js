/**
 * Backend data layer: Notification
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// In-app notifications (Phase 9)
// Used for user/pharmacy/admin visibility even when email is not configured.
// Keep schema intentionally simple + extensible.

const NotificationSchema = new mongoose.Schema(
  {
    // The Firebase uid of the recipient.
    targetUid: { type: String, required: true, index: true },

    // Helpful for filtering in UI (user/pharmacy/admin/doctor)
    targetRole: { type: String, default: '', index: true },

    // e.g. store_order_placed, store_order_status, rx_status
    type: { type: String, required: true, index: true },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // Optional deep-link + structured payload
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ targetUid: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
