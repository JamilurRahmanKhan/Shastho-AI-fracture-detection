/**
 * Backend route: availability
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the availability feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { DoctorAvailability } from '../models/DoctorAvailability.js';

const router = express.Router();

function isValidTimeZone(tz) {
  if (!tz) return false;
  if (tz === "local") return true;
  try {
    // Throws RangeError for invalid IANA tz
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function sanitizeTimeZone(tz) {
  const val = String(tz || "").trim();
  if (!val) return "local";
  return isValidTimeZone(val) ? val : "local";
}


function clampTimeOff(startAt, endAt) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  if (e.getTime() <= s.getTime()) return null;
  return { startAt: s, endAt: e };
}

async function getOrCreate(uid) {
  const existing = await DoctorAvailability.findOne({ doctorUid: uid });
  if (existing) return existing;
  return await DoctorAvailability.create({ doctorUid: uid, timezone: 'local' });
}

// Doctor: get my availability settings
router.get('/me', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const doc = await getOrCreate(req.user.uid);
    const tz = sanitizeTimeZone(doc.timezone);
    if (doc.timezone !== tz) {
      doc.timezone = tz;
      doc.updatedAt = new Date();
      await doc.save();
    }
    res.json(doc);
  } catch (e) {
    console.error('Failed to get availability:', e);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

// Doctor: update my availability settings (full document)
router.put('/me', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const doc = await getOrCreate(req.user.uid);
    const body = req.body || {};

    if (body.weekly) doc.weekly = body.weekly;
    if (body.slotRules) doc.slotRules = body.slotRules;
    if (Array.isArray(body.timeOff)) {
      // Validate timeOff array entries
      const cleaned = [];
      for (const item of body.timeOff) {
        const ok = clampTimeOff(item?.startAt, item?.endAt);
        if (!ok) continue;
        cleaned.push({ ...ok, reason: (item?.reason || '').toString() });
      }
      doc.timeOff = cleaned;
    }
    if (body.timezone !== undefined) doc.timezone = sanitizeTimeZone(body.timezone);
    doc.updatedAt = new Date();

    await doc.save();
    res.json(doc);
  } catch (e) {
    console.error('Failed to update availability:', e);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Doctor: add a time-off block (used by calendar "Block time")
router.post('/me/timeoff', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const ok = clampTimeOff(req.body?.startAt, req.body?.endAt);
    if (!ok) return res.status(400).json({ error: 'Invalid startAt/endAt' });
    const reason = (req.body?.reason || '').toString();

    const doc = await getOrCreate(req.user.uid);
    doc.timeOff.push({ ...ok, reason });
    doc.updatedAt = new Date();
    await doc.save();
    res.json({ ok: true, timeOff: doc.timeOff });
  } catch (e) {
    console.error('Failed to add time off:', e);
    res.status(500).json({ error: 'Failed to add time off' });
  }
});

// Doctor: remove a time-off block
router.delete('/me/timeoff/:id', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const doc = await getOrCreate(req.user.uid);
    const before = doc.timeOff.length;
    doc.timeOff = doc.timeOff.filter((x) => String(x._id) !== String(req.params.id));
    const after = doc.timeOff.length;
    doc.updatedAt = new Date();
    await doc.save();
    res.json({ ok: true, removed: before !== after });
  } catch (e) {
    console.error('Failed to remove time off:', e);
    res.status(500).json({ error: 'Failed to remove time off' });
  }
});

// Public (future): get a doctor's availability by uid
router.get('/:doctorUid', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const doc = await DoctorAvailability.findOne({ doctorUid: req.params.doctorUid }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    doc.timezone = sanitizeTimeZone(doc.timezone);
    res.json(doc);
  } catch (e) {
    console.error('Failed to get doctor availability:', e);
    res.status(500).json({ error: 'Failed to get doctor availability' });
  }
});

export default router;
