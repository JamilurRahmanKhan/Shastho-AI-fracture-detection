/**
 * Backend middleware: requireFirebaseAuth
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express middleware used to enforce authentication/authorization, rate limiting, and request guards.
 *
 * Project-specific notes:
 * - (none)
 */

import { initFirebaseAdmin } from '../config/firebaseAdmin.js';

export async function requireFirebaseAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const admin = initFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      claims: decoded,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', details: err.message });
  }
}
