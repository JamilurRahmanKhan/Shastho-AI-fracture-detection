/**
 * Backend data layer: DoctorAvailability
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

// Doctor availability settings are stored in MongoDB.
// This enables future slot generation + booking validation.

const BreakSchema = new mongoose.Schema(
  {
    start: { type: String, default: '13:00' },
    end: { type: String, default: '14:00' },
  },
  { _id: false }
);

const DaySchema = new mongoose.Schema(
  {
    available: { type: Boolean, default: true },
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    breaks: { type: [BreakSchema], default: [] },
  },
  { _id: false }
);

const WeeklySchema = new mongoose.Schema(
  {
    Monday: { type: DaySchema, default: () => ({}) },
    Tuesday: { type: DaySchema, default: () => ({}) },
    Wednesday: { type: DaySchema, default: () => ({}) },
    Thursday: { type: DaySchema, default: () => ({}) },
    Friday: { type: DaySchema, default: () => ({}) },
    Saturday: { type: DaySchema, default: () => ({ available: false, start: '10:00', end: '14:00', breaks: [] }) },
    Sunday: { type: DaySchema, default: () => ({ available: false, start: '10:00', end: '14:00', breaks: [] }) },
  },
  { _id: false }
);

const SlotRulesSchema = new mongoose.Schema(
  {
    duration: { type: Number, default: 30 },
    buffer: { type: Number, default: 10 },
    maxPerDay: { type: Number, default: 10 },
    bookingNotice: { type: Number, default: 24 },
    cancellationHours: { type: Number, default: 4 },
  },
  { _id: false }
);

const TimeOffSchema = new mongoose.Schema(
  {
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    reason: { type: String, default: '' },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const DoctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorUid: { type: String, required: true, unique: true, index: true },
    timezone: { type: String, default: 'local' },
    weekly: { type: WeeklySchema, default: () => ({}) },
    slotRules: { type: SlotRulesSchema, default: () => ({}) },
    timeOff: { type: [TimeOffSchema], default: [] },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export const DoctorAvailability = mongoose.model('DoctorAvailability', DoctorAvailabilitySchema);
