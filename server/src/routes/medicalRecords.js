/**
 * Backend route: medicalRecords
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the medicalRecords feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import mongoose from 'mongoose';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { isSubscriptionsEnforced, getRecordsCapForUser, makePaywallPayload } from '../lib/subscriptions/enforce.js';

// We rely on the mongodb driver installed alongside mongoose.
import { GridFSBucket } from 'mongodb';

const router = express.Router();

// Memory storage is enough for common medical PDFs/images.
// Keep a tight limit to avoid server memory pressure.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const allowed = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Only PDF/JPEG/PNG/WEBP files are allowed'));
    }
    return cb(null, true);
  },
});

function getBucket() {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('MongoDB not connected');
  return new GridFSBucket(db, { bucketName: 'medical_records' });
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  // allow comma-separated string
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * POST /api/medical-records
 * multipart/form-data:
 *   file: <binary>
 *   title: string
 *   recordDate: ISO string or yyyy-mm-dd
 *   recordType?: string
 *   description?: string
 *   tags?: string (comma separated) OR tags[]
 */
router.post('/', requireFirebaseAuth, requireRole(['user']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file' });

    const title = String(req.body?.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });

    const recordDate = parseDate(req.body?.recordDate);
    if (!recordDate) return res.status(400).json({ error: 'recordDate is required' });

    const recordType = String(req.body?.recordType || req.body?.type || '').trim();
    const description = String(req.body?.description || '').trim();
    const tags = normalizeTags(req.body?.tags ?? req.body?.['tags[]']);

    // Subscription enforcement (additive, gated by env).
    // Records are globally capped per user (soft-lock: existing records remain viewable).
    if (isSubscriptionsEnforced()) {
      const { cap } = await getRecordsCapForUser({ userUid: req.user.uid });
      if (cap !== Infinity) {
        const current = await MedicalRecord.countDocuments({ userUid: req.user.uid });
        if (current >= cap) {
          return res
            .status(402)
            .json(
              makePaywallPayload({
                actionType: 'RECORD_UPLOAD',
                message: `Medical records limit reached (${cap}). Delete records or upgrade to upload more.`,
                episodeId: null,
                sourceHint: 'PLAN/TRIAL/FREE_BASE',
              })
            );
        }
      }
    }

    // sha256 checksum for dedupe/debug (not used as a unique key)
    const checksumSha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    const bucket = getBucket();
    const safeName = req.file.originalname?.replace(/[\r\n]/g, ' ').slice(0, 240) || 'record';

    const uploadStream = bucket.openUploadStream(safeName, {
      contentType: req.file.mimetype,
      metadata: {
        userUid: req.user.uid,
        originalName: req.file.originalname,
      },
    });

    uploadStream.end(req.file.buffer);

    const fileId = await new Promise((resolve, reject) => {
      uploadStream.on('finish', () => resolve(uploadStream.id));
      uploadStream.on('error', reject);
    });

    const doc = await MedicalRecord.create({
      userUid: req.user.uid,
      fileId,
      filename: safeName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      title,
      recordType,
      recordDate,
      description,
      tags,
      uploadedAt: new Date(),
      checksumSha256,
    });

    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: 'Upload failed', details: err?.message || String(err) });
  }
});

// GET /api/medical-records
router.get('/', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const items = await MedicalRecord.find({ userUid: req.user.uid })
    .sort({ uploadedAt: -1 })
    .lean();
  return res.json(items);
});

// PATCH /api/medical-records/:id (metadata only)
router.patch('/:id', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const doc = await MedicalRecord.findOne({ _id: req.params.id, userUid: req.user.uid });
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const up = {};
  if (req.body?.title !== undefined) up.title = String(req.body.title).trim();
  if (req.body?.recordType !== undefined) up.recordType = String(req.body.recordType).trim();
  if (req.body?.description !== undefined) up.description = String(req.body.description).trim();
  if (req.body?.recordDate !== undefined) {
    const d = parseDate(req.body.recordDate);
    if (!d) return res.status(400).json({ error: 'recordDate is invalid' });
    up.recordDate = d;
  }
  if (req.body?.tags !== undefined) up.tags = normalizeTags(req.body.tags);

  Object.assign(doc, up);
  await doc.save();
  return res.json(doc);
});

// GET /api/medical-records/:id/download
router.get('/:id/download', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const doc = await MedicalRecord.findOne({ _id: req.params.id, userUid: req.user.uid }).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const bucket = getBucket();
  const inline = String(req.query.inline || '') === '1';

  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(doc.filename)}"`
  );

  const downloadStream = bucket.openDownloadStream(doc.fileId);
  downloadStream.on('error', (err) => {
    res.status(404).json({ error: 'File not found', details: err?.message || String(err) });
  });
  downloadStream.pipe(res);
});

// DELETE /api/medical-records/:id
router.delete('/:id', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const doc = await MedicalRecord.findOne({ _id: req.params.id, userUid: req.user.uid });
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const bucket = getBucket();
  try {
    await bucket.delete(doc.fileId);
  } catch {
    // If the file was already deleted, still remove metadata.
  }

  await MedicalRecord.deleteOne({ _id: doc._id, userUid: req.user.uid });
  return res.json({ deleted: true });
});

export default router;
