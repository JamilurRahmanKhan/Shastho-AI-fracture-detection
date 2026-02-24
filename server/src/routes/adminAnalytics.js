/**
 * Backend route: adminAnalytics
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the adminAnalytics feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';

// MongoDB models (these routes should still respond if MongoDB is down)
import { XrayCase } from '../models/XrayCase.js';
import { Appointment } from '../models/Appointment.js';
import { StoreOrder } from '../models/StoreOrder.js';
import { PharmacyOrder } from '../models/PharmacyOrder.js';

const router = express.Router();

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

async function safeCountAggregate(queryOrRef) {
  // Firestore aggregation count() is available in recent firebase-admin versions.
  try {
    const snap = await queryOrRef.count().get();
    return Number(snap?.data()?.count || 0);
  } catch {
    // Fallback: read up to 10k docs (for small dev datasets). Not ideal for prod,
    // but prevents a hard crash if count() is unavailable.
    const snap = await queryOrRef.limit(10000).get();
    return Number(snap?.size || 0);
  }
}

async function buildTimeseriesMongo(model, dateField, days) {
  const now = new Date();
  const start = startOfDay(addDays(now, -(days - 1)));

  // group by day
  const rows = await model.aggregate([
    { $match: { [dateField]: { $gte: start, $lte: now } } },
    {
      $group: {
        _id: {
          y: { $year: `$${dateField}` },
          m: { $month: `$${dateField}` },
          d: { $dayOfMonth: `$${dateField}` },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
  ]);

  const map = new Map();
  rows.forEach((r) => {
    const mm = String(r._id.m).padStart(2, '0');
    const dd = String(r._id.d).padStart(2, '0');
    const key = `${r._id.y}-${mm}-${dd}`;
    map.set(key, r.count);
  });

  const out = [];
  for (let i = 0; i < days; i++) {
    const day = startOfDay(addDays(start, i));
    const key = day.toISOString().slice(0, 10);
    out.push({ date: key, count: Number(map.get(key) || 0) });
  }
  return out;
}

router.get('/summary', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  const admin = initFirebaseAdmin();
  const db = admin.firestore();

  const rangeDays = Math.max(7, Math.min(90, Number(req.query.rangeDays || 30)));
  const now = new Date();
  const rangeStart = startOfDay(addDays(now, -(rangeDays - 1)));

  // Firestore counts
  const usersRef = db.collection('users');
  const roleReqRef = db.collection('role_requests');

  const [
    usersTotal,
    usersDoctors,
    usersPharmacies,
    usersAdmins,
    roleReqPending,
    roleReqPendingUnseen,
    roleReqApproved,
    roleReqRejected,
  ] = await Promise.all([
    safeCountAggregate(usersRef),
    safeCountAggregate(usersRef.where('role', '==', 'doctor')),
    safeCountAggregate(usersRef.where('role', '==', 'pharmacy')),
    safeCountAggregate(usersRef.where('role', '==', 'admin')),
    safeCountAggregate(roleReqRef.where('status', '==', 'pending')),
    safeCountAggregate(roleReqRef.where('status', '==', 'pending').where('seen', '==', false)),
    safeCountAggregate(roleReqRef.where('status', '==', 'approved')),
    safeCountAggregate(roleReqRef.where('status', '==', 'rejected')),
  ]);

  // Role request timeseries (Firestore)
  // We keep it simple: load within range and bucket in memory.
  // NOTE: For large datasets, a dedicated analytics pipeline would be preferable.
  const roleReqSnap = await roleReqRef
    .where('createdAt', '>=', rangeStart)
    .orderBy('createdAt', 'asc')
    .get();
  const roleMap = new Map();
  roleReqSnap.forEach((doc) => {
    const data = doc.data() || {};
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    if (!ts) return;
    const key = ts.toISOString().slice(0, 10);
    roleMap.set(key, (roleMap.get(key) || 0) + 1);
  });
  const roleRequestSeries = [];
  for (let i = 0; i < rangeDays; i++) {
    const day = startOfDay(addDays(rangeStart, i));
    const key = day.toISOString().slice(0, 10);
    roleRequestSeries.push({ date: key, count: Number(roleMap.get(key) || 0) });
  }

  // MongoDB counts (only if DB is ready)
  const dbReady = Boolean(req.app?.locals?.dbReady);
  const mongo = { available: dbReady };
  if (dbReady) {
    const [
      xrayTotal,
      xrayInRange,
      apptTotal,
      apptInRange,
      storeOrdersTotal,
      storeOrdersInRange,
      pharmacyOrdersTotal,
      pharmacyOrdersInRange,
    ] = await Promise.all([
      XrayCase.countDocuments(),
      XrayCase.countDocuments({ createdAt: { $gte: rangeStart, $lte: now } }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ createdAt: { $gte: rangeStart, $lte: now } }),
      StoreOrder.countDocuments(),
      StoreOrder.countDocuments({ createdAt: { $gte: rangeStart, $lte: now } }),
      PharmacyOrder.countDocuments(),
      PharmacyOrder.countDocuments({ createdAt: { $gte: rangeStart, $lte: now } }),
    ]);

    // Timeseries
    const [xraySeries, apptSeries, orderSeries] = await Promise.all([
      buildTimeseriesMongo(XrayCase, 'createdAt', rangeDays),
      buildTimeseriesMongo(Appointment, 'createdAt', rangeDays),
      buildTimeseriesMongo(StoreOrder, 'createdAt', rangeDays),
    ]);

    mongo.counts = {
      xrays: { total: xrayTotal, inRange: xrayInRange },
      appointments: { total: apptTotal, inRange: apptInRange },
      storeOrders: { total: storeOrdersTotal, inRange: storeOrdersInRange },
      pharmacyOrders: { total: pharmacyOrdersTotal, inRange: pharmacyOrdersInRange },
    };
    mongo.series = {
      xrays: xraySeries,
      appointments: apptSeries,
      storeOrders: orderSeries,
    };
  }

  res.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    rangeDays,
    firestore: {
      users: {
        total: usersTotal,
        byRole: {
          admin: usersAdmins,
          doctor: usersDoctors,
          pharmacy: usersPharmacies,
        },
      },
      roleRequests: {
        pending: roleReqPending,
        pendingUnseen: roleReqPendingUnseen,
        approved: roleReqApproved,
        rejected: roleReqRejected,
        series: roleRequestSeries,
      },
    },
    mongo,
  });
});

export default router;
