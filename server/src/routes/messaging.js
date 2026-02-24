/**
 * Backend route: messaging
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the messaging feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Appointment } from '../models/Appointment.js';
import { MessagingThread } from '../models/MessagingThread.js';
import { MessagingMessage } from '../models/MessagingMessage.js';
import { Presence } from '../models/Presence.js';
import { createNotification } from '../lib/notifications.js';
import { ensurePairThreadFromAppointment, makePairKey, consolidatePairThreads } from '../lib/messagingThreads.js';

const router = express.Router();

// ------------------------------
// Uploads (images, videos, files)
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

function sanitizeFilename(name) {
  return String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = sanitizeFilename(path.basename(file.originalname || 'file', ext));
    const unique = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    cb(null, `${base}_${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    // 50MB per file (enough for short consultation videos/images/docs in dev)
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    // Block executables for safety
    const blocked = ['application/x-msdownload', 'application/x-msdos-program'];
    if (blocked.includes(file.mimetype)) {
      const err = new Error('This file type is not allowed.');
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

function safeText(s) {
  return (s ?? '').toString();
}

function snippet(text, n = 120) {
  const t = safeText(text).trim();
  if (!t) return '';
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

function snippetForMessage(text, attachments = []) {
  const t = safeText(text).trim();
  if (t) return snippet(t, 120);
  if (attachments.length) return `📎 ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`;
  return '';
}

async function recomputeThreadLastMessage(threadId) {
  const last = await MessagingMessage.findOne({ threadId, deletedForAll: { $ne: true } })
    .sort({ createdAt: -1 })
    .lean();
  if (!last) {
    await MessagingThread.updateOne({ _id: threadId }, { $set: { lastMessageText: '', lastMessageAt: null } });
    return;
  }
  const lastText = snippetForMessage(last.text || '', last.attachments || []);
  await MessagingThread.updateOne({ _id: threadId }, { $set: { lastMessageText: lastText, lastMessageAt: last.createdAt } });
}

async function loadThreadOr404(threadId) {
  if (!mongoose.isValidObjectId(threadId)) return null;
  return await MessagingThread.findById(threadId).lean();
}

function canAccessThread(thread, uid) {
  if (!thread) return false;
  return thread.userUid === uid || thread.doctorUid === uid;
}

function sideFor(thread, uid) {
  return thread.userUid === uid ? 'user' : 'doctor';
}

function otherParty(thread, uid) {
  if (thread.userUid === uid) {
    return { uid: thread.doctorUid, role: 'doctor', name: thread.doctorName || 'Doctor', email: thread.doctorEmail || '' };
  }
  return { uid: thread.userUid, role: 'user', name: thread.userName || 'Patient', email: thread.userEmail || '' };
}

// POST /api/messaging/threads/:threadId/uploads
// Upload attachments for a thread. Returns attachment metadata usable in message sending.
router.post(
  '/threads/:threadId/uploads',
  requireFirebaseAuth,
  requireRole(['user', 'doctor']),
  upload.array('files', 10),
  async (req, res) => {
    try {
      const uid = req.user.uid;
      const { threadId } = req.params;

      const thread = await MessagingThread.findById(threadId).lean();
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      if (!canAccessThread(thread, uid)) return res.status(403).json({ error: 'Forbidden' });

      const files = Array.isArray(req.files) ? req.files : [];
      if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

      const items = files.map((f) => ({
        url: `/uploads/${path.basename(f.path)}`,
        name: f.originalname || '',
        mime: f.mimetype || '',
        size: Number(f.size || 0),
      }));

      res.json({ items });
    } catch (e) {
      console.error('Failed to upload attachments:', e);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  }
);

// GET /api/messaging/threads
// List threads for the current user/doctor.
router.get('/threads', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const role = req.user.role;
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 50)));

    const filter = role === 'doctor' ? { doctorUid: uid } : { userUid: uid };
    // Hide threads the current user deleted
    filter.deletedFor = { $not: { $elemMatch: { uid } } };
    const items = await MessagingThread.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(limit)
      .lean();

    // Backward-compatibility: older versions created one thread per appointment.
    // We now want ONE thread per user<->doctor pair, so we consolidate duplicates here.
    const pairCounts = new Map();
    for (const t of items) {
      const key = t.pairKey || makePairKey(t.userUid, t.doctorUid);
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      if (!t.pairKey) {
        // Best-effort backfill (don't block request)
        MessagingThread.updateOne({ _id: t._id }, { $set: { pairKey: key } }).catch(() => null);
      }
    }
    for (const [key, count] of pairCounts.entries()) {
      if (count > 1) {
        const [userUid, doctorUid] = String(key).split('__');
        try {
          await consolidatePairThreads(userUid, doctorUid);
        } catch {
          // ignore
        }
      }
    }

    const refreshed = await MessagingThread.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(limit)
      .lean();

    const mapped = refreshed.map((t) => {
      const meSide = sideFor(t, uid);
      const other = otherParty(t, uid);
      const unread = meSide === 'user' ? Number(t.unreadByUser || 0) : Number(t.unreadByDoctor || 0);
      return {
        id: String(t._id),
        appointmentId: String(t.appointmentId),
        other,
        lastMessageText: t.lastMessageText || '',
        lastMessageAt: t.lastMessageAt,
        unread,
        updatedAt: t.updatedAt,
        createdAt: t.createdAt,
      };
    });

    res.json({ items: mapped });
  } catch (e) {
    console.error('Failed to list messaging threads:', e);
    res.status(500).json({ error: 'Failed to list threads' });
  }
});

// GET /api/messaging/appointments/:appointmentId/thread
// Get (or create) the messaging thread for an accepted appointment.
router.get('/appointments/:appointmentId/thread', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { appointmentId } = req.params;
    if (!mongoose.isValidObjectId(appointmentId)) return res.status(400).json({ error: 'Invalid appointmentId' });

    const appt = await Appointment.findById(appointmentId).lean();
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.userUid !== uid && appt.doctorUid !== uid) return res.status(403).json({ error: 'Forbidden' });

    const enabled = Boolean(appt.messagingEnabled) || String(appt.status || '').toLowerCase() === 'scheduled';
    if (!enabled) return res.status(403).json({ error: 'Messaging is not enabled for this appointment yet.' });

    const thread = await ensurePairThreadFromAppointment(appt);
    if (!thread) return res.status(500).json({ error: 'Failed to create thread' });
    return res.json({
      id: String(thread._id),
      appointmentId: String(thread.appointmentId),
      other: otherParty(thread, uid),
    });
  } catch (e) {
    console.error('Failed to get/create thread:', e);
    res.status(500).json({ error: 'Failed to load thread' });
  }
});

// GET /api/messaging/threads/:threadId/messages?limit=50
router.get('/threads/:threadId/messages', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { threadId } = req.params;
    const limit = Math.min(200, Math.max(1, Number(req.query?.limit || 50)));

    const thread = await loadThreadOr404(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (!canAccessThread(thread, uid)) return res.status(403).json({ error: 'Forbidden' });

    const msgs = await MessagingMessage.find({ threadId: thread._id })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    res.json({
      thread: {
        id: String(thread._id),
        appointmentId: String(thread.appointmentId),
        other: otherParty(thread, uid),
      },
      items: msgs.map((m) => ({
        id: String(m._id),
        threadId: String(m.threadId),
        senderUid: m.senderUid,
        senderRole: m.senderRole,
        kind: m.kind || 'text',
        call: m.call || null,
        deletedForAll: Boolean(m.deletedForAll),
        deletedAt: m.deletedAt || null,
        deletedByUid: m.deletedByUid || '',
        text: m.deletedForAll ? '' : (m.text || ''),
        attachments: m.deletedForAll ? [] : (m.attachments || []),
        clientMessageId: m.clientMessageId || '',
        createdAt: m.createdAt,
      })),
    });
  } catch (e) {
    console.error('Failed to list messages:', e);
    res.status(500).json({ error: 'Failed to list messages' });
  }
});

// POST /api/messaging/threads/:threadId/messages
router.post('/threads/:threadId/messages', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const role = req.user.role;
    const { threadId } = req.params;
    const text = safeText(req.body?.text).trim();
    const clientMessageId = safeText(req.body?.clientMessageId).trim();
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];

    if (!text && attachments.length === 0) return res.status(400).json({ error: 'Message text or attachments are required' });
    if (text.length > 2000) return res.status(400).json({ error: 'Message is too long (max 2000 characters).' });
    if (attachments.length > 10) return res.status(400).json({ error: 'Too many attachments (max 10).' });

    const thread = await MessagingThread.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.userUid !== uid && thread.doctorUid !== uid) return res.status(403).json({ error: 'Forbidden' });

    // IMPORTANT (Option B UX): once a thread exists, chat/calls remain available.
    // The thread itself is only created when the first appointment is accepted,
    // so we don't re-check appointment status here.

    // Idempotency: return existing message if clientMessageId already used
    if (clientMessageId) {
      const existing = await MessagingMessage.findOne({ threadId: thread._id, clientMessageId }).lean();
      if (existing) {
        return res.json({
          message: {
            id: String(existing._id),
            threadId: String(existing.threadId),
            senderUid: existing.senderUid,
            senderRole: existing.senderRole,
            kind: existing.kind || 'text',
            call: existing.call || null,
            text: existing.text || '',
            attachments: existing.attachments || [],
            clientMessageId: existing.clientMessageId || '',
            createdAt: existing.createdAt,
          },
          duplicate: true,
        });
      }
    }

    const msg = await MessagingMessage.create({
      threadId: thread._id,
      senderUid: uid,
      senderRole: role,
      kind: 'text',
      text,
      attachments,
      clientMessageId,
    });

    const now = new Date();
    const inc = role === 'doctor' ? { unreadByUser: 1 } : { unreadByDoctor: 1 };
    // If a party "deleted" the conversation, a new message should make it reappear.
    await MessagingThread.updateOne(
      { _id: thread._id },
      {
        $set: { lastMessageText: snippetForMessage(text, attachments), lastMessageAt: now },
        $inc: inc,
        $pull: { deletedFor: { uid: { $in: [thread.userUid, thread.doctorUid] } } },
      }
    );

    // Create an in-app notification for the other party
    const recipient = role === 'doctor' ? { uid: thread.userUid, role: 'user' } : { uid: thread.doctorUid, role: 'doctor' };
    try {
      await createNotification({
        targetUid: recipient.uid,
        targetRole: recipient.role,
        type: 'dm_message',
        title: 'New message',
        message: text ? (snippet(text, 120) || 'You received a new message.') : (attachments.length ? `Sent ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}` : 'You received a new message.'),
        data: { threadId: String(thread._id), appointmentId: String(thread.appointmentId) },
      });
    } catch (e) {
      console.warn('Failed to create message notification:', e?.message || e);
    }

    // Emit real-time event (best-effort)
    try {
      const io = req.app?.locals?.io;
      if (io) {
        const payload = {
          id: String(msg._id),
          threadId: String(msg.threadId),
          senderUid: msg.senderUid,
          senderRole: msg.senderRole,
          kind: msg.kind || 'text',
          call: msg.call || null,
          text: msg.text || '',
          attachments: msg.attachments || [],
          clientMessageId: msg.clientMessageId || '',
          createdAt: msg.createdAt,
        };
        io.to(`thread:${thread._id.toString()}`).emit('message:new', payload);
        io.to(`uid:${thread.userUid}`).emit('thread:update', { threadId: String(thread._id) });
        io.to(`uid:${thread.doctorUid}`).emit('thread:update', { threadId: String(thread._id) });
      }
    } catch {
      // ignore
    }

    res.json({
      message: {
        id: String(msg._id),
        threadId: String(msg.threadId),
        senderUid: msg.senderUid,
        senderRole: msg.senderRole,
        kind: msg.kind || 'text',
        call: msg.call || null,
        deletedForAll: Boolean(msg.deletedForAll),
        deletedAt: msg.deletedAt || null,
        deletedByUid: msg.deletedByUid || '',
        text: msg.text || '',
        attachments: msg.attachments || [],
        clientMessageId: msg.clientMessageId || '',
        createdAt: msg.createdAt,
      },
    });
  } catch (e) {
    console.error('Failed to send message:', e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// DELETE /api/messaging/threads/:threadId/messages/:messageId
// Unsend (delete for everyone) - only the sender can unsend their message.
router.delete('/threads/:threadId/messages/:messageId', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { threadId, messageId } = req.params;

    const thread = await MessagingThread.findById(threadId).lean();
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (!canAccessThread(thread, uid)) return res.status(403).json({ error: 'Forbidden' });

    const msg = await MessagingMessage.findOne({ _id: messageId, threadId: thread._id });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (String(msg.senderUid) !== String(uid)) return res.status(403).json({ error: 'You can only unsend your own messages.' });

    // If already deleted, idempotent OK.
    if (!msg.deletedForAll) {
      msg.deletedForAll = true;
      msg.deletedAt = new Date();
      msg.deletedByUid = uid;
      msg.text = '';
      msg.attachments = [];
      await msg.save();

      // If this was the last message, recompute thread snippet.
      await recomputeThreadLastMessage(thread._id);
    }

    // Emit realtime event (best effort)
    try {
      const io = req.app?.locals?.io;
      if (io) {
        const payload = {
          id: String(msg._id),
          threadId: String(msg.threadId),
          deletedForAll: true,
          deletedAt: msg.deletedAt,
          deletedByUid: uid,
        };
        io.to(`thread:${thread._id.toString()}`).emit('message:deleted', payload);
        io.to(`uid:${thread.userUid}`).emit('thread:update', { threadId: String(thread._id) });
        io.to(`uid:${thread.doctorUid}`).emit('thread:update', { threadId: String(thread._id) });
      }
    } catch {
      // ignore
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete message:', e);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// POST /api/messaging/threads/:threadId/clear
// Clear chat history for both sides by converting messages to "deleted" placeholders.
// This mimics WhatsApp/Messenger style where messages show "This message was deleted".
router.post('/threads/:threadId/clear', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const { threadId } = req.params;

    const thread = await MessagingThread.findById(threadId).lean();
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (!canAccessThread(thread, uid)) return res.status(403).json({ error: 'Forbidden' });

    const now = new Date();
    await MessagingMessage.updateMany(
      { threadId: thread._id, deletedForAll: { $ne: true } },
      {
        $set: {
          deletedForAll: true,
          deletedAt: now,
          deletedByUid: uid,
          text: '',
          attachments: [],
        },
      }
    );

    await recomputeThreadLastMessage(thread._id);

    // Best-effort realtime: ask both clients to refresh.
    try {
      const io = req.app?.locals?.io;
      if (io) {
        io.to(`thread:${thread._id.toString()}`).emit('thread:cleared', { threadId: String(thread._id), at: now, by: uid });
        io.to(`uid:${thread.userUid}`).emit('thread:update', { threadId: String(thread._id) });
        io.to(`uid:${thread.doctorUid}`).emit('thread:update', { threadId: String(thread._id) });
      }
    } catch {
      // ignore
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('Failed to clear chat history:', e);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// DELETE /api/messaging/threads/:threadId
// Delete conversation (soft-delete for the current participant only).
router.delete('/threads/:threadId', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const role = req.user.role;
    const { threadId } = req.params;

    const thread = await MessagingThread.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.userUid !== uid && thread.doctorUid !== uid) return res.status(403).json({ error: 'Forbidden' });

    // Mark deleted for me (idempotent)
    const already = Array.isArray(thread.deletedFor) && thread.deletedFor.some((x) => String(x.uid) === String(uid));
    if (!already) thread.deletedFor.push({ uid, at: new Date() });
    if (role === 'doctor') thread.unreadByDoctor = 0;
    else thread.unreadByUser = 0;
    await thread.save();

    // Notify only this user to refresh their list
    try {
      const io = req.app?.locals?.io;
      if (io) io.to(`uid:${uid}`).emit('thread:update', { threadId: String(thread._id) });
    } catch {
      // ignore
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete thread:', e);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// GET /api/messaging/presence/:uid
// Fetch online/lastSeen for a user (used for "Last seen" UI).
router.get('/presence/:uid', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const targetUid = String(req.params.uid || '').trim();
    if (!targetUid) return res.status(400).json({ error: 'uid required' });
    const p = await Presence.findOne({ uid: targetUid }).lean();
    return res.json({
      uid: targetUid,
      role: p?.role || '',
      online: Boolean(p?.online),
      lastSeenAt: p?.lastSeenAt || null,
      updatedAt: p?.updatedAt || null,
    });
  } catch (e) {
    console.error('Failed to get presence:', e);
    res.status(500).json({ error: 'Failed to get presence' });
  }
});

// POST /api/messaging/threads/:threadId/read
router.post('/threads/:threadId/read', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const uid = req.user.uid;
    const role = req.user.role;
    const { threadId } = req.params;

    const thread = await MessagingThread.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.userUid !== uid && thread.doctorUid !== uid) return res.status(403).json({ error: 'Forbidden' });

    if (role === 'doctor') {
      thread.unreadByDoctor = 0;
    } else {
      thread.unreadByUser = 0;
    }
    await thread.save();
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to mark thread read:', e);
    res.status(500).json({ error: 'Failed to update read state' });
  }
});

export default router;
