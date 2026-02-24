/**
 * Backend data layer: MedicalRecord
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Database models/schemas and DB helpers for MongoDB/Firestore integrations.
 *
 * Project-specific notes:
 * - (none)
 */

import mongoose from 'mongoose';

/**
 * MedicalRecord
 *
 * Stores metadata for user-uploaded medical documents.
 * The binary file is stored in MongoDB GridFS.
 */
const MedicalRecordSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },

    // GridFS file id
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    // Original file metadata
    filename: { type: String, required: true }, // original name
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    // User-provided metadata
    title: { type: String, required: true },
    recordType: { type: String, default: '' }, // e.g. "Lab Report", "Prescription"
    recordDate: { type: Date, required: true },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },

    // Useful for filtering and audit
    uploadedAt: { type: Date, default: () => new Date() },
    checksumSha256: { type: String, default: '' },
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ userUid: 1, uploadedAt: -1 });
MedicalRecordSchema.index({ userUid: 1, recordDate: -1 });

export const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);
