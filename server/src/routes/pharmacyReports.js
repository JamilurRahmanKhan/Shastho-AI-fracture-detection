/**
 * Backend route: pharmacyReports
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the pharmacyReports feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { PharmacyOrder } from '../models/PharmacyOrder.js';
import { PharmacyInventoryItem } from '../models/PharmacyInventoryItem.js';

const router = express.Router();

router.use(requireFirebaseAuth);
router.use(requireRole(['pharmacy', 'admin']));

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function pctChange(curr, prev) {
  const c = Number(curr || 0);
  const p = Number(prev || 0);
  if (p === 0) return c === 0 ? 0 : 100;
  return ((c - p) / p) * 100;
}

function asDayKey(d) {
  // YYYY-MM-DD
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, '0');
  const day = String(x.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayLabelFromKey(dayKey) {
  // Returns Mon/Tue/... from a YYYY-MM-DD key (UTC)
  const [y, m, d] = dayKey.split('-').map((n) => Number(n));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, { weekday: 'short' });
}

// GET /api/pharmacy/reports/overview?days=7&topDays=30
router.get('/overview', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const days = clampInt(req.query?.days, 7, 90, 7);
    const topDays = clampInt(req.query?.topDays, 7, 365, 30);

    const now = new Date();
    const startCurrent = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    startCurrent.setUTCDate(startCurrent.getUTCDate() - days + 1);
    const startPrev = new Date(startCurrent);
    startPrev.setUTCDate(startPrev.getUTCDate() - days);

    // --------------------------
    // Summary (current vs prev)
    // --------------------------
    const summaryAgg = await PharmacyOrder.aggregate([
      {
        $match: {
          pharmacyUid,
          createdAt: { $gte: startPrev, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $gte: ['$createdAt', startCurrent] }, 'current', 'prev'],
          },
          totalOrders: { $sum: 1 },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          totalSales: {
            $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] },
          },
          activeOrders: {
            $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0] },
          },
          currency: { $first: '$currency' },
          currencySymbol: { $first: '$currencySymbol' },
        },
      },
    ]);

    const curr = summaryAgg.find((x) => x._id === 'current') || {};
    const prev = summaryAgg.find((x) => x._id === 'prev') || {};

    // Force BDT across the product as the store is Bangladesh-focused.
    // If you later add multi-currency, switch this to use StorePricingConfig.
    const currency = 'BDT';
    const currencySymbol = '৳';

    const currentSales = Number(curr.totalSales || 0);
    const previousSales = Number(prev.totalSales || 0);
    const currentOrders = Number(curr.totalOrders || 0);
    const previousOrders = Number(prev.totalOrders || 0);
    const currentCancelled = Number(curr.cancelledOrders || 0);
    const previousCancelled = Number(prev.cancelledOrders || 0);

    const currentActive = Number(curr.activeOrders || Math.max(0, currentOrders - currentCancelled));
    const previousActive = Number(prev.activeOrders || Math.max(0, previousOrders - previousCancelled));

    const currentAvg = currentActive ? currentSales / currentActive : 0;
    const prevAvg = previousActive ? previousSales / previousActive : 0;

    const currentCancelRate = currentOrders ? (currentCancelled / currentOrders) * 100 : 0;
    const prevCancelRate = previousOrders ? (previousCancelled / previousOrders) * 100 : 0;

    // --------------------------
    // Weekly sales (daily buckets)
    // --------------------------
    const dailyAgg = await PharmacyOrder.aggregate([
      {
        $match: {
          pharmacyUid,
          createdAt: { $gte: startCurrent, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          sales: {
            $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyMap = new Map(dailyAgg.map((d) => [d._id, d]));
    const weeklySales = [];
    for (let i = 0; i < days; i++) {
      const dt = new Date(startCurrent);
      dt.setUTCDate(startCurrent.getUTCDate() + i);
      const key = asDayKey(dt);
      const row = dailyMap.get(key);
      weeklySales.push({
        dayKey: key,
        day: dayLabelFromKey(key),
        sales: Number(row?.sales || 0),
        orders: Number(row?.orders || 0),
      });
    }

    // --------------------------
    // Top selling products
    // --------------------------
    const startTop = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    startTop.setUTCDate(startTop.getUTCDate() - topDays + 1);

    const topAgg = await PharmacyOrder.aggregate([
      {
        $match: {
          pharmacyUid,
          status: { $ne: 'cancelled' },
          createdAt: { $gte: startTop, $lte: now },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    const totalTopRevenue = topAgg.reduce((a, x) => a + Number(x.revenue || 0), 0) || 0;
    const topSellingProducts = (() => {
      const top3 = topAgg.slice(0, 3).map((x) => ({
        name: x.name || 'Unknown',
        value: totalTopRevenue ? Math.round((Number(x.revenue || 0) / totalTopRevenue) * 100) : 0,
        revenue: Number(x.revenue || 0),
        qty: Number(x.qty || 0),
      }));
      const other = topAgg.slice(3).reduce((a, x) => a + Number(x.revenue || 0), 0);
      if (other > 0) {
        top3.push({ name: 'Other', value: totalTopRevenue ? Math.max(0, 100 - top3.reduce((s, t) => s + t.value, 0)) : 0, revenue: other, qty: null });
      }
      return top3;
    })();

    // --------------------------
// Low stock & expiry report
// --------------------------
const expiringBefore = new Date(now);
expiringBefore.setDate(expiringBefore.getDate() + 30);

// NOTE: Use an aggregation pipeline instead of a Mongoose .find() with $expr.
// Some Mongoose versions attempt to cast $expr comparisons in .find() and can crash
// with "Cannot read properties of undefined (reading 'path')".
const candidates = await PharmacyInventoryItem.aggregate([
  {
    $match: {
      pharmacyUid,
      isDeleted: false,
    },
  },
  {
    $addFields: {
      _lowThreshold: {
        $cond: [{ $gt: ['$reorderLevel', 0] }, '$reorderLevel', 10],
      },
    },
  },
  {
    $match: {
      $or: [
        { $expr: { $lte: ['$stockQuantity', '$_lowThreshold'] } },
        { expiryDate: { $ne: null, $lte: expiringBefore } },
      ],
    },
  },
  { $sort: { stockQuantity: 1, expiryDate: 1 } },
  { $limit: 50 },
  {
    $project: {
      name: 1,
      stockQuantity: 1,
      expiryDate: 1,
      reorderLevel: 1,
    },
  },
]);

const lowStockExpiry = candidates

      .map((it) => {
        const lowThreshold = Math.max(Number(it.reorderLevel || 0), 10);
        const isLow = Number(it.stockQuantity || 0) <= lowThreshold;
        const isExpiring = it.expiryDate && new Date(it.expiryDate) <= expiringBefore;
        let label = '';
        if (isLow && isExpiring) label = 'Low & Expiring';
        else if (isLow) label = 'Low Stock';
        else if (isExpiring) label = 'Expiring Soon';
        else label = 'Attention';
        return {
          id: String(it._id),
          name: it.name,
          stock: Number(it.stockQuantity || 0),
          expires: it.expiryDate ? new Date(it.expiryDate).toISOString().slice(0, 10) : null,
          alert: label,
        };
      })
      .slice(0, 20);

    res.json({
      currency,
      currencySymbol,
      summary: {
        totalSales: currentSales,
        totalOrders: currentOrders,
        avgOrderValue: currentAvg,
        cancellationRate: currentCancelRate,
        delta: {
          totalSales: pctChange(currentSales, previousSales),
          totalOrders: pctChange(currentOrders, previousOrders),
          avgOrderValue: pctChange(currentAvg, prevAvg),
          cancellationRate: pctChange(currentCancelRate, prevCancelRate),
        },
      },
      weeklySales,
      topSellingProducts,
      lowStockExpiry,
    });
  } catch (e) {
    console.error('Failed to build pharmacy reports overview:', e);
    res.status(500).json({ error: 'Failed to build reports' });
  }
});

export default router;
