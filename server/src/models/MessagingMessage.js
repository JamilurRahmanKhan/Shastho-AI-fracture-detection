/**
 * Backend data layer: MessagingMessage
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Messages inside a MessagingThread.

const MessagingMessageSchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MessagingThread',
      required: true,
      index: true,
    },

    senderUid: { type: String, required: true, index: true },
    senderRole: { type: String, default: '' },

    // Message kind:
    // - text: normal chat (text + optional attachments)
    // - call: video call log entry (Messenger-like)
    kind: { type: String, enum: ['text', 'call'], default: 'text', index: true },

    // Call metadata (only for kind="call")
    call: {
      type: {
        callId: { type: String, default: '' },
        status: {
          type: String,
          enum: ['completed', 'missed', 'rejected', 'cancelled'],
          default: 'completed',
        },
        startedAt: { type: Date, default: null },
        endedAt: { type: Date, default: null },
        durationSec: { type: Number, default: 0 },
      },
      default: null,
    },

    // Client-generated id to make sending idempotent (prevents duplicate messages on retries)
    // Optional; only present for newer clients. Kept sparse/unique per-thread.
    clientMessageId: { type: String, index: true },

    // Text is optional if attachments are present
    text: { type: String, default: '' },

    // Attachments (images, videos, documents)
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          name: { type: String, default: '' },
          mime: { type: String, default: '' },
          size: { type: Number, default: 0 },
        },
      ],
      default: [],
    },

    // "Unsend" / delete for everyone (keeps record but removes content)
    deletedForAll: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedByUid: { type: String, default: '' },
  },
  { timestamps: true }
);

MessagingMessageSchema.index({ threadId: 1, createdAt: 1 });
// Idempotency: allow empty clientMessageId for older clients, but ensure uniqueness when present
MessagingMessageSchema.index({ threadId: 1, clientMessageId: 1 }, { unique: true, sparse: true });

export const MessagingMessage = mongoose.model('MessagingMessage', MessagingMessageSchema);
