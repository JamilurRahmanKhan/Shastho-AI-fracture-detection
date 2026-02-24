/**
 * Backend route: adminSettings
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the adminSettings feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

const DEFAULT_SETTINGS = {
  branding: {
    appName: 'ShasthoAI',
    tagline: 'AI-powered fracture detection and telemedicine-ready workflows',
  },
  contact: {
    supportEmail: 'support@shasthoai.com',
    phone: '+1 (555) 123-4567',
    address: '123 Medical Center Drive, Healthcare City, HC 12345',
  },
  features: {
    telemedicine: true,
    store: true,
    pharmacyPanel: true,
    doctorPanel: true,
    messaging: true,
  },
  security: {
    maintenanceMode: false,
  },
  updatedAt: null,
  updatedBy: '',
};

function deepMerge(base, patch) {
  if (typeof base !== 'object' || base === null) return patch;
  const out = Array.isArray(base) ? [...base] : { ...base };
  Object.entries(patch || {}).forEach(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(base[k] || {}, v);
    } else {
      out[k] = v;
    }
  });
  return out;
}

router.get('/', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  const admin = initFirebaseAdmin();
  const db = admin.firestore();

  const ref = db.collection('platform_settings').doc('main');
  const snap = await ref.get();
  const stored = snap.exists ? snap.data() : {};
  const merged = deepMerge(DEFAULT_SETTINGS, stored || {});

  res.json({ ok: true, settings: merged });
});

router.put('/', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  const admin = initFirebaseAdmin();
  const db = admin.firestore();

  const patch = req.body || {};

  // Basic allow-list validation (prevents arbitrary keys from being written)
  const allowed = {
    branding: ['appName', 'tagline'],
    contact: ['supportEmail', 'phone', 'address'],
    features: ['telemedicine', 'store', 'pharmacyPanel', 'doctorPanel', 'messaging'],
    security: ['maintenanceMode'],
  };

  const clean = {};
  for (const section of Object.keys(allowed)) {
    if (!patch[section] || typeof patch[section] !== 'object') continue;
    clean[section] = {};
    for (const key of allowed[section]) {
      if (typeof patch[section][key] === 'undefined') continue;
      clean[section][key] = patch[section][key];
    }
  }

  const ref = db.collection('platform_settings').doc('main');
  await ref.set(
    {
      ...clean,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user?.uid || '',
    },
    { merge: true }
  );

  const snap = await ref.get();
  const merged = deepMerge(DEFAULT_SETTINGS, snap.data() || {});
  res.json({ ok: true, settings: merged });
});

export default router;
