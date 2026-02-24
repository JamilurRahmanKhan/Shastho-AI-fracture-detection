/**
 * Backend route: index
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the index feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import xrays from './xrays.js';
import chat from './chat.js';
import medications from './medications.js';
import appointments from './appointments.js';
import messaging from './messaging.js';
import availability from './availability.js';
import records from './records.js';
import medicalRecords from './medicalRecords.js';
import doctors from './doctors.js';
import pharmacyInventory from './pharmacyInventory.js';
import store from './store.js';
import pharmacyOrders from './pharmacyOrders.js';
import pharmacyDeliveries from './pharmacyDeliveries.js';
import pharmacyReports from './pharmacyReports.js';
import pharmacySettings from './pharmacySettings.js';
import notifications from './notifications.js';
import adminStore from './adminStore.js';
import doctorPanel from './doctorPanel.js';
import roleRequests from './roleRequests.js';
import adminAnalytics from './adminAnalytics.js';
import adminSettings from './adminSettings.js';
import adminSubscriptions from './adminSubscriptions.js';
import subscriptions from './subscriptions.js';
import episodes from './episodes.js';
import shareApi from './shareApi.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const dbReady = Boolean(req.app?.locals?.dbReady);
  res.json({ ok: true, dbReady });
});

// Firestore-backed routes should remain available even if MongoDB is down.
router.use('/role-requests', roleRequests);
router.use('/admin/analytics', adminAnalytics);
router.use('/admin/settings', adminSettings);
router.use('/admin/subscriptions', adminSubscriptions);

// If DB is down, keep API responsive but return a clear 503 for data routes.
const requireDb = (req, res, next) => {
  const dbReady = Boolean(req.app?.locals?.dbReady);
  if (!dbReady) return res.status(503).json({ error: 'Database unavailable. Check MongoDB connection/DNS and try again.' });
  next();
};

router.use(requireDb);

router.use('/xrays', xrays);
router.use('/chat', chat);
router.use('/medications', medications);
router.use('/appointments', appointments);
router.use('/messaging', messaging);
router.use('/availability', availability);
router.use('/records', records);
router.use('/medical-records', medicalRecords);
router.use('/doctors', doctors);

// Doctor panel data (dashboard + patients)
router.use('/doctor', doctorPanel);

// Pharmacy panel inventory management (MongoDB)
router.use('/pharmacy/inventory', pharmacyInventory);

// User-facing medical store (MongoDB)
router.use('/store', store);

// Pharmacy fulfillment orders
router.use('/pharmacy/orders', pharmacyOrders);

// Pharmacy delivery management (Phase 9+)
router.use('/pharmacy/deliveries', pharmacyDeliveries);
router.use('/pharmacy/reports', pharmacyReports);
router.use('/pharmacy/settings', pharmacySettings);

// In-app notifications (Phase 9)
router.use('/notifications', notifications);

// Injury episodes (used by subscription plans + reporting)
router.use('/episodes', episodes);

// Subscription / entitlement APIs (episode plans + trial + packs)
router.use('/subscriptions', subscriptions);

// Share link revoke endpoint (API)
router.use('/share', shareApi);


// Admin store tools (Phase 9)
router.use('/admin/store', adminStore);

export default router;
