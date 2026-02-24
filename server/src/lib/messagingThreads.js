/**
 * Backend library: messagingThreads
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import { MessagingThread } from '../models/MessagingThread.js';
import { MessagingMessage } from '../models/MessagingMessage.js';

export function makePairKey(userUid, doctorUid) {
  return `${String(userUid || '').trim()}__${String(doctorUid || '').trim()}`;
}

/**
 * Consolidate multiple legacy threads for the same doctor<->user pair into a single thread.
 * - Picks the oldest thread as canonical.
 * - Moves messages from duplicates into canonical.
 * - Merges unread counts + deletedFor.
 * - Deletes duplicates.
 */
export async function consolidatePairThreads(userUid, doctorUid) {
  const pairKey = makePairKey(userUid, doctorUid);
  // Include legacy threads that may not have pairKey yet.
  const threads = await MessagingThread.find({
    $or: [{ pairKey }, { pairKey: { $exists: false } }],
    userUid,
    doctorUid,
  }).sort({ createdAt: 1 }).lean();
  if (!threads.length) return null;
  if (threads.length === 1) return threads[0];

  const canonical = threads[0];
  const dupes = threads.slice(1);

  // Move messages to canonical
  const dupeIds = dupes.map((t) => t._id);
  await MessagingMessage.updateMany({ threadId: { $in: dupeIds } }, { $set: { threadId: canonical._id } });

  // Merge deletedFor
  const deletedFor = [...(canonical.deletedFor || [])];
  for (const d of dupes) {
    for (const item of (d.deletedFor || [])) {
      if (!deletedFor.some((x) => String(x.uid) === String(item.uid))) deletedFor.push(item);
    }
  }

  // Compute best lastMessage
  const all = [canonical, ...dupes];
  const bestLast = all
    .filter((t) => t.lastMessageAt)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0];

  await MessagingThread.updateOne(
    { _id: canonical._id },
    {
      $set: {
        pairKey,
        deletedFor,
        // Keep the latest appointment pointer so deep-links continue to work.
        appointmentId: bestLast?.appointmentId || canonical.appointmentId,
        lastMessageAt: bestLast?.lastMessageAt || canonical.lastMessageAt || null,
        lastMessageText: bestLast?.lastMessageText || canonical.lastMessageText || '',
        unreadByUser: Number(all.reduce((s, t) => s + Number(t.unreadByUser || 0), 0)),
        unreadByDoctor: Number(all.reduce((s, t) => s + Number(t.unreadByDoctor || 0), 0)),
      },
    }
  );

  // Remove duplicates
  await MessagingThread.deleteMany({ _id: { $in: dupeIds } });

  return await MessagingThread.findById(canonical._id).lean();
}

/**
 * Ensure there is a thread for a doctor<->user pair, and update its appointment pointer + snapshots.
 */
export async function ensurePairThreadFromAppointment(appt) {
  const userUid = appt?.userUid;
  const doctorUid = appt?.doctorUid;
  if (!userUid || !doctorUid) return null;
  const pairKey = makePairKey(userUid, doctorUid);

  // First, try to find an existing thread (legacy or new)
  let thread = await MessagingThread.findOne({ $or: [{ pairKey }, { pairKey: { $exists: false } }], userUid, doctorUid })
    .sort({ createdAt: 1 });
  if (!thread) {
    thread = await MessagingThread.create({
      appointmentId: appt._id,
      pairKey,
      userUid,
      doctorUid,
      userName: appt.patientName || '',
      userEmail: appt.patientEmail || '',
      doctorName: appt.doctorName || '',
      doctorEmail: appt.doctorEmail || '',
      lastMessageText: '',
      lastMessageAt: null,
      unreadByUser: 0,
      unreadByDoctor: 0,
    });
  } else {
    // Update appointment pointer + snapshots best-effort
    thread.appointmentId = appt._id;
    thread.userName = appt.patientName || thread.userName || '';
    thread.userEmail = appt.patientEmail || thread.userEmail || '';
    thread.doctorName = appt.doctorName || thread.doctorName || '';
    thread.doctorEmail = appt.doctorEmail || thread.doctorEmail || '';
    if (!thread.pairKey) thread.pairKey = pairKey;
    await thread.save();
  }

  // Consolidate any duplicates created by older versions.
  const consolidated = await consolidatePairThreads(userUid, doctorUid);
  return consolidated || (thread.toObject ? thread.toObject() : thread);
}
