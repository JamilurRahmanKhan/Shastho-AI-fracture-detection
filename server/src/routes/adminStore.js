/**
 * Backend route: adminStore
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the adminStore feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { StoreOrder } from '../models/StoreOrder.js';
import { PharmacyOrder } from '../models/PharmacyOrder.js';
import { PharmacyInventoryItem } from '../models/PharmacyInventoryItem.js';
import { notifyUserAndEmail, getEmailForUid } from '../lib/notifications.js';

const router = express.Router();

router.use(requireFirebaseAuth, requireRole('admin'));

// GET /api/admin/store/orders?status=&q=&limit=50
router.get('/orders', async (req, res) => {
  try {
    const status = String(req.query?.status || '').trim();
    const q = String(req.query?.q || '').trim();
    const limit = Math.min(200, Math.max(1, Number(req.query?.limit || 50)));

    const filter = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { orderNo: { $regex: q, $options: 'i' } },
        { userUid: { $regex: q, $options: 'i' } },
      ];
    }

    const items = await StoreOrder.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ items: items.map((o) => ({ id: String(o._id), ...o })) });
  } catch (e) {
    console.error('Admin list store orders failed:', e);
    res.status(500).json({ error: 'Failed to list store orders' });
  }
});

// GET /api/admin/store/orders/:idOrNo
router.get('/orders/:idOrNo', async (req, res) => {
  try {
    const { idOrNo } = req.params;
    const filter = {};
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;

    const order = await StoreOrder.findOne(filter).lean();
    if (!order) return res.status(404).json({ error: 'Not found' });

    const pharmacyOrders = await PharmacyOrder.find({ storeOrderId: order._id }).sort({ createdAt: 1 }).lean();
    res.json({
      order: { id: String(order._id), ...order },
      pharmacyOrders: pharmacyOrders.map((p) => ({ id: String(p._id), ...p })),
    });
  } catch (e) {
    console.error('Admin get store order failed:', e);
    res.status(500).json({ error: 'Failed to get store order' });
  }
});

// POST /api/admin/store/orders/:idOrNo/cancel { reason? }
// Best-effort safe cancellation: marks pharmacy orders cancelled + restores stock if needed.
router.post('/orders/:idOrNo/cancel', async (req, res) => {
  try {
    const { idOrNo } = req.params;
    const reason = String(req.body?.reason || 'Cancelled by admin').trim();
    const filter = {};
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;

    const storeOrder = await StoreOrder.findOne(filter);
    if (!storeOrder) return res.status(404).json({ error: 'Not found' });

    // If already terminal, do nothing.
    const terminal = new Set(['cancelled', 'delivered']);
    if (terminal.has(String(storeOrder.status || '').toLowerCase())) {
      return res.json({ ok: true, already: true, status: storeOrder.status });
    }

    const pharmacyOrders = await PharmacyOrder.find({ storeOrderId: storeOrder._id });

    // Restore stock for any pharmacy order that hasn't restored yet.
    for (const po of pharmacyOrders) {
      const prev = String(po.status || '').toLowerCase();
      if (prev === 'cancelled') continue;

      if (!po.stockRestoredOnCancel) {
        for (const it of po.items || []) {
          try {
            await PharmacyInventoryItem.updateOne(
              { _id: it.productId, pharmacyUid: po.pharmacyUid },
              { $inc: { stockQuantity: Number(it.quantity || 0) } }
            );
          } catch (e) {
            console.error('Admin cancel: stock restore failed', po._id, it.productId, e);
          }
        }
      }

      po.status = 'cancelled';
      po.cancelReason = reason;
      po.cancelledAt = po.cancelledAt || new Date();
      po.stockRestoredOnCancel = true;
      await po.save();
    }

    storeOrder.status = 'cancelled';
    storeOrder.cancelReason = reason;
    storeOrder.cancelledAt = storeOrder.cancelledAt || new Date();
    await storeOrder.save();

    // Notify user (in-app + email best-effort)
    const userEmail = await getEmailForUid(storeOrder.userUid);
    await notifyUserAndEmail({
      targetUid: storeOrder.userUid,
      targetRole: 'user',
      email: userEmail,
      type: 'store_order_cancelled',
      title: `Order ${storeOrder.orderNo} cancelled`,
      message: `Your order ${storeOrder.orderNo} was cancelled by an administrator. Reason: ${reason}`,
      data: { orderNo: storeOrder.orderNo },
      emailSubject: `Order ${storeOrder.orderNo} cancelled`,
      emailText: `Your order ${storeOrder.orderNo} was cancelled. Reason: ${reason}`,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('Admin cancel store order failed:', e);
    res.status(500).json({ error: 'Failed to cancel store order' });
  }
});

export default router;
