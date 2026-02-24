/**
 * Backend route: doctorPanel
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the doctorPanel feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';

import { Appointment } from '../models/Appointment.js';
import { MessagingThread } from '../models/MessagingThread.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

async function fetchProfiles(uids = []) {
  const uniq = [...new Set(uids.filter(Boolean))];
  if (!uniq.length) return new Map();

  const admin = initFirebaseAdmin();
  const db = admin.firestore();
  const refs = uniq.map((uid) => db.collection('users').doc(uid));
  const snaps = await db.getAll(...refs);

  const out = new Map();
  for (const s of snaps) {
    if (!s.exists) continue;
    const data = s.data() || {};
    out.set(s.id, {
      uid: s.id,
      name: data.name || data.displayName || data.fullName || 'User',
      email: data.email || '',
      phone: data.phone || data.phoneNumber || '',
      photoURL: data.photoURL || data.avatarUrl || '',
      age: typeof data.age === 'number' ? data.age : null,
      gender: data.gender || '',
    });
  }
  return out;
}

/**
 * GET /api/doctor/dashboard
 * Doctor-facing dashboard stats.
 */
router.get('/dashboard', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const doctorUid = req.user.uid;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [
      pendingAppointments,
      upcomingToday,
      totalPatientsAgg,
      unreadThreadsAgg,
      unreadNotifications,
    ] = await Promise.all([
      Appointment.countDocuments({ doctorUid, status: 'pending' }),
      Appointment.find({ doctorUid, status: { $in: ['scheduled'] }, datetime: { $gte: todayStart, $lte: todayEnd } })
        .sort({ datetime: 1 })
        .limit(25)
        .lean(),
      Appointment.aggregate([
        { $match: { doctorUid, status: { $in: ['scheduled', 'completed'] } } },
        { $group: { _id: '$userUid' } },
        { $count: 'count' },
      ]),
      MessagingThread.aggregate([
        { $match: { doctorUid } },
        { $group: { _id: null, unreadByDoctor: { $sum: '$unreadByDoctor' } } },
      ]),
      Notification.countDocuments({ targetUid: doctorUid, targetRole: 'doctor', isRead: false }),
    ]);

    const totalPatients = totalPatientsAgg?.[0]?.count || 0;
    const unreadMessages = unreadThreadsAgg?.[0]?.unreadByDoctor || 0;

    // Resolve patient names for the upcoming list.
    const patientProfiles = await fetchProfiles(upcomingToday.map((a) => a.userUid));
    const upcoming = upcomingToday.map((a) => {
      const p = patientProfiles.get(a.userUid) || {};
      return {
        id: String(a._id),
        datetime: a.datetime,
        type: a.type,
        status: a.status,
        patientUid: a.userUid,
        patientName: p.name || a.patientName || 'Patient',
      };
    });

    // Doctor display name (best-effort)
    let doctorName = '';
    try {
      const admin = initFirebaseAdmin();
      const doc = await admin.firestore().collection('users').doc(doctorUid).get();
      const data = doc.exists ? doc.data() || {} : {};
      doctorName = data.name || data.displayName || data.fullName || '';
    } catch {
      // ignore
    }

    return res.json({
      doctorUid,
      doctorName,
      stats: {
        totalPatients,
        pendingAppointments,
        upcomingToday: upcoming.length,
        unreadNotifications,
        unreadMessages,
      },
      upcomingToday: upcoming,
    });
  } catch (e) {
    console.error('Failed to load doctor dashboard:', e);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

/**
 * GET /api/doctor/patients
 * Patients are derived from accepted appointments / existing threads.
 */
router.get('/patients', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const doctorUid = req.user.uid;
    const q = String(req.query?.q || '').trim().toLowerCase();

    // Build patient list from threads (only pairs that already have a thread).
    // This aligns with: "chat/calls allowed once a thread exists".
    const threads = await MessagingThread.find({ doctorUid })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(500)
      .lean();

    const userUids = threads.map((t) => t.userUid);
    const profiles = await fetchProfiles(userUids);

    // Aggregate last accepted appointment per patient (for "last visit")
    const lastVisits = await Appointment.aggregate([
      { $match: { doctorUid, userUid: { $in: userUids }, status: { $in: ['scheduled', 'completed'] } } },
      { $sort: { datetime: -1 } },
      {
        $group: {
          _id: '$userUid',
          lastVisitAt: { $first: '$datetime' },
          totalAppointments: { $sum: 1 },
        },
      },
    ]);
    const lastVisitMap = new Map(lastVisits.map((x) => [String(x._id), x]));

    const items = threads
      .map((t) => {
        const p = profiles.get(t.userUid) || {};
        const lv = lastVisitMap.get(String(t.userUid));
        return {
          uid: t.userUid,
          name: p.name || t.userName || 'Patient',
          email: p.email || t.userEmail || '',
          phone: p.phone || '',
          photoURL: p.photoURL || '',
          lastVisitAt: lv?.lastVisitAt || null,
          totalAppointments: lv?.totalAppointments || 0,
          lastMessageAt: t.lastMessageAt || null,
          lastMessageText: t.lastMessageText || '',
          threadId: String(t._id),
        };
      })
      .filter((x) => {
        if (!q) return true;
        const hay = `${x.name} ${x.email} ${x.phone}`.toLowerCase();
        return hay.includes(q);
      });

    return res.json({ items });
  } catch (e) {
    console.error('Failed to load doctor patients:', e);
    res.status(500).json({ error: 'Failed to load patients' });
  }
});

/**
 * GET /api/doctor/patients/:uid
 * Detailed patient view (profile + appointment history with this doctor)
 */
router.get('/patients/:uid', requireFirebaseAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const doctorUid = req.user.uid;
    const patientUid = String(req.params.uid || '').trim();
    if (!patientUid) return res.status(400).json({ error: 'uid required' });

    // Ensure relationship exists (thread or accepted appointment)
    const hasThread = await MessagingThread.exists({ doctorUid, userUid: patientUid });
    const hasAppointment = await Appointment.exists({ doctorUid, userUid: patientUid, status: { $in: ['scheduled', 'completed', 'pending'] } });
    if (!hasThread && !hasAppointment) return res.status(404).json({ error: 'Patient not found' });

    const profiles = await fetchProfiles([patientUid]);
    const patient = profiles.get(patientUid) || { uid: patientUid, name: 'Patient', email: '', phone: '' };

    const appointments = await Appointment.find({ doctorUid, userUid: patientUid })
      .sort({ datetime: -1 })
      .limit(200)
      .lean();

    return res.json({
      patient,
      appointments: appointments.map((a) => ({
        id: String(a._id),
        datetime: a.datetime,
        type: a.type,
        status: a.status,
        notes: a.notes || '',
        createdAt: a.createdAt,
      })),
    });
  } catch (e) {
    console.error('Failed to load patient details:', e);
    res.status(500).json({ error: 'Failed to load patient' });
  }
});

export default router;
