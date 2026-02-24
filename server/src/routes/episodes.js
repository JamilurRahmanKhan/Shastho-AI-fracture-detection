/**
 * Backend route: episodes
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the episodes feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';

import { InjuryEpisode } from '../models/InjuryEpisode.js';
import { RehabCheckIn } from '../models/RehabCheckIn.js';
import { RehabChecklistItem } from '../models/RehabChecklistItem.js';
import { ensureDefaultEpisode, getEpisodeByIdForUser, getMostRecentOpenEpisode } from '../lib/subscriptions/episodes.js';
import { getEntitlementContext } from '../lib/subscriptions/engine.js';
// NOTE: enforce.js exports consumeCheckIn (capital I). Keep import aligned to avoid ESM named export errors.
import { isSubscriptionsEnforced, consumeCheckIn, makePaywallPayload } from '../lib/subscriptions/enforce.js';
import { generateRehabProgram } from '../lib/rehab/program.js';

const router = express.Router();

// GET /api/episodes - list episodes (user)
router.get('/', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const status = req.query.status ? String(req.query.status) : null;
    const q = { userUid };
    if (status && ['open', 'closed'].includes(status)) q.status = status;

    const items = await InjuryEpisode.find(q).sort({ createdAt: -1 }).lean();
    res.json(items.map(e => ({ ...e, id: String(e._id) })));
  } catch (e) {
    console.error('episodes list failed:', e);
    res.status(500).json({ error: 'Failed to list episodes' });
  }
});

// GET /api/episodes/default - return most recent open episode, create if missing
router.get('/default', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const existing = await getMostRecentOpenEpisode(userUid);
    if (existing) return res.json(existing);

    const created = await ensureDefaultEpisode(userUid);
    return res.json(created);
  } catch (e) {
    console.error('episodes/default failed:', e);
    res.status(500).json({ error: 'Failed to load default episode' });
  }
});

// POST /api/episodes - create a new open episode
router.post('/', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const meta = req.body?.meta && typeof req.body.meta === 'object' ? req.body.meta : null;

    const created = await InjuryEpisode.create({
      userUid,
      title: title || 'Injury Episode',
      status: 'open',
      ...(meta ? { meta } : {}),
    });

    res.json({
      id: created._id,
      title: created.title,
      status: created.status,
      meta: created.meta,
      createdAt: created.createdAt,
    });
  } catch (e) {
    console.error('episodes create failed:', e);
    res.status(500).json({ error: 'Failed to create episode' });
  }
});

// GET /api/episodes/:id - get single episode
router.get('/:id', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const episodeId = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(episodeId)) {
      return res.status(400).json({ error: 'Invalid episode id' });
    }

    const ep = await getEpisodeByIdForUser(userUid, episodeId);
    if (!ep) return res.status(404).json({ error: 'Not found' });
    return res.json(ep);
  } catch (e) {
    console.error('episodes get failed:', e);
    res.status(500).json({ error: 'Failed to load episode' });
  }
});

// POST /api/episodes/:id/close - close episode
router.post('/:id/close', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const episodeId = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(episodeId)) {
      return res.status(400).json({ error: 'Invalid episode id' });
    }

    const ep = await InjuryEpisode.findOneAndUpdate(
      { _id: episodeId, userUid },
      { $set: { status: 'closed', closedAt: new Date() } },
      { new: true }
    ).lean();

    if (!ep) return res.status(404).json({ error: 'Not found' });
    return res.json(ep);
  } catch (e) {
    console.error('episodes close failed:', e);
    res.status(500).json({ error: 'Failed to close episode' });
  }
});


// Rehab program (episode-based)
router.get('/:id/rehab', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const episodeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(episodeId)) return res.status(400).json({ error: 'Invalid episode id' });

    const episode = await InjuryEpisode.findOne({ _id: episodeId, userUid }).lean();
    if (!episode) return res.status(404).json({ error: 'Episode not found' });

    const snapshot = await getEntitlementContext({ userUid, episodeId });
    const now = new Date();
    const active = Boolean(snapshot?.window?.endAt ? new Date(snapshot.window.endAt) > now : (snapshot?.sourceType === 'PACK'));

    // Pick program duration based on plan/trial code. Trial uses 6-week timeline as per spec.
    let durationDays = 42;
    if (snapshot?.sourceType === 'PLAN') {
      if (snapshot.code === 'ACCIDENT_PASS_7D') durationDays = 7;
      if (snapshot.code === 'RECOVERY_6W') durationDays = 42;
      if (snapshot.code === 'RECOVERY_PLUS_12W') durationDays = 84;
    }

    const program = generateRehabProgram({ durationDays });

    const checkins = await RehabCheckIn.find({ userUid, episodeId }).sort({ createdAt: -1 }).limit(120).lean();
    const checklist = await RehabChecklistItem.find({ userUid, episodeId }).lean();

    const canCheckIn = isSubscriptionsEnforced() ? (active && Number(snapshot?.remaining?.checkinsCap || 0) > 0) : true;
    // Checklist edits are locked in FREE_BASE; allowed only when trial/plan is active.
    const canEditChecklist = isSubscriptionsEnforced() ? (active && (snapshot?.sourceType === 'PLAN' || snapshot?.sourceType === 'TRIAL')) : true;

    return res.json({
      episode: { id: episode._id, title: episode.title, status: episode.status },
      snapshot,
      program,
      checkins,
      checklist,
      canCheckIn,
      canEditChecklist,
    });
  } catch (e) {
    console.error('rehab get failed:', e);
    return res.status(500).json({ error: 'Failed to load rehab program' });
  }
});

router.get('/:id/rehab/checkins', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const userUid = req.user.uid;
  const episodeId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(episodeId)) return res.status(400).json({ error: 'Invalid episode id' });
  const episode = await InjuryEpisode.findOne({ _id: episodeId, userUid }).lean();
  if (!episode) return res.status(404).json({ error: 'Episode not found' });
  const items = await RehabCheckIn.find({ userUid, episodeId }).sort({ createdAt: -1 }).limit(180).lean();
  return res.json(items.map(e => ({ ...e, id: String(e._id) })));
});

router.post('/:id/rehab/checkins', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const episodeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(episodeId)) return res.status(400).json({ error: 'Invalid episode id' });
    const episode = await InjuryEpisode.findOne({ _id: episodeId, userUid }).lean();
    if (!episode) return res.status(404).json({ error: 'Episode not found' });

    if (isSubscriptionsEnforced()) {
      const consumed = await consumeCheckIn({ userUid, episodeId: String(episodeId), ip: req.ip, note: 'Rehab check-in' });
      if (!consumed) {
        return res.status(402).json(
          makePaywallPayload({
            actionType: 'CHECKIN',
            message: 'No check-in quota available. Upgrade your plan to continue tracking your recovery.',
            episodeId: String(episodeId),
          })
        );
      }
    }

    const { pain = null, swelling = null, mobility = null, redFlags = {}, notes = '' } = req.body || {};
    const dateKey = typeof req.body?.dateKey === 'string' ? req.body.dateKey : null;

    // Upsert by dateKey when provided (helps enforce 1/day UI). Otherwise append.
    if (dateKey) {
      const up = await RehabCheckIn.findOneAndUpdate(
        { userUid, episodeId, dateKey },
        { $set: { pain, swelling, mobility, redFlags, notes, createdAt: new Date() } },
        { upsert: true, new: true }
      ).lean();
      return res.json(up);
    }

    const doc = await RehabCheckIn.create({ userUid, episodeId, pain, swelling, mobility, redFlags, notes });
    return res.json(doc);
  } catch (e) {
    console.error('rehab checkin failed:', e);
    return res.status(500).json({ error: 'Failed to save check-in' });
  }
});

router.get('/:id/rehab/checklist', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const userUid = req.user.uid;
  const episodeId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(episodeId)) return res.status(400).json({ error: 'Invalid episode id' });
  const episode = await InjuryEpisode.findOne({ _id: episodeId, userUid }).lean();
  if (!episode) return res.status(404).json({ error: 'Episode not found' });
  const items = await RehabChecklistItem.find({ userUid, episodeId }).lean();
  return res.json(items.map(e => ({ ...e, id: String(e._id) })));
});

router.post('/:id/rehab/checklist/toggle', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const episodeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(episodeId)) return res.status(400).json({ error: 'Invalid episode id' });
    const episode = await InjuryEpisode.findOne({ _id: episodeId, userUid }).lean();
    if (!episode) return res.status(404).json({ error: 'Episode not found' });

    const taskKey = String(req.body?.taskKey || '').trim();
    if (!taskKey) return res.status(400).json({ error: 'Missing taskKey' });

    if (isSubscriptionsEnforced()) {
      const snapshot = await getEntitlementContext({ userUid, episodeId });
      const now = new Date();
      const active = Boolean(snapshot?.window?.endAt ? new Date(snapshot.window.endAt) > now : (snapshot?.sourceType === 'PACK'));
      const allowed = active && (snapshot?.sourceType === 'PLAN' || snapshot?.sourceType === 'TRIAL');
      if (!allowed) {
        return res.status(402).json(
          makePaywallPayload({
            actionType: 'CHECKIN',
            message: 'Rehab checklist editing is locked in FREE mode. Upgrade a plan to continue.',
            episodeId: String(episodeId),
          })
        );
      }
    }

    const existing = await RehabChecklistItem.findOne({ userUid, episodeId, taskKey }).lean();
    if (!existing) {
      const created = await RehabChecklistItem.create({ userUid, episodeId, taskKey, status: 'done', doneAt: new Date() });
      return res.json(created);
    }

    const nextStatus = existing.status === 'done' ? 'skipped' : 'done';
    const updated = await RehabChecklistItem.findOneAndUpdate(
      { _id: existing._id },
      { $set: { status: nextStatus, doneAt: new Date() } },
      { new: true }
    ).lean();

    return res.json(updated);
  } catch (e) {
    console.error('rehab checklist toggle failed:', e);
    return res.status(500).json({ error: 'Failed to update checklist' });
  }
});

export default router;
