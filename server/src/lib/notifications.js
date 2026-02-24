/**
 * Backend library: notifications
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import nodemailer from 'nodemailer';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';
import { Notification } from '../models/Notification.js';
import { getIO } from '../realtime/ioRef.js';

// Phase 9: notifications (in-app + optional email)

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

  if (!host || !user || !pass) return null;

  _transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  return _transporter;
}

export async function sendEmailBestEffort(to, subject, text) {
  try {
    if (!to) return { ok: false, skipped: true, reason: 'missing_to' };
    const transporter = getTransporter();
    if (!transporter) {
      // Dev-friendly fallback
      console.log('[email:skipped]', { to, subject, text: String(text || '').slice(0, 200) });
      return { ok: false, skipped: true, reason: 'smtp_not_configured' };
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({ from, to, subject, text });
    return { ok: true };
  } catch (e) {
    console.error('sendEmailBestEffort failed:', e);
    return { ok: false, error: e?.message || 'send_failed' };
  }
}

const emailCache = new Map();
const EMAIL_TTL_MS = 5 * 60_000;

export async function getEmailForUid(uid) {
  if (!uid) return null;
  const now = Date.now();
  const cached = emailCache.get(uid);
  if (cached && now - cached.ts < EMAIL_TTL_MS) return cached.email;
  try {
    const admin = initFirebaseAdmin();
    const user = await admin.auth().getUser(uid);
    const email = user?.email || null;
    emailCache.set(uid, { email, ts: now });
    return email;
  } catch {
    // If Firebase Admin is not configured in an environment, just skip email.
    emailCache.set(uid, { email: null, ts: now });
    return null;
  }
}

export async function createNotification({
  targetUid,
  targetRole = '',
  type,
  title,
  message,
  data = {},
}) {
  if (!targetUid) return null;
  if (!type || !title || !message) return null;
  const doc = await Notification.create({ targetUid, targetRole, type, title, message, data });

  // Best-effort realtime push...
  try {
    const io = getIO();
    if (io) {
      const out = { id: String(doc._id), ...doc.toObject() };
      io.to(`uid:${targetUid}`).emit('notification:new', out);

      // Send updated unread count for navbar badges.
      const count = await Notification.countDocuments({ targetUid, isRead: false });
      io.to(`uid:${targetUid}`).emit('notification:unreadCount', { count });
    }
  } catch {
    // ignore
  }

  return { id: String(doc._id), ...doc.toObject() };
}

export async function notifyUserAndEmail({
  targetUid,
  targetRole,
  email,
  type,
  title,
  message,
  data,
  emailSubject,
  emailText,
}) {
  const notif = await createNotification({ targetUid, targetRole, type, title, message, data });
  await sendEmailBestEffort(email, emailSubject || title, emailText || message);
  return notif;
}
