/**
 * Backend route: pharmacySettings
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the pharmacySettings feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { PharmacySettings } from '../models/PharmacySettings.js';

const router = express.Router();

router.use(requireFirebaseAuth, requireRole('pharmacy'));

function getBucket(req) {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  return new GridFSBucket(db, { bucketName: 'pharmacy_license_docs' });
}

async function getOrCreateSettings(pharmacyUid) {
  let doc = await PharmacySettings.findOne({ pharmacyUid });
  if (!doc) {
    doc = await PharmacySettings.create({ pharmacyUid });
  }
  return doc;
}

// GET current pharmacy settings
router.get('/', async (req, res) => {
  try {
    const pharmacyUid = req.user?.uid;
    const doc = await getOrCreateSettings(pharmacyUid);
    res.json(doc);
  } catch (err) {
    console.error('Failed to load pharmacy settings:', err);
    res.status(500).json({ message: 'Failed to load settings' });
  }
});

// PUT update pharmacy settings (profile + delivery)
router.put('/', async (req, res) => {
  try {
    const pharmacyUid = req.user?.uid;
    const payload = req.body || {};

    const allowed = {
      profile: payload.profile,
      delivery: payload.delivery,
    };

    const updated = await PharmacySettings.findOneAndUpdate(
      { pharmacyUid },
      { $set: allowed },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Failed to update pharmacy settings:', err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Upload license document
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/license-document', upload.single('file'), async (req, res) => {
  try {
    const pharmacyUid = req.user?.uid;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const bucket = getBucket(req);
    const filename = `${pharmacyUid}-${Date.now()}-${req.file.originalname}`;

    // Remove old file if present
    const settings = await getOrCreateSettings(pharmacyUid);
    if (settings.compliance?.licenseDocumentFileId) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(settings.compliance.licenseDocumentFileId));
      } catch {
        // ignore
      }
    }

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        pharmacyUid,
        mimeType: req.file.mimetype,
        originalname: req.file.originalname,
      },
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      const updated = await PharmacySettings.findOneAndUpdate(
        { pharmacyUid },
        {
          $set: {
            'compliance.verificationStatus': 'pending',
            'compliance.licenseDocumentFileId': uploadStream.id,
            'compliance.licenseDocumentFilename': filename,
            'compliance.lastReviewedAt': null,
            'compliance.reviewerNote': '',
          },
        },
        { new: true, upsert: true }
      );
      res.json({ ok: true, settings: updated });
    });

    uploadStream.on('error', (e) => {
      console.error('License doc upload error:', e);
      res.status(500).json({ message: 'Failed to upload license document' });
    });
  } catch (err) {
    console.error('Failed to upload license document:', err);
    res.status(500).json({ message: 'Failed to upload license document' });
  }
});

// Download license document
router.get('/license-document', async (req, res) => {
  try {
    const pharmacyUid = req.user?.uid;
    const settings = await getOrCreateSettings(pharmacyUid);
    const fileId = settings.compliance?.licenseDocumentFileId;
    if (!fileId) return res.status(404).json({ message: 'No license document found' });

    const bucket = getBucket(req);
    const id = new mongoose.Types.ObjectId(fileId);

    const files = await bucket.find({ _id: id }).toArray();
    if (!files.length) return res.status(404).json({ message: 'File not found' });
    const file = files[0];
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    bucket.openDownloadStream(id).pipe(res);
  } catch (err) {
    console.error('Failed to download license document:', err);
    res.status(500).json({ message: 'Failed to download license document' });
  }
});

export default router;
