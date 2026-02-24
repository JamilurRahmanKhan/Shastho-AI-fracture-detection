/**
 * Backend route: pharmacyInventory
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the pharmacyInventory feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { PharmacyInventoryItem } from '../models/PharmacyInventoryItem.js';
import { getPricingConfig } from '../lib/storePricing.js';

const router = express.Router();

// All routes require pharmacy authentication.
router.use(requireFirebaseAuth);
router.use(requireRole('pharmacy'));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG/WEBP images are allowed'));
    }
    return cb(null, true);
  },
});

function getBucket() {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('MongoDB connection not ready');
  return new GridFSBucket(db, { bucketName: 'pharmacy_inventory_images' });
}

async function uploadImageToGridFS(file, { pharmacyUid, itemId } = {}) {
  const bucket = getBucket();
  const ext = (file.originalname || '').split('.').pop();
  const safeExt = ext ? `.${ext.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  const filename = `inv_${itemId || crypto.randomUUID()}_${Date.now()}${safeExt}`;
  return await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.mimetype,
      metadata: {
        pharmacyUid,
        itemId: itemId ? String(itemId) : '',
        originalName: file.originalname || '',
      },
    });
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve({ fileId: uploadStream.id, filename }));
    uploadStream.end(file.buffer);
  });
}

async function deleteImageFromGridFS(fileId) {
  if (!fileId) return;
  const bucket = getBucket();
  try {
    await bucket.delete(new mongoose.Types.ObjectId(String(fileId)));
  } catch {
    // ignore
  }
}


function safeNumber(v, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (v === '' || v === null || typeof v === 'undefined') return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}


function parseBoolean(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true') return true;
    if (s === 'false') return false;
  }
  if (typeof v === 'number') return v === 1 ? true : v === 0 ? false : undefined;
  return undefined;
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .map(t => String(t).trim())
      .filter(Boolean)
      .slice(0, 30);
  }
  // comma-separated string
  return String(tags)
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeStringArray(v, { maxItems = 20 } = {}) {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }
  // Accept comma or newline separated strings.
  return String(v)
    .split(/\r?\n|,/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function computeStatus(item, expiringDays = 60) {
  const now = new Date();
  const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
  const expSoonMs = expiringDays * 24 * 60 * 60 * 1000;

  const isExpired = Boolean(expiry && expiry.getTime() < now.getTime());
  const isExpiringSoon = Boolean(
    expiry &&
      expiry.getTime() >= now.getTime() &&
      expiry.getTime() <= (now.getTime() + expSoonMs)
  );

  const stock = Number(item.stockQuantity || 0);
  const reorder = Number(item.reorderLevel || 0);

  if (stock <= 0) return { status: 'out', isExpired, isExpiringSoon };
  if (isExpired) return { status: 'expired', isExpired, isExpiringSoon };
  if (isExpiringSoon) return { status: 'expiring', isExpired, isExpiringSoon };
  if (stock > 0 && reorder > 0 && stock <= reorder) return { status: 'low', isExpired, isExpiringSoon };
  return { status: 'in-stock', isExpired, isExpiringSoon };
}

// GET /api/pharmacy/inventory
// Query params:
// - search: text
// - category
// - status: in-stock|low|out|expiring|expired
// - page, limit
// - sort: createdAt|name|stockQuantity|expiryDate
// - order: asc|desc
// - expiringDays (default 60)
router.get('/', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const {
      search = '',
      category = '',
      status = '',
      sort = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '20',
      expiringDays = '60',
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const expDays = Math.min(365, Math.max(1, Number(expiringDays) || 60));

    const filter = {
      pharmacyUid,
      isDeleted: false,
    };

    if (category) filter.category = category;

    // Status filter (server-side)
    const now = new Date();
    if (status === 'out') {
      filter.stockQuantity = { $lte: 0 };
    } else if (status === 'low') {
      // low stock: stock >0 and <= reorderLevel
      filter.$expr = {
        $and: [
          { $gt: ['$stockQuantity', 0] },
          { $gt: ['$reorderLevel', 0] },
          { $lte: ['$stockQuantity', '$reorderLevel'] },
        ],
      };
    } else if (status === 'expired') {
      filter.expiryDate = { $lt: now };
      filter.stockQuantity = { $gt: 0 };
    } else if (status === 'expiring') {
      const until = new Date(now.getTime() + expDays * 24 * 60 * 60 * 1000);
      filter.expiryDate = { $gte: now, $lte: until };
      filter.stockQuantity = { $gt: 0 };
    } else if (status === 'in-stock') {
      // not out, not expired
      filter.stockQuantity = { $gt: 0 };
      // expiryDate either null OR >= now
      filter.$or = [{ expiryDate: null }, { expiryDate: { $gte: now } }];
    }

    const sortField = ['createdAt', 'name', 'stockQuantity', 'expiryDate', 'price'].includes(sort)
      ? sort
      : 'createdAt';
    const sortDir = order === 'asc' ? 1 : -1;
    const sortSpec = { [sortField]: sortDir };
    // Search
    // Prefer text search when a text index is present, but gracefully fall back to regex search
    // if the collection doesn't have a text index (prevents 500 errors in fresh deployments).
    const q = search && String(search).trim() ? String(search).trim() : '';
    if (q) {
      filter.$text = { $search: q };
    }
let total, docs;
    try {
      [total, docs] = await Promise.all([
        PharmacyInventoryItem.countDocuments(filter),
        PharmacyInventoryItem.find(filter).sort(sortSpec).skip(skip).limit(limitNum).lean(),
      ]);
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      const code = err?.code;
      const isTextIndexError =
        msg.includes('text index') || msg.includes('$text') || code === 27; // 27 is IndexNotFound in MongoDB

      if (!q || !isTextIndexError) throw err;

      // Remove $text and fallback to regex across common searchable fields
      const safe = { ...filter };
      delete safe.$text;
      safe.$or = [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $elemMatch: { $regex: q, $options: 'i' } } },
        { batchNo: { $regex: q, $options: 'i' } },
      ];

      [total, docs] = await Promise.all([
        PharmacyInventoryItem.countDocuments(safe),
        PharmacyInventoryItem.find(safe).sort(sortSpec).skip(skip).limit(limitNum).lean(),
      ]);
    }
const items = docs.map((d) => ({
      ...d,
      id: String(d._id),
      imageUrl: d.imageFileId ? `/api/pharmacy/inventory/${String(d._id)}/image` : '',
      ...computeStatus(d, expDays),
    }));

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (e) {
    console.error('Failed to list pharmacy inventory:', e);
    res.status(500).json({ error: 'Failed to list inventory' });
  }
});

// GET /api/pharmacy/inventory/:id
router.get('/:id', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await PharmacyInventoryItem.findOne({ _id: id, pharmacyUid, isDeleted: false }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const imageUrl = doc.imageFileId ? `/api/pharmacy/inventory/${String(doc._id)}/image` : '';
    res.json({ ...doc, id: String(doc._id), imageUrl, ...computeStatus(doc) });
  } catch (e) {
    console.error('Failed to get pharmacy inventory item:', e);
    res.status(500).json({ error: 'Failed to get inventory item' });
  }
});

// GET /api/pharmacy/inventory/:id/image
// Streams the stored medicine image from GridFS.
router.get('/:id/image', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await PharmacyInventoryItem.findOne({ _id: id, pharmacyUid, isDeleted: false }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!doc.imageFileId) return res.status(404).json({ error: 'No image' });

    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(String(doc.imageFileId));

    // Try to get file metadata for headers.
    const files = await mongoose.connection.db
      .collection('pharmacy_inventory_images.files')
      .find({ _id: fileId })
      .limit(1)
      .toArray();
    const f = files?.[0];

    res.setHeader('Content-Type', (f && f.contentType) || doc.imageMeta?.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=300');
    // Inline display
    if (f?.filename) res.setHeader('Content-Disposition', `inline; filename="${String(f.filename).replace(/\"/g, '')}"`);

    const stream = bucket.openDownloadStream(fileId);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
      else res.end();
    });
    stream.pipe(res);
  } catch (e) {
    console.error('Failed to stream inventory image:', e);
    res.status(500).json({ error: 'Failed to load image' });
  }
});

// POST /api/pharmacy/inventory
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const payload = req.body || {};

    const name = String(payload.name || '').trim();
    const price = safeNumber(payload.price, { min: 0, max: 1_000_000 });

    if (!name) return res.status(400).json({ error: 'Medicine name is required' });
    // Enforce a single store currency (from StorePricingConfig) to prevent mixed-currency carts.
    const pricingCfg = await getPricingConfig();
    const enforcedCurrency = String(pricingCfg?.baseCurrencyCode || 'BDT').trim().toUpperCase() || 'BDT';

    if (typeof price === 'undefined') return res.status(400).json({ error: 'Price is required' });

    
    let imagePayload = {};
    if (req.file) {
      const up = await uploadImageToGridFS(req.file, { pharmacyUid });
      imagePayload = {
        imageFileId: up.fileId,
        imageMeta: {
          filename: up.filename,
          contentType: req.file.mimetype,
          size: req.file.size || (req.file.buffer ? req.file.buffer.length : 0),
          uploadedAt: new Date(),
        },
      };
    }

const doc = await PharmacyInventoryItem.create({
      pharmacyUid,
      name,
      genericName: String(payload.genericName || '').trim(),
      category: String(payload.category || '').trim(),
      dosage: String(payload.dosage || '').trim(),
      form: String(payload.form || '').trim(),
      manufacturer: String(payload.manufacturer || '').trim(),
      sku: String(payload.sku || '').trim(),
      price,
      discountPrice: safeNumber(payload.discountPrice, { min: 0, max: 1_000_000 }) ?? null,
      currency: enforcedCurrency,
      stockQuantity: safeNumber(payload.stockQuantity, { min: 0, max: 10_000_000 }) ?? 0,
      reorderLevel: safeNumber(payload.reorderLevel, { min: 0, max: 10_000_000 }) ?? 0,
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
      batchNo: String(payload.batchNo || '').trim(),
      supplier: String(payload.supplier || '').trim(),
      requiresPrescription: parseBoolean(payload.requiresPrescription) ?? false,
      description: String(payload.description || '').trim(),
      longDescription: String(payload.longDescription || '').trim(),
      keyBenefits: normalizeStringArray(payload.keyBenefits),
      usageInstructions: String(payload.usageInstructions || '').trim(),
      warnings: String(payload.warnings || '').trim(),
      tags: normalizeTags(payload.tags),
      createdByUid: pharmacyUid,
      updatedByUid: pharmacyUid,
        ...imagePayload,
    });

    const lean = doc.toObject();
    const imageUrl = lean.imageFileId ? `/api/pharmacy/inventory/${String(lean._id)}/image` : '';
    res.status(201).json({ ...lean, id: String(lean._id), imageUrl, ...computeStatus(lean) });
  } catch (e) {
    console.error('Failed to create pharmacy inventory item:', e);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// PATCH /api/pharmacy/inventory/:id
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const payload = req.body || {};
    const update = {};

  const setString = (k) => {
    if (typeof payload[k] !== 'undefined') update[k] = String(payload[k] || '').trim();
  };

  // Allowed fields
  setString('name');
  setString('genericName');
  setString('category');
  setString('dosage');
  setString('form');
  setString('manufacturer');
  setString('sku');
  setString('batchNo');
  setString('supplier');
  setString('description');
  setString('longDescription');
  setString('usageInstructions');
  setString('warnings');

  if (typeof payload.price !== 'undefined') {
    const n = safeNumber(payload.price, { min: 0, max: 1_000_000 });
    if (typeof n === 'undefined') return res.status(400).json({ error: 'Invalid price' });
    update.price = n;
  }

  if (typeof payload.discountPrice !== 'undefined') {
    const n = safeNumber(payload.discountPrice, { min: 0, max: 1_000_000 });
    update.discountPrice = (payload.discountPrice === null || payload.discountPrice === '') ? null : n;
  }

  if (typeof payload.stockQuantity !== 'undefined') {
    const n = safeNumber(payload.stockQuantity, { min: 0, max: 10_000_000 });
    if (typeof n === 'undefined') return res.status(400).json({ error: 'Invalid stock quantity' });
    update.stockQuantity = n;
  }

  if (typeof payload.reorderLevel !== 'undefined') {
    const n = safeNumber(payload.reorderLevel, { min: 0, max: 10_000_000 });
    if (typeof n === 'undefined') return res.status(400).json({ error: 'Invalid reorder level' });
    update.reorderLevel = n;
  }

  if (typeof payload.expiryDate !== 'undefined') {
    update.expiryDate = payload.expiryDate ? new Date(payload.expiryDate) : null;
  }

  if (typeof payload.requiresPrescription !== 'undefined') {
    const b = parseBoolean(payload.requiresPrescription);
    if (typeof b !== 'undefined') update.requiresPrescription = b;
  }

  if (typeof payload.tags !== 'undefined') {
    update.tags = normalizeTags(payload.tags);
  }

  if (typeof payload.keyBenefits !== 'undefined') {
    update.keyBenefits = normalizeStringArray(payload.keyBenefits);
  }


  update.updatedByUid = pharmacyUid;

    
    if (req.file) {
      const existing = await PharmacyInventoryItem.findOne({ _id: id, pharmacyUid, isDeleted: false }).lean();
      const up = await uploadImageToGridFS(req.file, { pharmacyUid, itemId: id });
      update.imageFileId = up.fileId;
      update.imageMeta = {
        filename: up.filename,
        contentType: req.file.mimetype,
        size: req.file.size || (req.file.buffer ? req.file.buffer.length : 0),
        uploadedAt: new Date(),
      };
      if (existing?.imageFileId) {
        await deleteImageFromGridFS(existing.imageFileId);
      }
    }

const doc = await PharmacyInventoryItem.findOneAndUpdate(
      { _id: id, pharmacyUid, isDeleted: false },
      { $set: update },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ error: 'Not found' });
    const imageUrl = doc.imageFileId ? `/api/pharmacy/inventory/${String(doc._id)}/image` : '';
    res.json({ ...doc, id: String(doc._id), imageUrl, ...computeStatus(doc) });
  } catch (e) {
    console.error('Failed to update pharmacy inventory item:', e);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// DELETE /api/pharmacy/inventory/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const pharmacyUid = req.user.uid;
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await PharmacyInventoryItem.findOneAndUpdate(
      { _id: id, pharmacyUid, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedByUid: pharmacyUid } },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete pharmacy inventory item:', e);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

export default router;
