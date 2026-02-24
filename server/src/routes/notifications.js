/**
 * Backend route: notifications
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the notifications feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Notification } from '../models/Notification.js';
import { getIO } from '../realtime/ioRef.js';

const router = express.Router();

// GET /api/notifications/unread-count
// Lightweight endpoint used for navbar badges.
router.get('/unread-count', requireFirebaseAuth, requireRole(['user', 'pharmacy', 'doctor', 'admin']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const count = await Notification.countDocuments({ targetUid: uid, isRead: false });
    res.json({ count });
  } catch (e) {
    console.error('Failed to count unread notifications:', e);
    res.status(500).json({ error: 'Failed to count unread notifications' });
  }
});

// GET /api/notifications?unread=1&limit=50
router.get('/', requireFirebaseAuth, requireRole(['user', 'pharmacy', 'doctor', 'admin']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const unread = String(req.query?.unread || '').trim();
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 50)));

    const filter = { targetUid: uid };
    if (unread === '1' || unread.toLowerCase() === 'true') filter.isRead = false;

    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ items: items.map((n) => ({ id: String(n._id), ...n })) });
  } catch (e) {
    console.error('Failed to list notifications:', e);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireFirebaseAuth, requireRole(['user', 'pharmacy', 'doctor', 'admin']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const updated = await Notification.findOneAndUpdate(
      { _id: id, targetUid: uid },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Not found' });

    // Realtime badge update (best effort)
    try {
      const io = getIO();
      if (io) {
        const count = await Notification.countDocuments({ targetUid: uid, isRead: false });
        io.to(`uid:${uid}`).emit('notification:unreadCount', { count });
      }
    } catch {
      // ignore
    }

    res.json({ id: String(updated._id), ...updated });
  } catch (e) {
    console.error('Failed to mark notification read:', e);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', requireFirebaseAuth, requireRole(['user', 'pharmacy', 'doctor', 'admin']), async (req, res) => {
  try {
    const uid = req.user.uid;
    await Notification.updateMany({ targetUid: uid, isRead: false }, { $set: { isRead: true, readAt: new Date() } });

    try {
      const io = getIO();
      if (io) io.to(`uid:${uid}`).emit('notification:unreadCount', { count: 0 });
    } catch {
      // ignore
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to mark all read:', e);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', requireFirebaseAuth, requireRole(['user', 'pharmacy', 'doctor', 'admin']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const d = await Notification.deleteOne({ _id: id, targetUid: uid });
    if (d.deletedCount !== 1) return res.status(404).json({ error: 'Not found' });

    try {
      const io = getIO();
      if (io) {
        const count = await Notification.countDocuments({ targetUid: uid, isRead: false });
        io.to(`uid:${uid}`).emit('notification:unreadCount', { count });
      }
    } catch {
      // ignore
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete notification:', e);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
