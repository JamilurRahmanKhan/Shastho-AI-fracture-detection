/**
 * Backend route: pharmacyOrders
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the pharmacyOrders feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { PharmacyOrder } from '../models/PharmacyOrder.js';
import { StoreOrder } from '../models/StoreOrder.js';
import { PharmacyInventoryItem } from '../models/PharmacyInventoryItem.js';
import { createNotification, sendEmailBestEffort, getEmailForUid } from '../lib/notifications.js';

const router = express.Router();

function getPrescriptionBucket() {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('MongoDB connection not ready');
  return new GridFSBucket(db, { bucketName: 'store_prescriptions' });
}

router.use(requireFirebaseAuth);
router.use(requireRole('pharmacy'));

async function recomputeStoreOrderStatus(storeOrderId) {
  // Derive StoreOrder.status from per-pharmacy fulfillment states.
  const pos = await PharmacyOrder.find({ storeOrderId }).select('status').lean();
  if (!pos.length) return;
  const statuses = pos.map((p) => p.status);

  let next = 'placed';
  const allCancelled = statuses.every((s) => s === 'cancelled');
  const allDone = statuses.every((s) => s === 'delivered' || s === 'cancelled');
  const anyDelivered = statuses.some((s) => s === 'delivered');
  const anyShipped = statuses.some((s) => s === 'shipped');
  const anyAccepted = statuses.some((s) => s === 'accepted');

  if (allCancelled) next = 'cancelled';
  else if (allDone && anyDelivered) next = 'delivered';
  else if (anyShipped) next = 'shipped';
  else if (anyAccepted) next = 'processing';
  else next = 'placed';

  await StoreOrder.updateOne({ _id: storeOrderId }, { $set: { status: next } });
}

async function recomputeStorePrescriptionStatus(storeOrderId) {
  const pos = await PharmacyOrder.find({ storeOrderId }).select('items prescription.status').lean();
  if (!pos.length) return;

  const rxOrders = pos.filter((p) => (p.items || []).some((it) => Boolean(it.requiresPrescription)));
  if (!rxOrders.length) {
    await StoreOrder.updateOne({ _id: storeOrderId }, { $set: { 'prescription.status': 'not_required' } });
    return;
  }

  const statuses = rxOrders.map((p) => p?.prescription?.status || 'pending');
  let next = 'pending';
  if (statuses.some((s) => s === 'rejected')) next = 'rejected';
  else if (statuses.every((s) => s === 'approved')) next = 'approved';
  else next = 'pending';

  await StoreOrder.updateOne({ _id: storeOrderId }, { $set: { 'prescription.status': next } });
}

async function recomputeStorePaymentStatus(storeOrderId) {
  // Derive StoreOrder.paymentStatus from per-pharmacy paymentStatus.
  const pos = await PharmacyOrder.find({ storeOrderId }).select('paymentStatus').lean();
  if (!pos.length) return;
  const statuses = pos.map((p) => String(p.paymentStatus || 'pending'));

  let next = 'pending';
  if (statuses.some((s) => s === 'failed')) next = 'failed';
  else if (statuses.every((s) => s === 'paid')) next = 'paid';
  else if (statuses.every((s) => s === 'refunded')) next = 'refunded';
  else next = 'pending';

  await StoreOrder.updateOne({ _id: storeOrderId }, { $set: { paymentStatus: next } });
}

// GET /api/pharmacy/orders
router.get('/', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { status = '' } = req.query;
    const filter = { pharmacyUid };
    if (status) filter.status = status;
    const orders = await PharmacyOrder.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ items: orders.map((o) => ({ id: String(o._id), ...o })) });
  } catch (e) {
    console.error('Failed to list pharmacy orders:', e);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

// GET /api/pharmacy/orders/:idOrNo
router.get('/:idOrNo', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { idOrNo } = req.params;
    const filter = { pharmacyUid };
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;
    const order = await PharmacyOrder.findOne(filter).lean();
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json({ id: String(order._id), ...order });
  } catch (e) {
    console.error('Failed to get pharmacy order:', e);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// GET /api/pharmacy/orders/:idOrNo/prescription
// Streams the prescription attached to this pharmacy order, if any.
router.get('/:idOrNo/prescription', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { idOrNo } = req.params;
    const filter = { pharmacyUid };
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;

    const order = await PharmacyOrder.findOne(filter).lean();
    if (!order) return res.status(404).json({ error: 'Not found' });
    const fileId = order?.prescription?.fileId;
    if (!fileId) return res.status(404).json({ error: 'No prescription attached' });

    const bucket = getPrescriptionBucket();
    const fid = new mongoose.Types.ObjectId(String(fileId));
    const files = await mongoose.connection.db
      .collection('store_prescriptions.files')
      .find({ _id: fid })
      .limit(1)
      .toArray();
    const file = files?.[0] || null;
    if (!file) return res.status(404).json({ error: 'No prescription attached' });

    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    const filename = file.filename || 'prescription';
    res.setHeader('Content-Disposition', `inline; filename="${String(filename).replace(/\"/g, '')}"`);

    const dl = bucket.openDownloadStream(fid);
    dl.on('error', () => res.status(404).end());
    dl.pipe(res);
  } catch (e) {
    console.error('Failed to stream prescription:', e);
    res.status(500).json({ error: 'Failed to stream prescription' });
  }
});

// PATCH /api/pharmacy/orders/:idOrNo/prescription { status: approved|rejected, rejectionReason? }
router.patch('/:idOrNo/prescription', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { idOrNo } = req.params;
    const status = String(req.body?.status || '').trim();
    const rejectionReason = String(req.body?.rejectionReason || '').trim();
    const allowed = new Set(['approved', 'rejected']);
    if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid prescription status' });

    const filter = { pharmacyUid };
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;

    const existing = await PharmacyOrder.findOne(filter);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const hasRx = (existing.items || []).some((it) => Boolean(it.requiresPrescription));
    if (!hasRx) return res.status(400).json({ error: 'This order does not require a prescription' });
    if (!existing.prescription?.fileId) return res.status(400).json({ error: 'No prescription has been uploaded by the user yet' });

    const now = new Date();
    const set = {
      'prescription.status': status,
      'prescription.reviewedByUid': pharmacyUid,
      'prescription.reviewedAt': now,
      'prescription.rejectionReason': status === 'rejected' ? (rejectionReason || 'Rejected') : '',
    };

    const updated = await PharmacyOrder.findOneAndUpdate(filter, { $set: set }, { new: true }).lean();
    await recomputeStorePrescriptionStatus(existing.storeOrderId);

    // Phase 9: notify the user about prescription decision
    try {
      const userUid = existing.userUid;
      const userEmail = await getEmailForUid(userUid);
      const human = status === 'approved' ? 'approved' : 'rejected';
      const reasonTxt = status === 'rejected' ? ` Reason: ${set['prescription.rejectionReason']}` : '';
      await createNotification({
        targetUid: userUid,
        targetRole: 'user',
        type: 'rx_status',
        title: `Prescription ${human} for ${existing.orderNo}`,
        message: `Your prescription for order ${existing.orderNo} was ${human}.${reasonTxt}`,
        data: { pharmacyOrderNo: existing.orderNo, storeOrderId: String(existing.storeOrderId) },
      });
      await sendEmailBestEffort(
        userEmail,
        `ShasthoAI: Prescription ${human} (${existing.orderNo})`,
        `Your prescription for order ${existing.orderNo} was ${human}.${reasonTxt}`
      );
    } catch (e) {
      console.error('User prescription notification failed (non-blocking):', e);
    }
    res.json({ id: String(updated._id), ...updated });
  } catch (e) {
    console.error('Failed to update prescription status:', e);
    res.status(500).json({ error: 'Failed to update prescription status' });
  }
});

// PATCH /api/pharmacy/orders/:idOrNo/payment { paymentStatus }
// Pharmacy can update payment state (COD payment collected, etc.).
router.patch('/:idOrNo/payment', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { idOrNo } = req.params;
    const paymentStatus = String(req.body?.paymentStatus || req.body?.status || '').trim();
    const allowed = new Set(['pending', 'paid', 'failed', 'refunded']);
    if (!allowed.has(paymentStatus)) return res.status(400).json({ error: 'Invalid payment status' });

    const filter = { pharmacyUid };
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;

    const existing = await PharmacyOrder.findOne(filter);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Industry standard guardrails for COD:
    // - mark preventing "paid" before delivery is confirmed.
    if (paymentStatus === 'paid') {
      const delivered = existing.status === 'delivered' || existing?.delivery?.status === 'delivered';
      if (!delivered) {
        return res.status(400).json({ error: 'For COD, payment can be marked as paid only after delivery.' });
      }
    }

    // Simple refund guard
    if (paymentStatus === 'refunded' && existing.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Only paid orders can be refunded.' });
    }

    const updated = await PharmacyOrder.findOneAndUpdate(
      filter,
      { $set: { paymentStatus } },
      { new: true }
    ).lean();

    await recomputeStorePaymentStatus(existing.storeOrderId);

    // Notify user (non-blocking)
    try {
      const userUid = existing.userUid;
      const userEmail = await getEmailForUid(userUid);
      await createNotification({
        targetUid: userUid,
        targetRole: 'user',
        type: 'payment_status',
        title: `Payment updated for ${existing.orderNo}`,
        message: `Payment status for your order ${existing.orderNo} is now: ${paymentStatus}.`,
        data: { pharmacyOrderNo: existing.orderNo, storeOrderId: String(existing.storeOrderId), paymentStatus },
      });
      await sendEmailBestEffort(
        userEmail,
        `ShasthoAI: Payment status updated (${existing.orderNo})`,
        `Payment status for your order ${existing.orderNo} is now: ${paymentStatus}.`
      );
    } catch (e) {
      console.error('Payment notification failed (non-blocking):', e);
    }

    res.json({ id: String(updated._id), ...updated });
  } catch (e) {
    console.error('Failed to update payment status:', e);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// PATCH /api/pharmacy/orders/:idOrNo { status }
router.patch('/:idOrNo', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { idOrNo } = req.params;
    const status = String(req.body?.status || '').trim();
    const cancelReason = String(req.body?.cancelReason || '').trim();
    const allowed = new Set(['pending', 'accepted', 'shipped', 'delivered', 'cancelled']);
    if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid status' });

    const filter = { pharmacyUid };
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;

    const existing = await PharmacyOrder.findOne(filter);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Gate shipping/delivery if this order contains Rx-required items.
    const hasRx = (existing.items || []).some((it) => Boolean(it.requiresPrescription));
    if (hasRx && (status === 'shipped' || status === 'delivered')) {
      const ps = existing?.prescription?.status || 'pending';
      if (ps !== 'approved') {
        return res.status(400).json({ error: 'Cannot mark shipped/delivered until prescription is approved.' });
      }
    }

    const prevStatus = existing.status;

    // Build update payload
    const now = new Date();
    const set = { status };
    if (status === 'accepted') set.acceptedAt = existing.acceptedAt || now;
    if (status === 'shipped') set.shippedAt = existing.shippedAt || now;
    if (status === 'delivered') set.deliveredAt = existing.deliveredAt || now;
    if (status === 'cancelled') {
      set.cancelledAt = existing.cancelledAt || now;
      if (cancelReason) set.cancelReason = cancelReason;
    }

    // If cancelling for the first time, restore stock for this pharmacy order's items.
    if (status === 'cancelled' && prevStatus !== 'cancelled' && !existing.stockRestoredOnCancel) {
      for (const it of existing.items) {
        try {
          await PharmacyInventoryItem.updateOne(
            { _id: it.productId, pharmacyUid },
            { $inc: { stockQuantity: Number(it.quantity || 0) } }
          );
        } catch (e) {
          console.error('Failed to restore stock for', it.productId, e);
        }
      }
      set.stockRestoredOnCancel = true;
    }

    const updated = await PharmacyOrder.findOneAndUpdate(filter, { $set: set }, { new: true }).lean();
    // Update master order status based on all per-pharmacy orders
    await recomputeStoreOrderStatus(existing.storeOrderId);

    // Phase 9: notify user on status change (non-blocking)
    try {
      if (prevStatus !== status) {
        const userUid = existing.userUid;
        const userEmail = await getEmailForUid(userUid);
        await createNotification({
          targetUid: userUid,
          targetRole: 'user',
          type: 'store_order_status',
          title: `Order update: ${updated.orderNo}`,
          message: `Your pharmacy order ${updated.orderNo} status changed from ${prevStatus} to ${status}.`,
          data: { pharmacyOrderId: String(updated._id), pharmacyOrderNo: updated.orderNo, storeOrderId: String(existing.storeOrderId) },
        });
        await sendEmailBestEffort(
          userEmail,
          `ShasthoAI: Order status update (${updated.orderNo})`,
          `Your order ${updated.orderNo} status changed from ${prevStatus} to ${status}.`
        );
      }
    } catch (e) {
      console.error('User status notification failed (non-blocking):', e);
    }

    res.json({ id: String(updated._id), ...updated });
  } catch (e) {
    console.error('Failed to update pharmacy order:', e);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;
