/**
 * Backend data layer: Medication
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

const MedicationSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    name: { type: String, required: true },
    dosage: { type: String, default: '' },
    // Legacy field used by older UI. Kept for backward compatibility.
    frequency: { type: String, default: '' },

    // Medication scheduling (industry-style)
    // Human-friendly label (optional)
    schedule: { type: String, default: '' },

    // Scheduling mode:
    //  - interval: take a dose every N minutes (with optional daily cap)
    //  - fixed_times: take at explicit times of day (HH:mm)
    scheduleType: { type: String, enum: ['interval', 'fixed_times', 'prn'], default: 'interval' },

    // Max dose events allowed per day (counts both taken & skipped as scheduled events).
    // For example: 3x/day.
    timesPerDay: { type: Number, default: 1, min: 1, max: 1440 },

    // Minimum minutes between dose events (only for scheduleType=interval).
    // Example: 480 => every 8 hours.
    intervalMinutes: { type: Number, default: null, min: 1, max: 10080 },

    // Preferred times of day (HH:mm) used by scheduleType=fixed_times.
    // Example: ["08:00", "20:00"]
    times: { type: [String], default: [] },

    // User timezone info. We store both:
    // - timezone: optional IANA name (future DST-aware upgrades)
    // - timezoneOffsetMinutes: numeric offset (minutes) from Date.getTimezoneOffset()
    timezone: { type: String, default: 'UTC' },
    timezoneOffsetMinutes: { type: Number, default: 0, min: -840, max: 840 },

    // Next time a dose is allowed/expected (server-managed).
    nextDueAt: { type: Date, default: null },

    // Atomic daily safety cap counters (server-managed).
    // We store these at the document root so we can use optimistic concurrency
    // checks without complex array queries.
    doseCounterDayKey: { type: String, default: '' },
    doseCounterCount: { type: Number, default: 0, min: 0, max: 5000 },

    prescribedBy: { type: String, default: '' },
    instructions: { type: String, default: '' },
    sideEffects: { type: [String], default: [] },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },

    // Optional adherence log entries.
    // This supports "Mark taken" / "Skip" actions in the UI.
    adherence: {
      type: [
        {
          at: { type: Date, required: true },
          // Optional: the scheduled slot this log belongs to (prevents double logging).
          slotKey: { type: String, default: '' },
          // Optional: UTC timestamp the dose was scheduled for.
          scheduledFor: { type: Date, default: null },
          status: { type: String, enum: ['taken', 'skipped'], required: true },
          note: { type: String, default: '' },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Medication = mongoose.model('Medication', MedicationSchema);
