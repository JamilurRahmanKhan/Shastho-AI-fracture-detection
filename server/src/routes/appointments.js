/**
 * Backend route: appointments
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the appointments feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Appointment } from '../models/Appointment.js';
import { DoctorAvailability } from '../models/DoctorAvailability.js';
import { ensurePairThreadFromAppointment } from '../lib/messagingThreads.js';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';
import { createNotification, getEmailForUid } from '../lib/notifications.js';

const router = express.Router();

function safeStr(v) {
  return (v ?? '').toString();
}


function parseHHMM(s) {
  const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(String(s || ''));
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function getZonedParts(date, tz) {
  try {
    if (!tz || tz === 'local') {
      return {
        weekday: date.toLocaleString('en-US', { weekday: 'long' }),
        minutes: date.getHours() * 60 + date.getMinutes(),
      };
    }
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const weekday = parts.find((p) => p.type === 'weekday')?.value;
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);
    if (!weekday || !Number.isFinite(hour) || !Number.isFinite(minute)) throw new Error('bad tz parts');
    return { weekday, minutes: hour * 60 + minute };
  } catch {
    // Fallback to server-local if timezone is invalid/unavailable
    return {
      weekday: date.toLocaleString('en-US', { weekday: 'long' }),
      minutes: date.getHours() * 60 + date.getMinutes(),
    };
  }
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function validateDoctorSlot({ doctorUid, startAt, ignoreAppointmentId = null }) {
  // Return { ok: boolean, status?: number, error?: string, durationMins?: number }
  const availability = await DoctorAvailability.findOne({ doctorUid }).lean();
  const durationMins = Number(availability?.slotRules?.duration || 30);
  const endAt = new Date(startAt.getTime() + durationMins * 60_000);

  // Check time-off blocks (server-side enforcement)
  const timeOff = Array.isArray(availability?.timeOff) ? availability.timeOff : [];
  for (const b of timeOff) {
    const s = b?.startAt ? new Date(b.startAt) : null;
    const e = b?.endAt ? new Date(b.endAt) : null;
    if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime())) continue;
    if (rangesOverlap(startAt.getTime(), endAt.getTime(), s.getTime(), e.getTime())) {
      return { ok: false, status: 409, error: 'Doctor is not available at this time (time-off block).', durationMins };
    }
  }

  // Check weekly working hours (if availability doc exists)
  if (availability?.weekly) {
    const tz = availability?.timezone || 'local';
    const { weekday, minutes } = getZonedParts(startAt, tz);
    const day = availability.weekly?.[weekday];
    if (day && day.available === false) {
      return { ok: false, status: 409, error: 'Doctor is not available on this day.', durationMins };
    }
    if (day && day.available !== false) {
      const startM = parseHHMM(day.start);
      const endM = parseHHMM(day.end);
      if (startM !== null && endM !== null) {
        if (minutes < startM || minutes + durationMins > endM) {
          return { ok: false, status: 409, error: 'Selected time is outside the doctor’s working hours.', durationMins };
        }
      }
      const breaks = Array.isArray(day.breaks) ? day.breaks : [];
      for (const br of breaks) {
        const bs = parseHHMM(br?.start);
        const be = parseHHMM(br?.end);
        if (bs === null || be === null) continue;
        const apptStart = minutes;
        const apptEnd = minutes + durationMins;
        const brStart = bs;
        const brEnd = be;
        if (rangesOverlap(apptStart, apptEnd, brStart, brEnd)) {
          return { ok: false, status: 409, error: 'Selected time overlaps with a doctor break.', durationMins };
        }
      }
    }
  }

  // Check overlapping scheduled/pending appointments (duration-based overlap)
  // We use a conservative window query to avoid full scans.
  const windowStart = new Date(startAt.getTime() - durationMins * 60_000);
  const windowEnd = new Date(startAt.getTime() + durationMins * 60_000);
  const existing = await Appointment.find({
    ...(ignoreAppointmentId ? { _id: { $ne: ignoreAppointmentId } } : {}),
    doctorUid,
    status: { $in: ['pending', 'scheduled'] },
    datetime: { $gte: windowStart, $lte: windowEnd },
  })
    .select({ datetime: 1 })
    .lean();

  for (const a of existing) {
    const s = new Date(a.datetime);
    if (isNaN(s.getTime())) continue;
    const e = new Date(s.getTime() + durationMins * 60_000);
    if (rangesOverlap(startAt.getTime(), endAt.getTime(), s.getTime(), e.getTime())) {
      return { ok: false, status: 409, error: 'This time slot overlaps with another appointment.', durationMins };
    }
  }

  return { ok: true, durationMins };
}

async function getFirestoreProfilesByUid(admin, uids) {
  const unique = [...new Set((uids || []).filter(Boolean))];
  if (!unique.length) return new Map();
  try {
    const refs = unique.map((uid) => admin.firestore().collection('users').doc(uid));
    const snaps = await admin.firestore().getAll(...refs);
    return new Map(snaps.filter((s) => s.exists).map((s) => [s.id, s.data() || {}]));
  } catch {
    return new Map();
  }
}

function formatApptDateTime(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return '';
  }
}

// Return only appointments that have NOT passed yet.
// (Users shouldn't see past schedules in the user panel.)
router.get('/', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  try {
    // Allow a tiny clock skew so "just booked" appointments don't get filtered out.
    const now = new Date(Date.now() - 60_000);

    const items = await Appointment.find({
      userUid: req.user.uid,
      datetime: { $gte: now },
    })
      .sort({ datetime: 1 })
      .lean();

    // Enrich with the latest doctor location from Firestore (source of truth).
    // This ensures that if a doctor updates their clinic location, users see it immediately.
    const doctorUids = [...new Set(items.map((x) => x.doctorUid).filter(Boolean))];
    if (doctorUids.length === 0) return res.json(items);

    const admin = initFirebaseAdmin();
    const refs = doctorUids.map((uid) => admin.firestore().collection('users').doc(uid));
    const snaps = await admin.firestore().getAll(...refs);
    const doctorMap = new Map(
      snaps
        .filter((s) => s.exists)
        .map((s) => [s.id, s.data() || {}])
    );

    const enriched = items.map((a) => {
      const d = doctorMap.get(a.doctorUid);
      const latestLocation = d?.location || d?.hospital || d?.clinicAddress || '';
      const latestDept = d?.department || d?.specialty || '';
      return {
        ...a,
        // Keep existing values as fallback, but prefer Firestore.
        location: latestLocation || a.location || '',
        department: latestDept || a.department || '',
      };
    });

    res.json(enriched);
  } catch (e) {
    console.error('Failed to list appointments:', e);
    res.status(500).json({ error: 'Failed to list appointments' });
  }
});

router.post('/', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const doctorUid = (req.body?.doctorUid || '').toString().trim();
  const doctorName = (req.body?.doctorName || '').toString().trim();
  if (!doctorUid) {
    return res.status(400).json({ error: 'doctorUid is required' });
  }

  const datetime = req.body?.datetime ? new Date(req.body.datetime) : null;
  if (!datetime || isNaN(datetime.getTime())) {
    return res.status(400).json({ error: 'datetime is required (ISO date string)' });
  }

  // Basic safeguard: disallow booking in the past (allow 1 minute clock skew)
  if (datetime.getTime() < Date.now() - 60_000) {
    return res.status(400).json({ error: 'datetime must be in the future' });
  }

  // Validate doctor availability + collisions (server-side enforcement)
  const slotCheck = await validateDoctorSlot({ doctorUid, startAt: datetime });
  if (!slotCheck.ok) {
    return res.status(slotCheck.status || 409).json({ error: slotCheck.error || 'Doctor is not available at this time.' });
  }

  // Prevent duplicates for the same doctor+time (simple collision check)
  // Slot is considered occupied only if it is still pending or already accepted.
  const collision = await Appointment.findOne({ doctorUid, datetime, status: { $in: ['pending', 'scheduled'] } }).lean();
  if (collision) {
    return res.status(409).json({ error: 'This time slot is already booked for the doctor. Please choose another time.' });
  }

  // Best-effort: capture patient snapshot for doctor UI + notification.
  const admin = initFirebaseAdmin();
  const patientProfile = (await getFirestoreProfilesByUid(admin, [req.user.uid])).get(req.user.uid) || {};
  const patientName = safeStr(patientProfile?.name || patientProfile?.displayName || '').trim();
  const patientEmail = safeStr(patientProfile?.email || req.user.email || '').trim();

  const doc = await Appointment.create({
    userUid: req.user.uid,
    patientName,
    patientEmail,
    doctorUid,
    doctorName,
    doctorEmail: (req.body?.doctorEmail || '').toString(),
    department: (req.body?.department || '').toString(),
    location: (req.body?.location || '').toString(),
    datetime,
    type: (req.body?.type || 'in-person').toString(),
    // Always create as a request. Doctor must accept/reject.
    status: 'pending',
    notes: (req.body?.notes || '').toString(),
    messagingEnabled: false,
  });

  // Notify doctor (in-app). Email can be wired later.
  try {
    const dtLabel = formatApptDateTime(datetime);
    await createNotification({
      targetUid: doctorUid,
      targetRole: 'doctor',
      type: 'appointment_request_created',
      title: 'New appointment request',
      message: `${patientName || 'A patient'} requested an appointment for ${dtLabel}.`,
      data: { appointmentId: doc._id?.toString?.() || doc.id, userUid: req.user.uid },
    });
  } catch (e) {
    console.warn('Failed to create doctor notification:', e?.message || e);
  }

  res.json(doc);
});

// Doctor view: list appointment requests + upcoming accepted appointments
router.get('/doctor', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const now = new Date(Date.now() - 60_000);
    const statusParam = safeStr(req.query?.status).trim();
    const statuses = statusParam ? statusParam.split(',').map((s) => s.trim()).filter(Boolean) : ['pending', 'scheduled'];

    const items = await Appointment.find({
      doctorUid: req.user.uid,
      datetime: { $gte: now },
      status: { $in: statuses },
    })
      .sort({ datetime: 1 })
      .lean();

    // Enrich with patient profile (name/email) from Firestore when missing.
    const admin = initFirebaseAdmin();
    const userUids = [...new Set(items.map((x) => x.userUid).filter(Boolean))];
    const userMap = await getFirestoreProfilesByUid(admin, userUids);

    const enriched = items.map((a) => {
      const p = userMap.get(a.userUid) || {};
      const name = safeStr(p?.name || p?.displayName || a.patientName || '').trim();
      const email = safeStr(p?.email || a.patientEmail || '').trim();
      const phone = safeStr(p?.phone || p?.phoneNumber || '');
      return {
        ...a,
        patient: {
          uid: a.userUid,
          name: name || 'Patient',
          email,
          phone,
        },
      };
    });

    res.json(enriched);
  } catch (e) {
    console.error('Failed to list doctor appointments:', e);
    res.status(500).json({ error: 'Failed to list doctor appointments' });
  }
});

// Doctor action: accept/reject a pending appointment request
router.patch('/:id/decision', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const action = safeStr(req.body?.action).trim().toLowerCase();
    const reason = safeStr(req.body?.reason).trim();
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or reject' });
    }

    const doc = await Appointment.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.doctorUid !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });
    if (doc.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be accepted or rejected.' });
    }

    doc.decisionAt = new Date();
    doc.decisionBy = req.user.uid;
    doc.decisionReason = reason;

    if (action === 'accept') {
      // Re-validate slot at acceptance time to avoid conflicts/time-off issues.
      const slotCheck = await validateDoctorSlot({ doctorUid: doc.doctorUid, startAt: doc.datetime });
      if (!slotCheck.ok) {
        return res.status(slotCheck.status || 409).json({ error: slotCheck.error || 'Doctor is not available at this time.' });
      }

      doc.status = 'scheduled';
      doc.messagingEnabled = true;

      // Ensure a single persistent thread exists for this doctor<->user pair.
      // (If older versions created duplicates, this also consolidates them.)
      try {
        await ensurePairThreadFromAppointment(doc);
      } catch (e) {
        console.warn('Failed to ensure messaging thread on acceptance:', e?.message || e);
      }
    } else {
      doc.status = 'rejected';
      doc.messagingEnabled = false;
    }

    await doc.save();

    // Notify patient
    try {
      const dtLabel = formatApptDateTime(doc.datetime);
      const doctorLabel = safeStr(doc.doctorName || 'your doctor');
      const isAccept = action === 'accept';
      await createNotification({
        targetUid: doc.userUid,
        targetRole: 'user',
        type: isAccept ? 'appointment_request_accepted' : 'appointment_request_rejected',
        title: isAccept ? 'Appointment accepted' : 'Appointment rejected',
        message: isAccept
          ? `${doctorLabel} accepted your appointment request for ${dtLabel}. You can now message the doctor.`
          : `${doctorLabel} rejected your appointment request for ${dtLabel}.${reason ? ` Reason: ${reason}` : ''}`,
        data: { appointmentId: doc._id?.toString?.() || doc.id, doctorUid: doc.doctorUid },
      });

      // Optional email (best-effort) – uses Firebase Auth user email.
      const email = await getEmailForUid(doc.userUid);
      if (email) {
        // Email sending is handled by lib/notifications when wired.
        // For now, we only create in-app notifications.
      }
    } catch (e) {
      console.warn('Failed to create patient notification:', e?.message || e);
    }

    res.json(doc);
  } catch (e) {
    console.error('Failed to decide appointment:', e);
    res.status(500).json({ error: 'Failed to decide appointment' });
  }
});

// Get a single appointment (used for messaging gating / details screens)
router.get('/:id', requireFirebaseAuth, requireRole(['user', 'doctor']), async (req, res) => {
  try {
    const doc = await Appointment.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // Access control: users can view their own; doctors can view theirs.
    if (doc.userUid !== req.user.uid && doc.doctorUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(doc);
  } catch (e) {
    console.error('Failed to get appointment:', e);
    res.status(500).json({ error: 'Failed to get appointment' });
  }
});

router.patch('/:id', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const doc = await Appointment.findOne({ _id: req.params.id, userUid: req.user.uid });
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const prevDatetime = doc.datetime;

  // Users can only change the schedule BEFORE the appointment time has passed.
  // (They can still edit notes, etc., but rescheduling is blocked after the scheduled time.)
  const now = Date.now();
  const hasDatetimeUpdate = req.body?.datetime !== undefined;
  if (hasDatetimeUpdate) {
    if (!['pending', 'scheduled'].includes(String(doc.status || ''))) {
      return res.status(400).json({ error: 'This appointment cannot be rescheduled.' });
    }
    if (doc.datetime?.getTime && doc.datetime.getTime() < now - 60_000) {
      return res.status(400).json({ error: 'Cannot reschedule an appointment whose scheduled time has already passed.' });
    }

    const nextDt = req.body.datetime ? new Date(req.body.datetime) : null;
    if (!nextDt || isNaN(nextDt.getTime())) {
      return res.status(400).json({ error: 'datetime must be a valid ISO date string' });
    }
    if (nextDt.getTime() < now - 60_000) {
      return res.status(400).json({ error: 'datetime must be in the future' });
    }
    // Validate doctor availability + collisions (server-side enforcement)
    const doctorUid = (req.body?.doctorUid ?? doc.doctorUid) || '';
    const slotCheck = await validateDoctorSlot({ doctorUid, startAt: nextDt, ignoreAppointmentId: doc._id });
    if (!slotCheck.ok) {
      return res.status(slotCheck.status || 409).json({ error: slotCheck.error || 'Doctor is not available at this time.' });
    }
}

  const up = {};
  // Restrict what patients can change to avoid privilege escalation.
  for (const k of ['type', 'notes']) {
    if (req.body?.[k] !== undefined) up[k] = req.body[k];
  }
  if (req.body?.status !== undefined) {
    const next = safeStr(req.body.status).trim().toLowerCase();
    if (next !== 'cancelled') {
      return res.status(400).json({ error: 'Patients can only cancel an appointment request.' });
    }
    up.status = 'cancelled';
    up.messagingEnabled = false;
  }
  if (req.body?.datetime !== undefined) {
    up.datetime = req.body.datetime ? new Date(req.body.datetime) : doc.datetime;
  }

  Object.assign(doc, up);
  await doc.save();

  // Best-effort doctor notifications for request updates/cancellations.
  try {
    const didDatetimeChange = up.datetime && prevDatetime && new Date(up.datetime).getTime() !== new Date(prevDatetime).getTime();
    if (didDatetimeChange && doc.status === 'pending' && doc.doctorUid) {
      await createNotification({
        targetUid: doc.doctorUid,
        targetRole: 'doctor',
        type: 'appointment_request_updated',
        title: 'Appointment request updated',
        message: `${doc.patientName || 'A patient'} updated their requested time to ${formatApptDateTime(doc.datetime)}.`,
        data: { appointmentId: doc._id?.toString?.() || doc.id, userUid: doc.userUid },
      });
    }
    if (up.status === 'cancelled' && doc.doctorUid) {
      await createNotification({
        targetUid: doc.doctorUid,
        targetRole: 'doctor',
        type: 'appointment_request_cancelled',
        title: 'Appointment request cancelled',
        message: `${doc.patientName || 'A patient'} cancelled their appointment request for ${formatApptDateTime(doc.datetime)}.`,
        data: { appointmentId: doc._id?.toString?.() || doc.id, userUid: doc.userUid },
      });
    }
  } catch (e) {
    console.warn('Failed to notify doctor about appointment update:', e?.message || e);
  }

  res.json(doc);
});

router.delete('/:id', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const r = await Appointment.deleteOne({ _id: req.params.id, userUid: req.user.uid });
  res.json({ deleted: r.deletedCount === 1 });
});

export default router;
