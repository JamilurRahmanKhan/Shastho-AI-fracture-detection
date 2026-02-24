/**
 * Backend data layer: Presence
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Online presence + last seen tracking (industry-standard behavior)
// - "online" reflects whether the user has any active Socket.IO connections
// - "lastSeenAt" updates when the user goes offline

const PresenceSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    role: { type: String, default: '' },
    online: { type: Boolean, default: false, index: true },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Presence = mongoose.model('Presence', PresenceSchema);
