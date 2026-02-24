/**
 * Backend data layer: MessagingThread
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Doctor <-> User messaging thread (real-time chat)
// Design: ONE thread per doctor<->user pair.
// We keep appointmentId as a convenience pointer to the latest accepted appointment,
// but the thread is NOT created per appointment.

const MessagingThreadSchema = new mongoose.Schema(
  {
    // Pointer to the most recent accepted appointment (for deep-links from appointment screens).
    // NOTE: The actual uniqueness is (userUid, doctorUid).
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },

    // Stable key for deduplication + migrations.
    pairKey: { type: String, required: true, index: true },

    userUid: { type: String, required: true, index: true },
    doctorUid: { type: String, required: true, index: true },

    // Snapshots for UI convenience (source of truth remains Firestore)
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    doctorEmail: { type: String, default: '' },

    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null, index: true },

    unreadByUser: { type: Number, default: 0 },
    unreadByDoctor: { type: Number, default: 0 },

    // Soft-delete (hide) conversation for a participant.
    // If the other participant sends a new message, the thread reappears.
    deletedFor: {
      type: [
        {
          uid: { type: String, required: true },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

MessagingThreadSchema.index({ userUid: 1, lastMessageAt: -1 });
MessagingThreadSchema.index({ doctorUid: 1, lastMessageAt: -1 });
MessagingThreadSchema.index({ pairKey: 1, lastMessageAt: -1 });

export const MessagingThread = mongoose.model('MessagingThread', MessagingThreadSchema);
