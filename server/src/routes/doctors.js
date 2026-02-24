/**
 * Backend route: doctors
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the doctors feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';

const router = express.Router();

// List doctors from Firestore (users/{uid} docs) where role == 'doctor'.
// This keeps "accounts" in Firebase, while the booking data stays in MongoDB.
router.get('/', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  try {
    const admin = initFirebaseAdmin();
    const snap = await admin.firestore().collection('users').where('role', '==', 'doctor').get();

    const doctors = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        uid: d.id,
        name: data.name || data.displayName || data.fullName || 'Doctor',
        email: data.email || '',
        department: data.department || data.specialty || '',
        // location fields are editable by doctors from their account settings
        location: data.location || data.hospital || data.clinicAddress || '',
        mapsUrl: data.mapsUrl || data.mapUrl || '',
        locationLat: typeof data.locationLat === 'number' ? data.locationLat : null,
        locationLng: typeof data.locationLng === 'number' ? data.locationLng : null,
      };
    });

    res.json(doctors);
  } catch (e) {
    console.error('Failed to list doctors:', e);
    res.status(500).json({ error: 'Failed to list doctors' });
  }
});

export default router;
