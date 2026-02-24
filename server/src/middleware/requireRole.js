/**
 * Backend middleware: requireRole
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express middleware used to enforce authentication/authorization, rate limiting, and request guards.
 *
 * Project-specific notes:
 * - (none)
 */

import { initFirebaseAdmin } from '../config/firebaseAdmin.js';

// Simple in-memory cache to reduce Firestore reads in dev.
const roleCache = new Map();
const TTL_MS = 60_000; // 1 minute

async function getRole(uid) {
  const now = Date.now();
  const cached = roleCache.get(uid);
  if (cached && (now - cached.ts) < TTL_MS) return cached.role;

  const admin = initFirebaseAdmin();
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  // Normalize roles to the expected set: user/doctor/pharmacy/admin
  // (Some Firestore docs may store role in different casing.)
  const raw = snap.exists ? snap.data()?.role : null;
  const role = raw ? String(raw).trim().toLowerCase() : null;
  roleCache.set(uid, { role, ts: now });
  return role;
}

export function requireRole(allowedRoles) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthenticated' });

      const role = await getRole(uid);
      if (!role) return res.status(403).json({ error: 'Account role is missing. Contact an administrator.' });
      if (!allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });

      req.user.role = role;
      next();
    } catch (e) {
      console.error('Role check failed:', e);
      res.status(500).json({ error: 'Role check failed' });
    }
  };
}
