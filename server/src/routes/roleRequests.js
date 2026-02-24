/**
 * Backend route: roleRequests
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the roleRequests feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

const ALLOWED_REQUESTED_ROLES = new Set(['user', 'doctor', 'pharmacy', 'admin']);

function normRole(v) {
  return String(v || '').trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

async function getUserProfile(admin, uid) {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  return snap.exists ? snap.data() : null;
}

// Create a role request (used by sign-up and by the user "Request Role" flow)
router.post('/', requireFirebaseAuth, async (req, res) => {
  try {
    const admin = initFirebaseAdmin();
    const uid = req.user.uid;

    const requestedRole = normRole(req.body?.requestedRole || req.body?.role || 'user');
    if (!ALLOWED_REQUESTED_ROLES.has(requestedRole)) {
      return res.status(400).json({ error: 'Invalid requestedRole' });
    }

    // Basic payload
    const profile = await getUserProfile(admin, uid);
    const email = req.user.email || profile?.email || '';
    const fullName = String(req.body?.fullName || profile?.name || profile?.displayName || '').trim();
    const organization = String(req.body?.organization || '').trim();
    const licenseNumber = String(req.body?.licenseNumber || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const documents = Array.isArray(req.body?.documents) ? req.body.documents.slice(0, 5) : [];
    const source = String(req.body?.source || 'signup'); // signup | request_role | admin_created

    // De-dupe: if there is already a pending request for this uid+requestedRole, return it.
    const existingSnap = await admin
      .firestore()
      .collection('role_requests')
      .where('uid', '==', uid)
      .where('requestedRole', '==', requestedRole)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const d = existingSnap.docs[0];
      return res.json({ ok: true, id: d.id, roleRequest: { id: d.id, ...d.data() } });
    }

    const payload = {
      uid,
      email,
      fullName,
      phone,
      requestedRole,
      organization,
      licenseNumber,
      documents,
      status: 'pending',
      seen: false,
      source,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await admin.firestore().collection('role_requests').add(payload);
    return res.status(201).json({ ok: true, id: ref.id, roleRequest: { id: ref.id, ...payload, createdAt: nowIso() } });
  } catch (e) {
    console.error('Create role request failed:', e);
    return res.status(500).json({ error: 'Failed to create role request' });
  }
});

// Current user's last role requests (for the user panel)
router.get('/me', requireFirebaseAuth, async (req, res) => {
  try {
    const admin = initFirebaseAdmin();
    const uid = req.user.uid;
    const snap = await admin
      .firestore()
      .collection('role_requests')
      .where('uid', '==', uid)
      .limit(25)
      .get();

    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });

    return res.json({ ok: true, items: list });
  } catch (e) {
    console.error('List my role requests failed:', e);
    return res.status(500).json({ error: 'Failed to load role requests' });
  }
});

// Admin: summary counts (used for badges/notifications)
router.get('/summary', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const admin = initFirebaseAdmin();
    const col = admin.firestore().collection('role_requests');

    const [pending, pendingUnseen, approved, rejected] = await Promise.all([
      col.where('status', '==', 'pending').get(),
      col.where('status', '==', 'pending').where('seen', '==', false).get(),
      col.where('status', '==', 'approved').get(),
      col.where('status', '==', 'rejected').get(),
    ]);

    return res.json({
      ok: true,
      counts: {
        pending: pending.size,
        pendingUnseen: pendingUnseen.size,
        approved: approved.size,
        rejected: rejected.size,
      },
    });
  } catch (e) {
    console.error('Role request summary failed:', e);
    return res.status(500).json({ error: 'Failed to load summary' });
  }
});

// Admin: list requests
router.get('/', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const admin = initFirebaseAdmin();

    const status = normRole(req.query?.status || 'pending');
    const role = normRole(req.query?.role || 'all');
    const seen = String(req.query?.seen || 'all').toLowerCase();
    const limit = Math.min(500, Math.max(1, Number(req.query?.limit || 200)));
    const search = String(req.query?.search || '').trim().toLowerCase();

    let q = admin.firestore().collection('role_requests');
    if (status && ['pending', 'approved', 'rejected'].includes(status)) q = q.where('status', '==', status);
    if (role && role !== 'all') q = q.where('requestedRole', '==', role);
    if (seen === 'true') q = q.where('seen', '==', true);
    if (seen === 'false') q = q.where('seen', '==', false);

    // Avoid index requirements by not ordering server-side.
    const snap = await q.limit(limit).get();
    let items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });

    if (search) {
      items = items.filter((r) => {
        const hay = `${r.fullName || ''} ${r.email || ''} ${r.licenseNumber || ''} ${r.organization || ''}`.toLowerCase();
        return hay.includes(search);
      });
    }

    return res.json({ ok: true, items });
  } catch (e) {
    console.error('List role requests failed:', e);
    return res.status(500).json({ error: 'Failed to load role requests' });
  }
});

// Admin: mark seen/unseen
router.patch('/:id/seen', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const admin = initFirebaseAdmin();
    const id = req.params.id;
    const nextSeen = Boolean(req.body?.seen);
    await admin.firestore().doc(`role_requests/${id}`).set(
      {
        seen: nextSeen,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('Update seen failed:', e);
    return res.status(500).json({ error: 'Failed to update seen flag' });
  }
});

// Admin: approve
router.patch('/:id/approve', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const admin = initFirebaseAdmin();
    const id = req.params.id;
    const ref = admin.firestore().doc(`role_requests/${id}`);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Role request not found' });

    const data = snap.data();
    if ((data?.status || '') !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

    const requestedRole = normRole(data?.requestedRole || 'user');
    const uid = data?.uid;
    if (!uid) return res.status(400).json({ error: 'Invalid request (missing uid)' });

    // Update user role
    await admin.firestore().doc(`users/${uid}`).set(
      {
        role: requestedRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await ref.set(
      {
        status: 'approved',
        seen: true,
        reviewedByUid: req.user.uid,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        notes: String(req.body?.notes || '').trim(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error('Approve role request failed:', e);
    return res.status(500).json({ error: 'Failed to approve role request' });
  }
});

// Admin: reject
router.patch('/:id/reject', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const admin = initFirebaseAdmin();
    const id = req.params.id;
    const ref = admin.firestore().doc(`role_requests/${id}`);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Role request not found' });

    const data = snap.data();
    if ((data?.status || '') !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

    await ref.set(
      {
        status: 'rejected',
        seen: true,
        rejectReason: String(req.body?.reason || '').trim(),
        reviewedByUid: req.user.uid,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('Reject role request failed:', e);
    return res.status(500).json({ error: 'Failed to reject role request' });
  }
});

export default router;
