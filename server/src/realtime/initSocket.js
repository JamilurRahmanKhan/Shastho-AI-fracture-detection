/**
 * Backend: initSocket
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Server entrypoint and core backend wiring for ShasthoAI.
 *
 * Project-specific notes:
 * - (none)
 */

import { Server as SocketIOServer } from 'socket.io';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';
import { MessagingThread } from '../models/MessagingThread.js';
import { MessagingMessage } from '../models/MessagingMessage.js';
import { createNotification } from '../lib/notifications.js';
import { Presence } from '../models/Presence.js';
import { setIO } from './ioRef.js';

// Lightweight, production-style Socket.IO setup
// - Auth: Firebase ID token
// - Rooms: uid:<uid> and thread:<threadId>

// Presence (online + last seen) - maintain reference counts per uid
const onlineCount = new Map();

// Simple in-memory role cache (mirrors requireRole behavior)
const roleCache = new Map();
const ROLE_TTL_MS = 60_000;

// Active video calls (in-memory). Good enough for single-instance deployments.
// Keyed by callId.
const activeCalls = new Map();

async function getRole(uid) {
  const now = Date.now();
  const cached = roleCache.get(uid);
  if (cached && (now - cached.ts) < ROLE_TTL_MS) return cached.role;

  const admin = initFirebaseAdmin();
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  const raw = snap.exists ? snap.data()?.role : null;
  const role = raw ? String(raw).trim().toLowerCase() : null;
  roleCache.set(uid, { role, ts: now });
  return role;
}

function fmtDur(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, '0');
  const rr = String(r).padStart(2, '0');
  return `${mm}:${rr}`;
}

function callSnippet(status, durationSec) {
  if (status === 'completed') return `📹 Video call • ${fmtDur(durationSec)}`;
  if (status === 'missed') return '📹 Missed video call';
  if (status === 'rejected') return '📹 Call declined';
  return '📹 Call cancelled';
}

export function initSocket(httpServer, { allowedOrigins = [] } = {}) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (!allowedOrigins.length || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
    },
  });

  // Expose the Socket.IO instance for other modules (e.g. notifications).
  // This is safe because there is only one server process in this app.
  setIO(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake?.auth?.token || socket.handshake?.query?.token;
      if (!token) return next(new Error('Unauthorized'));

      const admin = initFirebaseAdmin();
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;
      const role = await getRole(uid);
      if (!role) return next(new Error('Role missing'));

      socket.data.user = { uid, role };
      return next();
    } catch (e) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { uid, role } = socket.data.user;

    // Personal room for notifications/unread updates
    socket.join(`uid:${uid}`);

    // ------------------------------
    // Presence (Online + Last Seen)
    // ------------------------------
    // Keep an in-memory refcount so "online" stays true if user has multiple tabs.
    const current = (onlineCount.get(uid) || 0) + 1;
    onlineCount.set(uid, current);
    if (current === 1) {
      // First active connection => online
      Presence.updateOne(
        { uid },
        { $set: { uid, role, online: true }, $setOnInsert: { lastSeenAt: null } },
        { upsert: true }
      ).catch(() => {});
      io.to(`presence:${uid}`).emit('presence:update', { uid, online: true, lastSeenAt: null });
    }

    socket.on('presence:subscribe', async (targetUid, ack) => {
      try {
        const t = String(targetUid || '').trim();
        if (!t) throw new Error('targetUid required');
        socket.join(`presence:${t}`);
        const p = await Presence.findOne({ uid: t }).lean();
        ack?.({ ok: true, presence: { uid: t, online: Boolean(p?.online), lastSeenAt: p?.lastSeenAt || null } });
      } catch (e) {
        ack?.({ ok: false, error: e?.message || 'subscribe_failed' });
      }
    });

    socket.on('presence:unsubscribe', (targetUid, ack) => {
      const t = String(targetUid || '').trim();
      if (t) socket.leave(`presence:${t}`);
      ack?.({ ok: true });
    });

    socket.on('thread:join', async (threadId, ack) => {
      try {
        if (!threadId) throw new Error('threadId required');
        const thread = await MessagingThread.findById(threadId).lean();
        if (!thread) throw new Error('Thread not found');
        if (thread.userUid !== uid && thread.doctorUid !== uid) throw new Error('Forbidden');

        socket.join(`thread:${thread._id.toString()}`);
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e?.message || 'join_failed' });
      }
    });

    // Send message via socket.
    // Supports idempotency via clientMessageId to prevent duplicate messages on retries.
    // Supports attachments (uploaded via REST endpoint first).
    socket.on('message:send', async (payload, ack) => {
      try {
        const threadId = payload?.threadId;
        const clientMessageId = (payload?.clientMessageId || '').toString().trim();
        const text = (payload?.text || '').toString().trim();
        const attachments = Array.isArray(payload?.attachments) ? payload.attachments : [];
        if (!threadId) throw new Error('threadId required');
        if (!text && attachments.length === 0) throw new Error('text or attachments required');
        if (text.length > 2000) throw new Error('Message too long');
        if (attachments.length > 10) throw new Error('Too many attachments (max 10)');

        const thread = await MessagingThread.findById(threadId);
        if (!thread) throw new Error('Thread not found');
        if (thread.userUid !== uid && thread.doctorUid !== uid) throw new Error('Forbidden');

        // Option B UX: once a thread exists, messaging/calls remain allowed.
        // The thread itself is only created when the first appointment is accepted.

        // Idempotency: if the client retries with the same clientMessageId, return the existing message.
        if (clientMessageId) {
          const existing = await MessagingMessage.findOne({ threadId: thread._id, clientMessageId }).lean();
          if (existing) {
            const out = {
              id: String(existing._id),
              threadId: String(existing.threadId),
              senderUid: existing.senderUid,
              senderRole: existing.senderRole,
              text: existing.text || '',
              attachments: existing.attachments || [],
              clientMessageId: existing.clientMessageId || '',
              createdAt: existing.createdAt,
            };
            ack?.({ ok: true, message: out, duplicate: true });
            return;
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
        if (role === 'doctor') thread.unreadByUser = Number(thread.unreadByUser || 0) + 1;
        else thread.unreadByDoctor = Number(thread.unreadByDoctor || 0) + 1;
        const lastText = text
          ? (text.length <= 120 ? text : `${text.slice(0, 119)}…`)
          : (attachments.length ? `📎 ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}` : '');

        thread.lastMessageText = lastText;
        thread.lastMessageAt = now;

        // If a party deleted the conversation, a new message should make it reappear.
        if (Array.isArray(thread.deletedFor) && thread.deletedFor.length) {
          const keep = thread.deletedFor.filter(
            (x) => ![String(thread.userUid), String(thread.doctorUid)].includes(String(x.uid))
          );
          thread.deletedFor = keep;
        }
        await thread.save();

        const out = {
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

        io.to(`thread:${thread._id.toString()}`).emit('message:new', out);
        io.to(`uid:${thread.userUid}`).emit('thread:update', { threadId: String(thread._id) });
        io.to(`uid:${thread.doctorUid}`).emit('thread:update', { threadId: String(thread._id) });

        // In-app notification (best effort)
        try {
          const recipient = role === 'doctor' ? { uid: thread.userUid, role: 'user' } : { uid: thread.doctorUid, role: 'doctor' };
          await createNotification({
            targetUid: recipient.uid,
            targetRole: recipient.role,
            type: 'dm_message',
            title: 'New message',
            message: text
              ? (text.length <= 120 ? text : `${text.slice(0, 119)}…`)
              : (attachments.length ? `Sent ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}` : 'New message'),
            data: { threadId: String(thread._id), appointmentId: String(thread.appointmentId) },
          });
        } catch {
          // ignore
        }

        ack?.({ ok: true, message: out });
      } catch (e) {
        ack?.({ ok: false, error: e?.message || 'send_failed' });
      }
    });

    socket.on('disconnect', () => {
      // If the socket drops during a call, end it for both parties and create a log.
      for (const [callId, sess] of activeCalls.entries()) {
        if (sess?.callerUid === uid || sess?.calleeUid === uid) {
          try {
            io.to(`uid:${sess.callerUid}`).emit('call:end', { threadId: String(sess.threadId), callId, reason: 'disconnect' });
            io.to(`uid:${sess.calleeUid}`).emit('call:end', { threadId: String(sess.threadId), callId, reason: 'disconnect' });
          } catch {}
          const st = sess.answeredAt ? 'completed' : (sess.calleeUid === uid ? 'missed' : 'cancelled');
          finalizeCall(callId, st, uid).catch(() => null);
        }
      }

      const left = (onlineCount.get(uid) || 1) - 1;
      if (left <= 0) {
        onlineCount.delete(uid);
        const lastSeenAt = new Date();
        Presence.updateOne(
          { uid },
          { $set: { uid, role, online: false, lastSeenAt } },
          { upsert: true }
        ).catch(() => {});
        io.to(`presence:${uid}`).emit('presence:update', { uid, online: false, lastSeenAt });
      } else {
        onlineCount.set(uid, left);
      }
    });

    // ------------------------------
    // WebRTC signaling (Video call)
    // ------------------------------
    // 1:1 call per thread. We only relay SDP/ICE between participants.
    // Production note: for NAT-restricted networks you typically need a TURN server.

    async function loadThreadOrThrow(threadId) {
      const t = await MessagingThread.findById(threadId).lean();
      if (!t) throw new Error('Thread not found');
      if (t.userUid !== uid && t.doctorUid !== uid) throw new Error('Forbidden');
      return t;
    }

    function otherUid(thread) {
      return thread.userUid === uid ? thread.doctorUid : thread.userUid;
    }

    function myDisplayName(thread) {
      return role === 'doctor' ? (thread.doctorName || 'Doctor') : (thread.userName || 'Patient');
    }

    async function logCallMessage({ thread, callId, status, startedAt, endedAt, durationSec, initiatorUid, initiatorRole }) {
      const text = status === 'completed'
        ? `📹 Video call • ${formatDuration(durationSec)}`
        : status === 'missed'
          ? `📹 Missed video call`
          : status === 'rejected'
            ? `📹 Call declined`
            : `📹 Call cancelled`;

      const msg = await MessagingMessage.create({
        threadId: thread._id,
        senderUid: initiatorUid,
        senderRole: initiatorRole,
        kind: 'call',
        text,
        attachments: [],
        call: {
          callId,
          status,
          startedAt: startedAt ? new Date(startedAt) : null,
          endedAt: endedAt ? new Date(endedAt) : null,
          durationSec: Number(durationSec || 0),
        },
      });

      const now = new Date(endedAt || Date.now());
      const inc = initiatorRole === 'doctor' ? { unreadByUser: 1 } : { unreadByDoctor: 1 };
      await MessagingThread.updateOne(
        { _id: thread._id },
        {
          $set: { lastMessageText: text, lastMessageAt: now, appointmentId: thread.appointmentId },
          $inc: inc,
          $pull: { deletedFor: { uid: { $in: [thread.userUid, thread.doctorUid] } } },
        }
      );

      // Realtime push
      try {
        io.to(`thread:${thread._id.toString()}`).emit('message:new', {
          id: String(msg._id),
          threadId: String(thread._id),
          senderUid: msg.senderUid,
          senderRole: msg.senderRole,
          kind: 'call',
          call: msg.call,
          text: msg.text || '',
          attachments: [],
          clientMessageId: '',
          createdAt: msg.createdAt,
        });
        io.to(`uid:${thread.userUid}`).emit('thread:update', { threadId: String(thread._id) });
        io.to(`uid:${thread.doctorUid}`).emit('thread:update', { threadId: String(thread._id) });
      } catch {
        // ignore
      }
    }

    async function finalizeCall(callId, status, endedByUid = '') {
      const sess = activeCalls.get(callId);
      if (!sess) return;
      if (sess.timeout) clearTimeout(sess.timeout);
      activeCalls.delete(callId);

      const endedAt = Date.now();
      const startedAt = sess.startedAt || endedAt;
      const durationSec = sess.answeredAt ? Math.max(0, Math.floor((endedAt - sess.answeredAt) / 1000)) : 0;

      const thread = await MessagingThread.findById(sess.threadId).lean();
      if (thread) {
        await logCallMessage({
          thread,
          callId,
          status,
          startedAt,
          endedAt,
          durationSec,
          initiatorUid: sess.callerUid,
          initiatorRole: sess.callerRole,
        });
      }

      // Notifications for missed calls
      if (status === 'missed') {
        try {
          await createNotification({
            targetUid: sess.calleeUid,
            targetRole: sess.callerRole === 'doctor' ? 'user' : 'doctor',
            type: 'missed_call',
            title: 'Missed video call',
            message: 'You missed a video call.',
            data: { threadId: String(sess.threadId), callId },
          });
          await createNotification({
            targetUid: sess.callerUid,
            targetRole: sess.callerRole,
            type: 'missed_call',
            title: 'Missed video call',
            message: 'Your call was not answered.',
            data: { threadId: String(sess.threadId), callId },
          });
        } catch {
          // ignore
        }
      }
    }

    // Offer from caller
    socket.on('call:offer', async (payload, ack) => {
      try {
        const threadId = payload?.threadId;
        const callId = String(payload?.callId || '').trim();
        const offer = payload?.offer;
        if (!threadId) throw new Error('threadId required');
        if (!callId) throw new Error('callId required');
        if (!offer) throw new Error('offer required');

        const thread = await loadThreadOrThrow(threadId);
        const to = otherUid(thread);

        // Register active call session (for missed-call + call log support)
        if (activeCalls.has(callId)) {
          try {
            const prev = activeCalls.get(callId);
            if (prev?.timeout) clearTimeout(prev.timeout);
          } catch {}
          activeCalls.delete(callId);
        }

        const startedAt = Date.now();
        const timeout = setTimeout(async () => {
          const sess = activeCalls.get(callId);
          if (!sess || sess.answeredAt) return;
          // Stop ringing on both ends
          io.to(`uid:${sess.callerUid}`).emit('call:end', { threadId: String(sess.threadId), callId, reason: 'missed' });
          io.to(`uid:${sess.calleeUid}`).emit('call:end', { threadId: String(sess.threadId), callId, reason: 'missed' });
          await finalizeCall(callId, 'missed');
        }, 30_000);

        activeCalls.set(callId, {
          threadId: thread._id,
          callerUid: uid,
          callerRole: role,
          calleeUid: to,
          startedAt,
          answeredAt: null,
          timeout,
        });

        io.to(`uid:${to}`).emit('call:offer', {
          threadId: String(thread._id),
          callId,
          from: { uid, role, name: myDisplayName(thread) },
          offer,
          createdAt: new Date().toISOString(),
        });

        // In-app notification (best effort)
        try {
          await createNotification({
            targetUid: to,
            targetRole: role === 'doctor' ? 'user' : 'doctor',
            type: 'video_call',
            title: 'Incoming video call',
            message: 'You have an incoming video call.',
            data: { threadId: String(thread._id), appointmentId: String(thread.appointmentId), callId },
          });
        } catch {
          // ignore
        }

        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e?.message || 'call_offer_failed' });
      }
    });

    // Answer from callee
    socket.on('call:answer', async (payload, ack) => {
      try {
        const threadId = payload?.threadId;
        const callId = String(payload?.callId || '').trim();
        const answer = payload?.answer;
        if (!threadId) throw new Error('threadId required');
        if (!callId) throw new Error('callId required');
        if (!answer) throw new Error('answer required');

        const thread = await loadThreadOrThrow(threadId);

        // Mark answered to prevent missed-call timeout.
        const sess = activeCalls.get(callId);
        if (sess) {
          sess.answeredAt = Date.now();
          if (sess.timeout) {
            clearTimeout(sess.timeout);
            sess.timeout = null;
          }
          activeCalls.set(callId, sess);
        }

        const to = otherUid(thread);
        io.to(`uid:${to}`).emit('call:answer', {
          threadId: String(thread._id),
          callId,
          from: { uid, role, name: myDisplayName(thread) },
          answer,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e?.message || 'call_answer_failed' });
      }
    });

    // ICE candidates from either party
    socket.on('call:ice', async (payload, ack) => {
      try {
        const threadId = payload?.threadId;
        const callId = String(payload?.callId || '').trim();
        const candidate = payload?.candidate;
        if (!threadId) throw new Error('threadId required');
        if (!callId) throw new Error('callId required');
        if (!candidate) throw new Error('candidate required');

        const thread = await loadThreadOrThrow(threadId);
        const to = otherUid(thread);
        io.to(`uid:${to}`).emit('call:ice', {
          threadId: String(thread._id),
          callId,
          from: { uid, role },
          candidate,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e?.message || 'call_ice_failed' });
      }
    });

    // End call
    socket.on('call:end', async (payload, ack) => {
      try {
        const threadId = payload?.threadId;
        const callId = String(payload?.callId || '').trim();
        if (!threadId) throw new Error('threadId required');
        if (!callId) throw new Error('callId required');

        const thread = await loadThreadOrThrow(threadId);
        const to = otherUid(thread);
        io.to(`uid:${to}`).emit('call:end', {
          threadId: String(thread._id),
          callId,
          from: { uid, role },
        });

        // Persist call log
        const sess = activeCalls.get(callId);
        const status = sess?.answeredAt ? 'completed' : 'cancelled';
        await finalizeCall(callId, status, uid);
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e?.message || 'call_end_failed' });
      }
    });

    // Reject / Busy
    socket.on('call:reject', async (payload, ack) => {
      try {
        const threadId = payload?.threadId;
        const callId = String(payload?.callId || '').trim();
        const reason = String(payload?.reason || 'rejected');
        if (!threadId) throw new Error('threadId required');
        if (!callId) throw new Error('callId required');

        const thread = await loadThreadOrThrow(threadId);
        const to = otherUid(thread);
        io.to(`uid:${to}`).emit('call:reject', {
          threadId: String(thread._id),
          callId,
          from: { uid, role },
          reason,
        });

        // Stop ringing + log
        io.to(`uid:${to}`).emit('call:end', { threadId: String(thread._id), callId, reason: 'rejected' });
        await finalizeCall(callId, 'rejected', uid);

        // Notify caller
        try {
          await createNotification({
            targetUid: to,
            targetRole: role === 'doctor' ? 'user' : 'doctor',
            type: 'call_declined',
            title: 'Call declined',
            message: 'Your video call was declined.',
            data: { threadId: String(thread._id), callId },
          });
        } catch {
          // ignore
        }
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e?.message || 'call_reject_failed' });
      }
    });
  });

  return io;
}
