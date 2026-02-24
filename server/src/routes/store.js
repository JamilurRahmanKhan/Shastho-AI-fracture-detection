/**
 * Backend route: store
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the store feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import multer from 'multer';
import { Readable } from 'stream';

import { PharmacyInventoryItem } from '../models/PharmacyInventoryItem.js';
import { StoreCart } from '../models/StoreCart.js';
import { StoreOrder } from '../models/StoreOrder.js';
import { PharmacyOrder } from '../models/PharmacyOrder.js';
import { StoreReview } from '../models/StoreReview.js';
import { UserAddress } from '../models/UserAddress.js';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  applyCountryOverride,
  computePricingFromConfig,
  getCountryCodeFromReq,
  getPricingConfig,
} from '../lib/storePricing.js';
import { createNotification, sendEmailBestEffort, getEmailForUid } from '../lib/notifications.js';

const router = express.Router();

function getBucket() {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('MongoDB connection not ready');
  return new GridFSBucket(db, { bucketName: 'pharmacy_inventory_images' });
}

function getPrescriptionBucket() {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('MongoDB connection not ready');
  return new GridFSBucket(db, { bucketName: 'store_prescriptions' });
}

const uploadPrescription = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ok = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  },
});

function safeNumber(v, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

function currencySymbolFor(code, activeCfg) {
  const c = String(code || '').toUpperCase();
  if (activeCfg && String(activeCfg.currencyCode || '').toUpperCase() === c) return activeCfg.currencySymbol || activeCfg.baseCurrencySymbol || '';
  if (c === 'USD') return '$';
  if (c === 'BDT') return '৳';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  return '';
}

function makeOrderNo(prefix = 'SO') {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${y}${m}${d}-${rand}`;
}


function formatAddress(addr) {
  if (!addr) return '';
  const lineCity = [addr.city, addr.state, addr.postalCode].filter((x) => String(x || '').trim()).join(', ');
  const parts = [
    addr.fullName,
    addr.line1,
    addr.line2,
    lineCity,
    addr.country,
  ]
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  return parts.join('\n');
}

async function getReviewStatsByProductIds(productIds) {
  const ids = (productIds || []).filter(Boolean).map((id) => new mongoose.Types.ObjectId(String(id)));
  if (!ids.length) return new Map();

  const rows = await StoreReview.aggregate([
    { $match: { productId: { $in: ids } } },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const m = new Map();
  for (const r of rows) {
    m.set(String(r._id), {
      rating: r.avgRating ? Math.round(r.avgRating * 10) / 10 : 0,
      reviews: r.count || 0,
    });
  }
  return m;
}

// ---------------------------------------------------------------------------
// PRICING CONFIG (Phase 7)
// ---------------------------------------------------------------------------

// GET /api/store/pricing-config (public)
// Returns the active pricing config for this request (after applying optional country overrides).
router.get('/pricing-config', async (req, res) => {
  try {
    const base = await getPricingConfig();
    if (!base) {
      return res.status(503).json({ error: 'Pricing config not ready' });
    }
    const countryCode = getCountryCodeFromReq(req);
    const active = applyCountryOverride(base, countryCode);

    res.json({
      currencyCode: active.currencyCode,
      currencySymbol: active.currencySymbol,
      taxRate: Number(active.taxRate || 0),
      shippingFee: Number(active.shippingFee || 0),
      freeShippingThreshold: Number(active.freeShippingThreshold || 0),
      countryCode: active.activeCountryCode || '',
      isOverride: Boolean(active.isOverride),
    });
  } catch (e) {
    console.error('Failed to load pricing config:', e);
    res.status(500).json({ error: 'Failed to load pricing config' });
  }
});

// PUT /api/store/pricing-config (pharmacy/admin)
// Updates global pricing rules (base + optional overrides)
router.put('/pricing-config', requireFirebaseAuth, requireRole(['pharmacy', 'admin']), async (req, res) => {
  try {
    const body = req.body || {};
    const baseCurrencyCode = String(body.baseCurrencyCode || body.currencyCode || '').trim().toUpperCase() || 'BDT';
    const baseCurrencySymbol = String(body.baseCurrencySymbol || body.currencySymbol || '').trim() || '৳';

    const defaultTaxRate = safeNumber(body.defaultTaxRate ?? body.taxRate, { min: 0, max: 1 });
    const defaultShippingFee = safeNumber(body.defaultShippingFee ?? body.shippingFee, { min: 0, max: 1_000_000 });
    const freeShippingThreshold = safeNumber(body.freeShippingThreshold, { min: 0, max: 1_000_000 });

    if (typeof defaultTaxRate === 'undefined') return res.status(400).json({ error: 'defaultTaxRate is required' });
    if (typeof defaultShippingFee === 'undefined') return res.status(400).json({ error: 'defaultShippingFee is required' });
    if (typeof freeShippingThreshold === 'undefined') return res.status(400).json({ error: 'freeShippingThreshold is required' });

    const overridesIn = Array.isArray(body.countryOverrides) ? body.countryOverrides : [];
    const countryOverrides = overridesIn
      .map((o) => {
        const cc = String(o?.countryCode || '').trim().toUpperCase();
        if (!cc) return null;
        return {
          countryCode: cc,
          currencyCode: String(o?.currencyCode || '').trim().toUpperCase(),
          currencySymbol: String(o?.currencySymbol || '').trim(),
          taxRate: typeof o?.taxRate === 'number' ? safeNumber(o.taxRate, { min: 0, max: 1 }) : null,
          shippingFee: typeof o?.shippingFee === 'number' ? safeNumber(o.shippingFee, { min: 0, max: 1_000_000 }) : null,
          freeShippingThreshold:
            typeof o?.freeShippingThreshold === 'number'
              ? safeNumber(o.freeShippingThreshold, { min: 0, max: 1_000_000 })
              : null,
        };
      })
      .filter(Boolean);

    const update = {
      baseCurrencyCode,
      baseCurrencySymbol,
      defaultTaxRate,
      defaultShippingFee,
      freeShippingThreshold,
      countryOverrides,
      updatedByUid: req.user?.uid || '',
    };

    const cfg = await (async () => {
      const existing = await StorePricingConfig.findOne({}).lean();
      if (existing) {
        await StorePricingConfig.updateOne({ _id: existing._id }, { $set: update });
        return await StorePricingConfig.findById(existing._id).lean();
      }
      return await StorePricingConfig.create(update);
    })();

    res.json({
      ok: true,
      config: cfg,
    });
  } catch (e) {
    console.error('Failed to update pricing config:', e);
    res.status(500).json({ error: 'Failed to update pricing config' });
  }
});

// ---------------------------------------------------------------------------
// PUBLIC CATALOG
// ---------------------------------------------------------------------------

// GET /api/store/products
router.get('/products', async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      sort = 'name',
      order = 'asc',
      page = '1',
      limit = '30',
      inStock = '',
    } = req.query;

    const basePricing = await getPricingConfig();
    const activePricing = applyCountryOverride(basePricing, getCountryCodeFromReq(req));

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 30));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isDeleted: false };
    if (category && category !== 'all') filter.category = String(category);
    if (String(inStock) === '1') filter.stockQuantity = { $gt: 0 };
    if (search && String(search).trim()) filter.$text = { $search: String(search).trim() };

    const sortField = ['createdAt', 'name', 'price', 'stockQuantity'].includes(sort) ? sort : 'name';
    const sortDir = order === 'desc' ? -1 : 1;

    const [total, docs] = await Promise.all([
      PharmacyInventoryItem.countDocuments(filter),
      PharmacyInventoryItem.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const reviewStats = await getReviewStatsByProductIds(docs.map((d) => d._id));

    const items = docs.map((d) => {
      const unitPrice = typeof d.discountPrice === 'number' && d.discountPrice !== null ? d.discountPrice : d.price;
      const rs = reviewStats.get(String(d._id)) || { rating: 0, reviews: 0 };
      return {
        id: String(d._id),
        pharmacyUid: d.pharmacyUid,
        name: d.name,
        description: d.description || '',
        category: d.category || '',
        dosage: d.dosage || '',
        form: d.form || '',
        manufacturer: d.manufacturer || '',
        price: unitPrice,
        originalPrice: d.discountPrice != null ? d.price : null,
        currency: d.currency || 'BDT',
      currencySymbol: currencySymbolFor(d.currency || (activePricing?.currencyCode || 'BDT'), activePricing),
        currencySymbol: currencySymbolFor(d.currency || (activePricing?.currencyCode || 'BDT'), activePricing),
        inStock: Number(d.stockQuantity || 0) > 0,
        stockQuantity: Number(d.stockQuantity || 0),
        prescription: Boolean(d.requiresPrescription),
        requiresPrescription: Boolean(d.requiresPrescription),
        longDescription: d.longDescription || '',
        keyBenefits: Array.isArray(d.keyBenefits) ? d.keyBenefits : [],
        usageInstructions: d.usageInstructions || '',
        warnings: d.warnings || '',
        tags: Array.isArray(d.tags) ? d.tags : [],
        imageUrl: d.imageFileId ? `/api/store/products/${String(d._id)}/image` : '',

        // Rating from real reviews
        rating: rs.rating,
        reviews: rs.reviews,
      };
    });

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (e) {
    console.error('Failed to list store products:', e);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

// GET /api/store/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const basePricing = await getPricingConfig();
    const activePricing = applyCountryOverride(basePricing, getCountryCodeFromReq(req));

    const d = await PharmacyInventoryItem.findOne({ _id: id, isDeleted: false }).lean();
    if (!d) return res.status(404).json({ error: 'Not found' });

    const unitPrice = typeof d.discountPrice === 'number' && d.discountPrice !== null ? d.discountPrice : d.price;
    const rs = (await getReviewStatsByProductIds([d._id])).get(String(d._id)) || { rating: 0, reviews: 0 };
    res.json({
      id: String(d._id),
      pharmacyUid: d.pharmacyUid,
      name: d.name,
      description: d.description || '',
      category: d.category || '',
      dosage: d.dosage || '',
      form: d.form || '',
      manufacturer: d.manufacturer || '',
      price: unitPrice,
      originalPrice: d.discountPrice != null ? d.price : null,
      currency: d.currency || 'BDT',
      currencySymbol: currencySymbolFor(d.currency || (activePricing?.currencyCode || 'BDT'), activePricing),
      inStock: Number(d.stockQuantity || 0) > 0,
      stockQuantity: Number(d.stockQuantity || 0),
      prescription: Boolean(d.requiresPrescription),
      requiresPrescription: Boolean(d.requiresPrescription),
      longDescription: d.longDescription || '',
      keyBenefits: Array.isArray(d.keyBenefits) ? d.keyBenefits : [],
      usageInstructions: d.usageInstructions || '',
      warnings: d.warnings || '',
      tags: Array.isArray(d.tags) ? d.tags : [],
      imageUrl: d.imageFileId ? `/api/store/products/${String(d._id)}/image` : '',

      // Rating from real reviews
      rating: rs.rating,
      reviews: rs.reviews,
    });
  } catch (e) {
    console.error('Failed to get store product:', e);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// GET /api/store/products/:id/image
router.get('/products/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
    const doc = await PharmacyInventoryItem.findOne({ _id: id, isDeleted: false }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!doc.imageFileId) return res.status(404).json({ error: 'No image' });

    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(String(doc.imageFileId));
    const files = await mongoose.connection.db
      .collection('pharmacy_inventory_images.files')
      .find({ _id: fileId })
      .limit(1)
      .toArray();
    const file = files?.[0] || null;
    if (!file) return res.status(404).json({ error: 'No image' });

    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const dl = bucket.openDownloadStream(fileId);
    dl.on('error', () => res.status(404).end());
    dl.pipe(res);
  } catch (e) {
    console.error('Failed to stream store product image:', e);
    res.status(500).json({ error: 'Failed to stream image' });
  }
});

// ---------------------------------------------------------------------------
// PRODUCT REVIEWS
// ---------------------------------------------------------------------------

// GET /api/store/products/:id/reviews? page, limit
router.get('/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const productId = new mongoose.Types.ObjectId(String(id));
    const pageNum = Math.max(1, Number(req.query.page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, docs, dist] = await Promise.all([
      StoreReview.countDocuments({ productId }),
      StoreReview.find({ productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select({ _id: 1, userDisplayName: 1, rating: 1, comment: 1, verifiedPurchase: 1, createdAt: 1 })
        .lean(),
      StoreReview.aggregate([
        { $match: { productId } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const stats = (await getReviewStatsByProductIds([productId])).get(String(productId)) || { rating: 0, reviews: 0 };
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of dist) {
      const k = Number(r._id);
      if (k >= 1 && k <= 5) counts[k] = r.count || 0;
    }

    res.json({
      items: docs.map((d) => ({
        id: String(d._id),
        user: d.userDisplayName || 'Anonymous',
        rating: d.rating,
        comment: d.comment,
        verified: Boolean(d.verifiedPurchase),
        createdAt: d.createdAt,
      })),
      page: pageNum,
      limit: limitNum,
      total,
      avgRating: stats.rating,
      counts,
    });
  } catch (e) {
    console.error('Failed to list reviews:', e);
    res.status(500).json({ error: 'Failed to list reviews' });
  }
});

// POST /api/store/products/:id/reviews { rating, comment, userDisplayName? }
router.post('/products/:id/reviews', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
    const productId = new mongoose.Types.ObjectId(String(id));
    const product = await PharmacyInventoryItem.findOne({ _id: productId, isDeleted: false }).select({ _id: 1 }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const userUid = req.user.uid;
    const rating = safeNumber(req.body?.rating, { min: 1, max: 5 });
    const comment = String(req.body?.comment || '').trim();
    const userDisplayName = String(req.body?.userDisplayName || req.user.email || '').trim();

    if (!rating) return res.status(400).json({ error: 'rating must be between 1 and 5' });
    if (!comment || comment.length < 5) return res.status(400).json({ error: 'comment must be at least 5 characters' });

    // Only verified purchasers can review.
    const hasPurchase = await StoreOrder.findOne({
      userUid,
      status: { $ne: 'cancelled' },
      'items.productId': productId,
    })
      .select({ _id: 1 })
      .lean();

    if (!hasPurchase) {
      return res.status(403).json({ error: 'Only verified purchasers can review this product.' });
    }

    const review = await StoreReview.findOneAndUpdate(
      { productId, userUid },
      {
        $set: {
          rating,
          comment,
          userDisplayName,
          verifiedPurchase: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const stats = (await getReviewStatsByProductIds([productId])).get(String(productId)) || { rating: 0, reviews: 0 };

    res.status(201).json({
      ok: true,
      review: {
        id: String(review._id),
        user: review.userDisplayName || 'Anonymous',
        rating: review.rating,
        comment: review.comment,
        verified: Boolean(review.verifiedPurchase),
        createdAt: review.createdAt,
      },
      stats,
    });
  } catch (e) {
    // Handle duplicate key race
    if (e?.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this product.' });
    }
    console.error('Failed to create review:', e);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// ---------------------------------------------------------------------------
// AUTHENTICATED USER CART
// ---------------------------------------------------------------------------

router.use('/cart', requireFirebaseAuth, requireRole('user'));

async function ensureCart(userUid) {
  const cart = await StoreCart.findOne({ userUid });
  if (cart) return cart;
  return await StoreCart.create({ userUid, items: [] });
}

async function cartToResponse(cart, req) {
  // Populate product snapshots for UI rendering.
  const ids = cart.items.map((it) => it.productId);
  const products = await PharmacyInventoryItem.find({ _id: { $in: ids }, isDeleted: false }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const priceChanges = [];
  const items = [];
  let needsSave = false;

  for (const it of cart.items) {
    const p = byId.get(String(it.productId));
    if (!p) continue;

    const unitPriceNow = typeof p.discountPrice === 'number' && p.discountPrice !== null ? p.discountPrice : p.price;
    const currencyNow = p.currency || 'BDT';

    // Initialize snapshot for older carts (pre-snapshot schema)
    if (it.unitPriceSnapshot == null) {
      it.unitPriceSnapshot = unitPriceNow;
      it.currencySnapshot = currencyNow;
      needsSave = true;
    }

    const snapshotPrice = typeof it.unitPriceSnapshot === 'number' ? it.unitPriceSnapshot : unitPriceNow;
    const priceChanged = snapshotPrice !== unitPriceNow;
    if (priceChanged) {
      priceChanges.push({
        productId: String(p._id),
        name: p.name,
        from: snapshotPrice,
        to: unitPriceNow,
        currency: currencyNow,
      });
    }

    items.push({
      id: String(p._id),
      productId: String(p._id),
      pharmacyUid: p.pharmacyUid,
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      dosage: p.dosage || '',
      form: p.form || '',
      manufacturer: p.manufacturer || '',
      price: unitPriceNow,
      originalPrice: p.discountPrice != null ? p.price : null,
      currency: currencyNow,
      inStock: Number(p.stockQuantity || 0) > 0,
      stockQuantity: Number(p.stockQuantity || 0),
      prescription: Boolean(p.requiresPrescription),
      requiresPrescription: Boolean(p.requiresPrescription),
      imageUrl: p.imageFileId ? `/api/store/products/${String(p._id)}/image` : '',
      quantity: it.quantity,

      // For UI warnings
      priceSnapshot: snapshotPrice,
      priceChanged,
    });
  }

  // Cart resilience: if some products no longer exist, remove them from the cart document.
  if (items.length !== cart.items.length) {
    const keep = new Set(items.map((it) => String(it.productId)));
    cart.items = cart.items.filter((it) => keep.has(String(it.productId)));
    try {
      await cart.save();
    } catch {
      // ignore
    }
  }

  // Save snapshots initialized for older carts.
  if (needsSave) {
    try {
      await cart.save();
    } catch {
      // ignore
    }
  }

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);

  const basePricing = await getPricingConfig();
  const activePricing = applyCountryOverride(basePricing, getCountryCodeFromReq(req));
  const pricing = computePricingFromConfig(subtotal, activePricing);

  return {
    items,
    ...pricing,
    priceChanges,
  };
}

// GET /api/store/cart
router.get('/cart', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const cart = await ensureCart(userUid);
    const data = await cartToResponse(cart, req);
    res.json(data);
  } catch (e) {
    console.error('Failed to get cart:', e);
    res.status(500).json({ error: 'Failed to load cart' });
  }
});

// POST /api/store/cart/items { productId, quantity }
router.post('/cart/items', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const productId = req.body?.productId || req.body?.id;
    const quantity = safeNumber(req.body?.quantity ?? 1, { min: 1, max: 999 }) ?? 1;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Invalid productId' });

    const product = await PharmacyInventoryItem.findOne({ _id: productId, isDeleted: false }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const cart = await ensureCart(userUid);

    // Snapshot current unit price so we can warn users if pricing changes later.
    const unitPriceNow = product.discountPrice != null ? product.discountPrice : product.price;
    const currencyNow = product.currency || 'BDT';

    // Currency enforcement: prevent mixed-currency carts.
    const basePricing = await getPricingConfig();
    const activePricing = applyCountryOverride(basePricing, getCountryCodeFromReq(req));
    const storeCurrency = String(activePricing?.currencyCode || activePricing?.baseCurrencyCode || '').toUpperCase();
    if (storeCurrency && String(currencyNow || '').toUpperCase() !== storeCurrency) {
      return res.status(400).json({ error: `This store is configured for ${storeCurrency}. This product is ${currencyNow}. Mixed-currency carts are not supported.` });
    }

    const idx = cart.items.findIndex((it) => String(it.productId) === String(productId));
    if (idx >= 0) {
      cart.items[idx].quantity = Math.min(999, cart.items[idx].quantity + quantity);
      if (cart.items[idx].unitPriceSnapshot == null) {
        cart.items[idx].unitPriceSnapshot = unitPriceNow;
        cart.items[idx].currencySnapshot = currencyNow;
      }
    } else {
      cart.items.push({ productId, quantity, unitPriceSnapshot: unitPriceNow, currencySnapshot: currencyNow });
    }
    await cart.save();
    res.json(await cartToResponse(cart, req));
  } catch (e) {
    console.error('Failed to add cart item:', e);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PATCH /api/store/cart/items/:productId { quantity }
router.patch('/cart/items/:productId', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { productId } = req.params;
    const quantity = safeNumber(req.body?.quantity, { min: 0, max: 999 });
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Invalid productId' });
    if (typeof quantity === 'undefined') return res.status(400).json({ error: 'quantity is required' });

    const cart = await ensureCart(userUid);
    const idx = cart.items.findIndex((it) => String(it.productId) === String(productId));
    if (idx < 0) return res.status(404).json({ error: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
    await cart.save();
    res.json(await cartToResponse(cart, req));
  } catch (e) {
    console.error('Failed to update cart item:', e);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/store/cart/items/:productId
router.delete('/cart/items/:productId', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Invalid productId' });

    const cart = await ensureCart(userUid);
    cart.items = cart.items.filter((it) => String(it.productId) !== String(productId));
    await cart.save();
    res.json(await cartToResponse(cart, req));
  } catch (e) {
    console.error('Failed to remove cart item:', e);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// POST /api/store/cart/clear
router.post('/cart/clear', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const cart = await ensureCart(userUid);
    cart.items = [];
    await cart.save();
    res.json(await cartToResponse(cart, req));
  } catch (e) {
    console.error('Failed to clear cart:', e);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// POST /api/store/cart/sync { items: [{productId, quantity}] }
router.post('/cart/sync', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
    const cart = await ensureCart(userUid);

    const map = new Map(cart.items.map((it) => [String(it.productId), it.quantity]));
    for (const row of incoming) {
      const pid = row?.productId || row?.id;
      if (!mongoose.isValidObjectId(pid)) continue;
      const qty = safeNumber(row?.quantity ?? 1, { min: 1, max: 999 }) ?? 1;
      map.set(String(pid), Math.min(999, (map.get(String(pid)) || 0) + qty));
    }
    // Currency enforcement in sync: reject carts that include mixed currencies.
    const basePricing = await getPricingConfig();
    const activePricing = applyCountryOverride(basePricing, getCountryCodeFromReq(req));
    const storeCurrency = String(activePricing?.currencyCode || activePricing?.baseCurrencyCode || '').toUpperCase();
    if (storeCurrency) {
      const pids = Array.from(map.keys()).filter((x) => mongoose.isValidObjectId(x));
      const rows = await PharmacyInventoryItem.find({ _id: { $in: pids }, isDeleted: false }).select({ currency: 1 }).lean();
      const bad = rows.find((r) => String(r.currency || 'BDT').toUpperCase() !== storeCurrency);
      if (bad) {
        return res.status(400).json({ error: `This store is configured for ${storeCurrency}. Mixed-currency carts are not supported.` });
      }
    }

    cart.items = Array.from(map.entries()).map(([pid, qty]) => ({ productId: pid, quantity: qty }));
    await cart.save();
    res.json(await cartToResponse(cart, req));
  } catch (e) {
    console.error('Failed to sync cart:', e);
    res.status(500).json({ error: 'Failed to sync cart' });
  }
});

// ---------------------------------------------------------------------------
// USER ADDRESS BOOK (multiple addresses + default)
// ---------------------------------------------------------------------------

router.use('/addresses', requireFirebaseAuth, requireRole('user'));

// GET /api/store/addresses
router.get('/addresses', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const rows = await UserAddress.find({ userUid }).sort({ isDefault: -1, updatedAt: -1 }).lean();
    res.json({
      items: rows.map((a) => ({
        id: String(a._id),
        ...a,
        formatted: formatAddress(a),
      })),
    });
  } catch (e) {
    console.error('Failed to list addresses:', e);
    res.status(500).json({ error: 'Failed to list addresses' });
  }
});

// POST /api/store/addresses
router.post('/addresses', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const payload = req.body || {};
    const line1 = String(payload.line1 || '').trim();
    if (!line1) return res.status(400).json({ error: 'line1 is required' });

    const count = await UserAddress.countDocuments({ userUid });
    const wantsDefault = Boolean(payload.isDefault) || count === 0;

    const doc = await UserAddress.create({
      userUid,
      label: String(payload.label || 'Home').trim(),
      fullName: String(payload.fullName || '').trim(),
      phone: String(payload.phone || '').trim(),
      line1,
      line2: String(payload.line2 || '').trim(),
      city: String(payload.city || '').trim(),
      state: String(payload.state || '').trim(),
      postalCode: String(payload.postalCode || '').trim(),
      country: String(payload.country || 'Bangladesh').trim(),
      isDefault: wantsDefault,
    });

    if (wantsDefault) {
      await UserAddress.updateMany({ userUid, _id: { $ne: doc._id } }, { $set: { isDefault: false } });
    }

    const out = doc.toObject();
    res.json({ id: String(doc._id), ...out, formatted: formatAddress(out) });
  } catch (e) {
    console.error('Failed to create address:', e);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

// PATCH /api/store/addresses/:id
router.patch('/addresses/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const payload = req.body || {};
    const update = {};
    const setIf = (k, v) => {
      if (typeof v === 'undefined') return;
      update[k] = String(v).trim();
    };
    setIf('label', payload.label);
    setIf('fullName', payload.fullName);
    setIf('phone', payload.phone);
    if (typeof payload.line1 !== 'undefined') {
      const v = String(payload.line1 || '').trim();
      if (!v) return res.status(400).json({ error: 'line1 cannot be empty' });
      update.line1 = v;
    }
    setIf('line2', payload.line2);
    setIf('city', payload.city);
    setIf('state', payload.state);
    setIf('postalCode', payload.postalCode);
    setIf('country', payload.country);
    if (typeof payload.isDefault !== 'undefined') update.isDefault = Boolean(payload.isDefault);

    const doc = await UserAddress.findOneAndUpdate({ _id: id, userUid }, { $set: update }, { new: true }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    if (update.isDefault === true) {
      await UserAddress.updateMany({ userUid, _id: { $ne: id } }, { $set: { isDefault: false } });
    }

    res.json({ id: String(doc._id), ...doc, formatted: formatAddress(doc) });
  } catch (e) {
    console.error('Failed to update address:', e);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// POST /api/store/addresses/:id/default
router.post('/addresses/:id/default', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await UserAddress.findOneAndUpdate({ _id: id, userUid }, { $set: { isDefault: true } }, { new: true }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    await UserAddress.updateMany({ userUid, _id: { $ne: id } }, { $set: { isDefault: false } });
    res.json({ ok: true, id: String(doc._id) });
  } catch (e) {
    console.error('Failed to set default address:', e);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

// DELETE /api/store/addresses/:id
router.delete('/addresses/:id', async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await UserAddress.findOne({ _id: id, userUid }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    await UserAddress.deleteOne({ _id: id, userUid });

    // If the deleted address was default, promote the most recently updated remaining address.
    if (doc.isDefault) {
      const next = await UserAddress.findOne({ userUid }).sort({ updatedAt: -1, createdAt: -1 }).lean();
      if (next) {
        await UserAddress.updateOne({ _id: next._id }, { $set: { isDefault: true } });
        await UserAddress.updateMany({ userUid, _id: { $ne: next._id } }, { $set: { isDefault: false } });
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete address:', e);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// ---------------------------------------------------------------------------
// CHECKOUT + ORDERS
// ---------------------------------------------------------------------------

// POST /api/store/prescriptions (multipart: file, doctorNote)
// Upload a prescription file and get back a fileId to attach during checkout.
router.post('/prescriptions', requireFirebaseAuth, requireRole('user'), uploadPrescription.single('file'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const doctorNote = String(req.body?.doctorNote || '').trim();
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Prescription file is required' });

    const bucket = getPrescriptionBucket();
    const uploadStream = bucket.openUploadStream(file.originalname || 'prescription', {
      contentType: file.mimetype,
      metadata: { userUid, doctorNote, createdAt: new Date() },
    });

    await new Promise((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    return res.json({
      ok: true,
      fileId: String(uploadStream.id),
      filename: file.originalname,
      contentType: file.mimetype,
      size: file.size,
      doctorNote,
    });
  } catch (e) {
    console.error('Failed to upload prescription:', e);
    return res.status(400).json({ error: e?.message || 'Failed to upload prescription' });
  }
});

// POST /api/store/checkout { shippingAddress, phone, notes }
router.post('/checkout', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  const userUid = req.user.uid;

  const addressId = String(req.body?.addressId || '').trim();
  let shippingAddress = String(req.body?.shippingAddress || '').trim();
  let phone = String(req.body?.phone || '').trim();
  const notes = String(req.body?.notes || '').trim();
  const prescriptionFileId = String(req.body?.prescriptionFileId || '').trim();
  const prescriptionDoctorNote = String(req.body?.doctorNote || '').trim();

  // If the user selected a saved address, use it as the source of truth.
  if (addressId) {
    if (!mongoose.isValidObjectId(addressId)) return res.status(400).json({ error: 'Invalid addressId' });
    const addr = await UserAddress.findOne({ _id: addressId, userUid }).lean();
    if (!addr) return res.status(404).json({ error: 'Address not found' });
    shippingAddress = formatAddress(addr);
    if (!phone) phone = String(addr.phone || '').trim();
  }

  if (!shippingAddress) return res.status(400).json({ error: 'shippingAddress is required' });
  if (!phone) return res.status(400).json({ error: 'phone is required' });

  const cart = await ensureCart(userUid);
  if (!cart.items.length) return res.status(400).json({ error: 'Cart is empty' });

  // Load product docs
  const productIds = cart.items.map((it) => it.productId);
  const products = await PharmacyInventoryItem.find({ _id: { $in: productIds }, isDeleted: false }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  // Validate
  for (const it of cart.items) {
    const p = byId.get(String(it.productId));
    if (!p) return res.status(400).json({ error: 'One or more products are unavailable. Please refresh your cart.' });
    if (Number(p.stockQuantity || 0) < it.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
    }
  }

  // If any cart item requires a prescription, enforce an uploaded prescription file.
  const rxRequired = cart.items.some((it) => Boolean(byId.get(String(it.productId))?.requiresPrescription));

  let prescription = { status: 'not_required' };
  if (rxRequired) {
    if (!prescriptionFileId) {
      return res.status(400).json({ error: 'Prescription is required for one or more items in your cart.' });
    }
    if (!mongoose.isValidObjectId(prescriptionFileId)) {
      return res.status(400).json({ error: 'Invalid prescriptionFileId' });
    }

    const fileId = new mongoose.Types.ObjectId(String(prescriptionFileId));
    const files = await mongoose.connection.db
      .collection('store_prescriptions.files')
      .find({ _id: fileId })
      .limit(1)
      .toArray();
    const file = files?.[0] || null;
    if (!file) {
      return res.status(400).json({ error: 'Prescription file not found. Please upload again.' });
    }
    if (String(file?.metadata?.userUid || '') !== String(userUid)) {
      return res.status(403).json({ error: 'You do not have access to this prescription file.' });
    }

    prescription = {
      fileId,
      filename: file.filename || '',
      contentType: file.contentType || '',
      size: Number(file.length || 0),
      uploadedByUid: userUid,
      uploadedAt: file.uploadDate || new Date(),
      doctorNote: prescriptionDoctorNote || String(file?.metadata?.doctorNote || ''),
      status: 'pending',
    };
  }

  // Decrement stock safely (best effort rollback if a later update fails)
  const decremented = [];
  try {
    for (const it of cart.items) {
      const p = byId.get(String(it.productId));
      const updated = await PharmacyInventoryItem.updateOne(
        { _id: p._id, isDeleted: false, stockQuantity: { $gte: it.quantity } },
        { $inc: { stockQuantity: -it.quantity } }
      );
      if (updated.modifiedCount !== 1) {
        throw new Error(`Insufficient stock for ${p.name}`);
      }
      decremented.push({ id: p._id, qty: it.quantity });
    }
  } catch (e) {
    // rollback
    for (const r of decremented) {
      try {
        await PharmacyInventoryItem.updateOne({ _id: r.id }, { $inc: { stockQuantity: r.qty } });
      } catch {
        // ignore
      }
    }
    return res.status(400).json({ error: e.message || 'Checkout failed' });
  }

  // Build order snapshot
  const items = cart.items.map((it) => {
    const p = byId.get(String(it.productId));
    const unitPrice = typeof p.discountPrice === 'number' && p.discountPrice !== null ? p.discountPrice : p.price;
    const lineTotal = unitPrice * it.quantity;
    return {
      productId: p._id,
      pharmacyUid: p.pharmacyUid,
      name: p.name,
      genericName: p.genericName || '',
      category: p.category || '',
      dosage: p.dosage || '',
      form: p.form || '',
      manufacturer: p.manufacturer || '',
      requiresPrescription: Boolean(p.requiresPrescription),
      imageFileId: p.imageFileId || null,
      unitPrice,
      currency: p.currency || 'BDT',
      quantity: it.quantity,
      lineTotal,
    };
  });

  const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);

  const basePricing = await getPricingConfig();
  const activePricing = applyCountryOverride(basePricing, getCountryCodeFromReq(req));
  const pricing = computePricingFromConfig(subtotal, activePricing);

  const orderNo = makeOrderNo('SO');
  const storeOrder = await StoreOrder.create({
    orderNo,
    userUid,
    items,
    subtotal,
    tax: pricing.tax,
    shipping: pricing.shipping,
    total: pricing.total,
    currency: pricing.currencyCode || (items?.[0]?.currency || 'BDT'),
    currencySymbol: pricing.currencySymbol || currencySymbolFor(pricing.currencyCode, activePricing),
    pricingSnapshot: {
      taxRate: pricing.taxRate,
      shippingFee: pricing.shippingFee,
      freeShippingThreshold: pricing.freeShippingThreshold,
      countryCode: pricing.countryCode || '',
    },
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    shippingAddress,
    phone,
    notes,
    status: 'placed',

    prescription,
  });

  // Per-pharmacy orders
  const byPharmacy = new Map();
  for (const it of items) {
    const k = it.pharmacyUid;
    if (!byPharmacy.has(k)) byPharmacy.set(k, []);
    byPharmacy.get(k).push(it);
  }

  const pharmacyOrders = [];
  for (const [pharmacyUid, phItems] of byPharmacy.entries()) {
    const sub = phItems.reduce((s, it) => s + it.lineTotal, 0);
    const pPricing = computePricingFromConfig(sub, activePricing);
    const po = await PharmacyOrder.create({
      orderNo: makeOrderNo('PO'),
      storeOrderId: storeOrder._id,
      pharmacyUid,
      userUid,
      items: phItems.map((it) => ({
        productId: it.productId,
        name: it.name,
        dosage: it.dosage,
        form: it.form,
        manufacturer: it.manufacturer,
        requiresPrescription: it.requiresPrescription,
        imageFileId: it.imageFileId,
        unitPrice: it.unitPrice,
        currency: it.currency,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      })),
      subtotal: sub,
      tax: pPricing.tax,
      shipping: pPricing.shipping,
      total: pPricing.total,
      currency: pricing.currencyCode || (phItems?.[0]?.currency || 'BDT'),
      currencySymbol: pricing.currencySymbol || currencySymbolFor(pricing.currencyCode, activePricing),
      pricingSnapshot: {
        taxRate: pricing.taxRate,
        shippingFee: pricing.shippingFee,
        freeShippingThreshold: pricing.freeShippingThreshold,
        countryCode: pricing.countryCode || '',
      },
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      shippingAddress,
      phone,
      notes,
      status: 'pending',

      prescription,
    });
    pharmacyOrders.push(po);
  }

  // Phase 9: Notifications (in-app + best-effort email)
  try {
    const userEmail = req.user?.email || null;
    await createNotification({
      targetUid: userUid,
      targetRole: 'user',
      type: 'store_order_placed',
      title: `Order ${storeOrder.orderNo} placed`,
      message: `Your order ${storeOrder.orderNo} has been placed successfully.`,
      data: { orderNo: storeOrder.orderNo, storeOrderId: String(storeOrder._id) },
    });
    await sendEmailBestEffort(
      userEmail,
      `ShasthoAI: Order ${storeOrder.orderNo} placed`,
      `Your order ${storeOrder.orderNo} has been placed successfully. Total: ${storeOrder.currencySymbol || ''}${storeOrder.total}`
    );

    // Notify each pharmacy that received items
    for (const po of pharmacyOrders) {
      const pUid = po.pharmacyUid;
      await createNotification({
        targetUid: pUid,
        targetRole: 'pharmacy',
        type: 'pharmacy_new_order',
        title: `New order received (${po.orderNo})`,
        message: `A new order has been placed and requires fulfillment.`,
        data: { pharmacyOrderId: String(po._id), orderNo: po.orderNo, storeOrderNo: storeOrder.orderNo },
      });
      const pEmail = await getEmailForUid(pUid);
      await sendEmailBestEffort(
        pEmail,
        `ShasthoAI: New pharmacy order ${po.orderNo}`,
        `You received a new order (${po.orderNo}) linked to store order ${storeOrder.orderNo}. Please open the Pharmacy panel to accept/fulfill it.`
      );
    }
  } catch (e) {
    console.error('Checkout notifications failed (non-blocking):', e);
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  return res.json({
    ok: true,
    order: {
      id: String(storeOrder._id),
      orderNo: storeOrder.orderNo,
      total: storeOrder.total,
      status: storeOrder.status,
      paymentMethod: storeOrder.paymentMethod,
    },
  });
});

// GET /api/store/orders
router.get('/orders', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const orders = await StoreOrder.find({ userUid }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ items: orders.map((o) => ({ id: String(o._id), ...o })) });
  } catch (e) {
    console.error('Failed to list orders:', e);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

// GET /api/store/orders/:idOrNo
router.get('/orders/:idOrNo', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { idOrNo } = req.params;
    const filter = { userUid };
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;
    const o = await StoreOrder.findOne(filter).lean();
    if (!o) return res.status(404).json({ error: 'Not found' });
    res.json({ id: String(o._id), ...o });
  } catch (e) {
    console.error('Failed to get order:', e);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// GET /api/store/orders/:idOrNo/prescription
// Streams the prescription file attached to the order (if any) for the owning user.
router.get('/orders/:idOrNo/prescription', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { idOrNo } = req.params;
    const filter = { userUid };
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;

    const o = await StoreOrder.findOne(filter).lean();
    if (!o) return res.status(404).json({ error: 'Not found' });
    const fileId = o?.prescription?.fileId;
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
    // inline for images/pdf; browsers will show a viewer.
    res.setHeader('Content-Disposition', `inline; filename="${filename.replace(/"/g, '')}"`);

    const dl = bucket.openDownloadStream(fid);
    dl.on('error', () => res.status(404).end());
    dl.pipe(res);
  } catch (e) {
    console.error('Failed to stream prescription:', e);
    res.status(500).json({ error: 'Failed to stream prescription' });
  }

// POST /api/store/orders/:idOrNo/prescription (multipart: file, doctorNote)
// Allows the user to re-upload a prescription for an existing Rx order (e.g., after rejection).
router.post('/orders/:idOrNo/prescription', requireFirebaseAuth, requireRole('user'), uploadPrescription.single('file'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const { idOrNo } = req.params;
    const doctorNote = String(req.body?.doctorNote || '').trim();
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Prescription file is required' });

    const filter = { userUid };
    if (mongoose.isValidObjectId(idOrNo)) filter._id = idOrNo;
    else filter.orderNo = idOrNo;

    const o = await StoreOrder.findOne(filter).lean();
    if (!o) return res.status(404).json({ error: 'Order not found' });

    const hasRx = Array.isArray(o.items) && o.items.some((it) => Boolean(it.requiresPrescription));
    if (!hasRx) return res.status(400).json({ error: 'This order does not require a prescription' });

    const currentStatus = String(o?.prescription?.status || '').toLowerCase();
    if (currentStatus === 'approved') {
      return res.status(400).json({ error: 'Prescription is already approved for this order' });
    }

    // Upload the new file to GridFS
    const bucket = getPrescriptionBucket();
    const uploadStream = bucket.openUploadStream(file.originalname || 'prescription', {
      contentType: file.mimetype,
      metadata: { userUid, doctorNote, orderNo: o.orderNo, createdAt: new Date() },
    });

    await new Promise((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    const nextPrescription = {
      fileId: uploadStream.id,
      filename: file.originalname || '',
      contentType: file.mimetype || '',
      size: Number(file.size || (file.buffer ? file.buffer.length : 0)),
      uploadedByUid: userUid,
      uploadedAt: new Date(),
      doctorNote,
      status: 'pending',
      reviewedByUid: '',
      reviewedAt: null,
      rejectionReason: '',
    };

    // Update StoreOrder + all PharmacyOrders linked to it
    await StoreOrder.updateOne(
      { _id: o._id, userUid },
      { $set: { prescription: nextPrescription } }
    );
    await PharmacyOrder.updateMany(
      { storeOrderId: o._id },
      { $set: { prescription: nextPrescription } }
    );

    // Notify pharmacies to re-review
    try {
      const pos = await PharmacyOrder.find({ storeOrderId: o._id }).select('pharmacyUid').lean();
      const uids = [...new Set((pos || []).map((p) => String(p.pharmacyUid || '')).filter(Boolean))];
      for (const pharmacyUid of uids) {
        await createNotification({
          targetUid: pharmacyUid,
          type: 'prescription',
          title: 'Prescription updated',
          message: `A prescription was re-uploaded for order ${o.orderNo}. Please review before shipping.`,
          data: { orderNo: o.orderNo, storeOrderId: String(o._id) },
        });
      }
      await createNotification({
        targetUid: userUid,
        type: 'prescription',
        title: 'Prescription submitted',
        message: `Your prescription was submitted for order ${o.orderNo}. The pharmacy will review it shortly.`,
        data: { orderNo: o.orderNo, storeOrderId: String(o._id) },
      });
    } catch (e) {
      console.error('Failed to create prescription re-upload notifications:', e);
    }

    return res.json({ ok: true, prescription: nextPrescription });
  } catch (e) {
    console.error('Failed to re-upload prescription:', e);
    return res.status(400).json({ error: e?.message || 'Failed to re-upload prescription' });
  }
});


});

export default router;
