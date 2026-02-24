/**
 * Backend: firebaseAdmin
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Server entrypoint and core backend wiring for ShasthoAI.
 *
 * Project-specific notes:
 * - (none)
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

export function initFirebaseAdmin() {
  if (admin.apps.length) return admin;

  // Prefer env var, but fall back to the repo default so local
  // development works out-of-the-box.
  const relPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'secrets/firebase-admin.json';

  // Resolve relative to server root
  const absPath = path.isAbsolute(relPath)
    ? relPath
    : path.resolve(process.cwd(), relPath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Firebase service account file not found at: ${absPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(absPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
}
