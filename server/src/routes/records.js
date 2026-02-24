/**
 * Backend route: records
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the records feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

// Backward-compatible alias route.
// The primary implementation is now /api/medical-records.

import express from 'express';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { MedicalRecord } from '../models/MedicalRecord.js';

const router = express.Router();

// GET /api/records -> list medical record metadata
router.get('/', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const items = await MedicalRecord.find({ userUid: req.user.uid }).sort({ uploadedAt: -1 }).lean();
  res.json(items);
});

export default router;
