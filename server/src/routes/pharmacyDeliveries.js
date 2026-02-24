/**
 * Backend route: pharmacyDeliveries
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the pharmacyDeliveries feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { PharmacyOrder } from '../models/PharmacyOrder.js';
import { StoreOrder } from '../models/StoreOrder.js';
import { DeliveryRider } from '../models/DeliveryRider.js';
import { createNotification, sendEmailBestEffort, getEmailForUid } from '../lib/notifications.js';

const router = express.Router();

router.use(requireFirebaseAuth);
router.use(requireRole('pharmacy'));

const DELIVERY_STATUSES = ['pending_rider', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'returned'];

function normalizeOrderFilter(pharmacyUid, idOrNo) {
  const filter = { pharmacyUid };
  if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
  else filter.orderNo = idOrNo;
  return filter;
}

function pushDeliveryHistory(order, status, byUid, note = '') {
  const now = new Date();
  const hist = order?.delivery?.history || [];
  hist.push({ status, at: now, byUid: byUid || '', note: note || '' });
  return { history: hist, updatedAt: now };
}

async function recomputeStoreOrderStatus(storeOrderId) {
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

// -----------------------------
// Deliveries (per pharmacy)
// -----------------------------

// GET /api/pharmacy/deliveries?status=assigned&q=ORD-123
router.get('/', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const status = String(req.query?.status || '').trim();
    const q = String(req.query?.q || '').trim();

    const filter = { pharmacyUid, status: { $ne: 'cancelled' } };

    // Delivery status filter (backward compatible)
    // Older orders may not have a `delivery` object yet; treat them as `pending_rider`.
    if (status) {
      if (status === 'pending_rider') {
        filter.$or = [
          { 'delivery.status': 'pending_rider' },
          { delivery: { $exists: false } },
          { 'delivery.status': { $exists: false } },
        ];
      } else {
        filter['delivery.status'] = status;
      }
    }

    if (q) filter.orderNo = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const orders = await PharmacyOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Ensure every order has a delivery object (backward compatibility)
    const items = orders.map((o) => {
      const delivery = o.delivery || { status: 'pending_rider', riderName: '', riderPhone: '', etaMinutes: null };
      return {
        id: String(o._id),
        orderNo: o.orderNo,
        userUid: o.userUid,
        shippingAddress: o.shippingAddress,
        phone: o.phone,
        orderStatus: o.status,
        delivery,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
    });

    res.json({ items });
  } catch (e) {
    console.error('Failed to list deliveries:', e);
    res.status(500).json({ error: 'Failed to list deliveries' });
  }
});

// -----------------------------
// Riders (CRUD)
// -----------------------------

// GET /api/pharmacy/deliveries/riders
router.get('/riders', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const riders = await DeliveryRider.find({ pharmacyUid }).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ items: riders.map((r) => ({ id: String(r._id), ...r })) });
  } catch (e) {
    console.error('Failed to list riders:', e);
    res.status(500).json({ error: 'Failed to list riders' });
  }
});

// POST /api/pharmacy/deliveries/riders
router.post('/riders', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const name = String(req.body?.name || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const vehicleType = String(req.body?.vehicleType || '').trim();
    const notes = String(req.body?.notes || '').trim();
    if (!name) return res.status(400).json({ error: 'Rider name is required' });

    const created = await DeliveryRider.create({ pharmacyUid, name, phone, vehicleType, notes, isActive: true });
    res.status(201).json({ id: String(created._id), ...created.toObject() });
  } catch (e) {
    console.error('Failed to create rider:', e);
    res.status(500).json({ error: 'Failed to create rider' });
  }
});

// PATCH /api/pharmacy/deliveries/riders/:id
router.patch('/riders/:id', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid rider id' });

    const set = {};
    if (typeof req.body?.name !== 'undefined') set.name = String(req.body.name || '').trim();
    if (typeof req.body?.phone !== 'undefined') set.phone = String(req.body.phone || '').trim();
    if (typeof req.body?.vehicleType !== 'undefined') set.vehicleType = String(req.body.vehicleType || '').trim();
    if (typeof req.body?.notes !== 'undefined') set.notes = String(req.body.notes || '').trim();
    if (typeof req.body?.isActive !== 'undefined') set.isActive = Boolean(req.body.isActive);
    if (set.name === '') return res.status(400).json({ error: 'Rider name cannot be empty' });

    const updated = await DeliveryRider.findOneAndUpdate({ _id: id, pharmacyUid }, { $set: set }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ id: String(updated._id), ...updated });
  } catch (e) {
    console.error('Failed to update rider:', e);
    res.status(500).json({ error: 'Failed to update rider' });
  }
});

// DELETE /api/pharmacy/deliveries/riders/:id
router.delete('/riders/:id', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid rider id' });

    const inUse = await PharmacyOrder.findOne({ pharmacyUid, 'delivery.riderId': id, status: { $ne: 'cancelled' } }).select('_id').lean();
    if (inUse) return res.status(400).json({ error: 'Cannot delete rider: rider is currently assigned to an active delivery.' });

    const ok = await DeliveryRider.deleteOne({ _id: id, pharmacyUid });
    if (!ok?.deletedCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete rider:', e);
    res.status(500).json({ error: 'Failed to delete rider' });
  }
});

// -----------------------------
// Delivery actions
// -----------------------------

// POST /api/pharmacy/deliveries/:idOrNo/assign { riderId, etaMinutes? }
router.post('/:idOrNo/assign', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { idOrNo } = req.params;
    const riderId = String(req.body?.riderId || '').trim();
    const etaMinutes = req.body?.etaMinutes === null || typeof req.body?.etaMinutes === 'undefined' ? null : Number(req.body.etaMinutes);
    if (!mongoose.isValidObjectId(riderId)) return res.status(400).json({ error: 'Invalid riderId' });

    const rider = await DeliveryRider.findOne({ _id: riderId, pharmacyUid }).lean();
    if (!rider) return res.status(404).json({ error: 'Rider not found' });
    if (!rider.isActive) return res.status(400).json({ error: 'Rider is not active' });

    const filter = normalizeOrderFilter(pharmacyUid, idOrNo);
    const existing = await PharmacyOrder.findOne(filter);
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status === 'cancelled') return res.status(400).json({ error: 'Cancelled orders cannot be delivered' });

    const hist = pushDeliveryHistory(existing, 'assigned', pharmacyUid, 'Rider assigned');
    const set = {
      'delivery.status': 'assigned',
      'delivery.riderId': new mongoose.Types.ObjectId(riderId),
      'delivery.riderName': rider.name,
      'delivery.riderPhone': rider.phone || '',
      'delivery.etaMinutes': Number.isFinite(etaMinutes) ? Math.max(0, etaMinutes) : null,
      'delivery.updatedAt': hist.updatedAt,
      'delivery.history': hist.history,
    };

    const updated = await PharmacyOrder.findOneAndUpdate(filter, { $set: set }, { new: true }).lean();

    // Notify pharmacy (in-app) about assignment (useful for dashboard)
    try {
      await createNotification({
        targetUid: pharmacyUid,
        targetRole: 'pharmacy',
        type: 'delivery_assigned',
        title: `Rider assigned: ${updated.orderNo}`,
        message: `${rider.name} was assigned to deliver order ${updated.orderNo}.`,
        data: { pharmacyOrderNo: updated.orderNo },
      });
    } catch (e) {
      console.error('Pharmacy notify failed (non-blocking):', e);
    }

    res.json({ id: String(updated._id), ...updated });
  } catch (e) {
    console.error('Failed to assign rider:', e);
    res.status(500).json({ error: 'Failed to assign rider' });
  }
});

// PATCH /api/pharmacy/deliveries/:idOrNo/status { status, note?, etaMinutes? }
router.patch('/:idOrNo/status', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { idOrNo } = req.params;
    const next = String(req.body?.status || '').trim();
    const note = String(req.body?.note || '').trim();
    const etaMinutes = req.body?.etaMinutes === null || typeof req.body?.etaMinutes === 'undefined' ? null : Number(req.body.etaMinutes);
    if (!DELIVERY_STATUSES.includes(next)) return res.status(400).json({ error: 'Invalid delivery status' });

    const filter = normalizeOrderFilter(pharmacyUid, idOrNo);
    const existing = await PharmacyOrder.findOne(filter);
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status === 'cancelled') return res.status(400).json({ error: 'Cancelled orders cannot be delivered' });

    // Keep Rx safety: cannot move into shipping/delivery milestones unless prescription is approved.
    const hasRx = (existing.items || []).some((it) => Boolean(it.requiresPrescription));
    if (hasRx && (next === 'out_for_delivery' || next === 'delivered')) {
      const ps = existing?.prescription?.status || 'pending';
      if (ps !== 'approved') {
        return res.status(400).json({ error: 'Cannot deliver until prescription is approved.' });
      }
    }

    const prev = existing?.delivery?.status || 'pending_rider';
    if ((next === 'picked_up' || next === 'out_for_delivery' || next === 'delivered') && !existing?.delivery?.riderId) {
      return res.status(400).json({ error: 'Assign a rider before updating delivery status.' });
    }

    const hist = pushDeliveryHistory(existing, next, pharmacyUid, note);
    const set = {
      'delivery.status': next,
      'delivery.note': note,
      'delivery.etaMinutes': Number.isFinite(etaMinutes) ? Math.max(0, etaMinutes) : existing?.delivery?.etaMinutes ?? null,
      'delivery.updatedAt': hist.updatedAt,
      'delivery.history': hist.history,
    };

    // Align fulfillment status with delivery milestones (industry-standard mapping)
    const now = new Date();
    if (next === 'out_for_delivery' && (existing.status === 'pending' || existing.status === 'accepted')) {
      set.status = 'shipped';
      set.shippedAt = existing.shippedAt || now;
    }
    if (next === 'delivered' && existing.status !== 'delivered') {
      set.status = 'delivered';
      set.deliveredAt = existing.deliveredAt || now;
    }

    const updated = await PharmacyOrder.findOneAndUpdate(filter, { $set: set }, { new: true }).lean();

    // Recompute master store order status if fulfillment changed
    const fulfillmentChanged = Boolean(set.status && set.status !== existing.status);
    if (fulfillmentChanged) await recomputeStoreOrderStatus(existing.storeOrderId);

    // Notify user about delivery changes for key states (best effort)
    const shouldNotifyUser = fulfillmentChanged || ['out_for_delivery', 'delivered', 'failed', 'returned'].includes(next);
    if (shouldNotifyUser) {
      try {
        const userUid = existing.userUid;
        const userEmail = await getEmailForUid(userUid);
        const label = next.replace(/_/g, ' ');
        await createNotification({
          targetUid: userUid,
          targetRole: 'user',
          type: 'delivery_status',
          title: `Delivery update: ${existing.orderNo}`,
          message: `Delivery status for order ${existing.orderNo} changed from ${prev.replace(/_/g, ' ')} to ${label}.`,
          data: { pharmacyOrderNo: existing.orderNo, storeOrderId: String(existing.storeOrderId) },
        });
        await sendEmailBestEffort(
          userEmail,
          `ShasthoAI: Delivery update (${existing.orderNo})`,
          `Delivery status for order ${existing.orderNo} is now: ${label}.`
        );
      } catch (e) {
        console.error('User delivery notification failed (non-blocking):', e);
      }
    }

    res.json({ id: String(updated._id), ...updated });
  } catch (e) {
    console.error('Failed to update delivery status:', e);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

export default router;
