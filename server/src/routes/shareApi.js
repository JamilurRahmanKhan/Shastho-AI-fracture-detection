/**
 * Backend route: shareApi
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the shareApi feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';
import { ReportShareLink } from '../models/ReportShareLink.js';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// POST /api/share/revoke/:token
router.post('/revoke/:token', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const token = String(req.params.token || '').trim();
    if (!token) return res.status(400).json({ error: 'token required' });

    const link = await ReportShareLink.findOne({ token }).lean();
    if (!link) return res.status(404).json({ error: 'Not found' });
    if (link.userUid !== userUid) return res.status(403).json({ error: 'Forbidden' });

    await ReportShareLink.updateOne({ token }, { $set: { revokedAt: new Date() } });
    res.json({ ok: true });
  } catch (e) {
    console.error('shareApi revoke failed:', e);
    res.status(500).json({ error: 'Failed to revoke link' });
  }
});

export default router;
