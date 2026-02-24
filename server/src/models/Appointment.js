/**
 * Backend data layer: Appointment
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    // Snapshot of the patient profile at the time of request (best-effort).
    // Source of truth remains Firestore users/{uid}.
    patientName: { type: String, default: '' },
    patientEmail: { type: String, default: '' },
    // Firebase UID of the doctor (from Firestore users/{uid})
    doctorUid: { type: String, default: '', index: true },
    doctorName: { type: String, default: '' },
    doctorEmail: { type: String, default: '' },
    department: { type: String, default: '' },
    location: { type: String, default: '' },
    datetime: { type: Date, required: true },
    type: { type: String, enum: ['in-person', 'video', 'phone'], default: 'in-person' },
    // Appointment lifecycle:
    // - pending: request created by patient, waiting for doctor approval
    // - scheduled: doctor accepted and time slot confirmed
    // - rejected: doctor rejected the request
    // - cancelled: cancelled by patient (or future doctor/admin tooling)
    // - completed: completed appointment (future doctor tooling)
    status: { type: String, enum: ['pending', 'scheduled', 'rejected', 'completed', 'cancelled'], default: 'pending' },
    notes: { type: String, default: '' },
    // Decision metadata (set by doctor)
    decisionAt: { type: Date, default: null },
    decisionBy: { type: String, default: '' },
    decisionReason: { type: String, default: '' },

    // Once accepted, messaging between patient and doctor can be enabled.
    // (Phase 1: gating only; chat system will be implemented in future.)
    messagingEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Appointment = mongoose.model('Appointment', AppointmentSchema);
