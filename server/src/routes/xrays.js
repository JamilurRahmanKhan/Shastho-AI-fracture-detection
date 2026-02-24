/**
 * Backend route: xrays
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the xrays feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { XrayCase } from '../models/XrayCase.js';
import { ReportShareLink } from '../models/ReportShareLink.js';
import { XrayComparison } from '../models/XrayComparison.js';
import { UserTrial } from '../models/UserTrial.js';
import { makeSimplePdf } from '../lib/pdf/simplePdf.js';
import { ensureDefaultEpisode, getEpisodeByIdForUser } from '../lib/subscriptions/episodes.js';
import { isSubscriptionsEnforced, consumeScan, consumePdfExport, consumeShareLink, consumeCompare, makePaywallPayload } from '../lib/subscriptions/enforce.js';
import { getEntitlementContext } from '../lib/subscriptions/engine.js';
import { annotateReportsWithLockState, isReportActiveForPremiumActions } from '../lib/subscriptions/reportLocks.js';
import {
  xrayUploadLimiter,
  pdfExportLimiter,
  shareLinkLimiter,
  compareLimiter,
} from '../middleware/rateLimiters.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeExt = ext.toLowerCase().slice(0, 10);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, name);
  }
});

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPEG/PNG/WEBP images are allowed'));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

function toBase64Url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function makeShareToken() {
  return toBase64Url(crypto.randomBytes(24));
}

async function buildXrayPdfBuffer({ xrayCase, hostUrl }) {
  const analysis = xrayCase.analysis || {};

  const title = 'ShasthoAI - X-ray Fracture Report';
  const lines = [
    `Report ID: ${xrayCase._id}`,
    `Created At: ${new Date(xrayCase.createdAt).toISOString()}`,
    '',
    `Region: ${analysis.region ?? 'N/A'}`,
    `Fracture Detected: ${analysis.fractureDetected ?? 'N/A'}`,
    `Probability: ${analysis.probability != null ? Math.round(Number(analysis.probability) * 100) / 100 : 'N/A'}%`,
    `Fracture Type: ${analysis.fractureType ?? 'N/A'}`,
    `Severity: ${analysis.severity ?? 'N/A'}`,
    `Recovery Timeline: ${analysis.recoveryTimeline ?? 'N/A'}`,
    '',
    `Image URL: ${hostUrl}${xrayCase.fileUrl || ''}`,
  ];

  // Optional arrays
  if (Array.isArray(analysis.recommendations) && analysis.recommendations.length) {
    lines.push('', 'Recommendations:');
    analysis.recommendations.slice(0, 20).forEach((r) => lines.push(`- ${String(r)}`));
  }
  if (Array.isArray(analysis.rehabExercises) && analysis.rehabExercises.length) {
    lines.push('', 'Rehab Exercises:');
    analysis.rehabExercises.slice(0, 20).forEach((r) => lines.push(`- ${String(r)}`));
  }

  return makeSimplePdf({ title, lines });
}

// POST /api/xrays/upload
router.post('/upload', requireFirebaseAuth, requireRole(['user']), xrayUploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file' });

    // Episode binding (additive):
    // - If caller provides episodeId, validate ownership.
    // - Otherwise, attach to the user's most recent open episode (or create one).
    let episodeId = null;
    const episodeIdRaw = req.body?.episodeId ? String(req.body.episodeId) : '';
    if (episodeIdRaw) {
      if (!mongoose.Types.ObjectId.isValid(episodeIdRaw)) {
        return res.status(400).json({ error: 'Invalid episodeId' });
      }
      const ep = await getEpisodeByIdForUser(req.user.uid, episodeIdRaw);
      if (!ep) return res.status(404).json({ error: 'Episode not found' });
      episodeId = ep._id;
    } else {
      const ep = await ensureDefaultEpisode(req.user.uid);
      episodeId = ep?._id || null;
    }

    // Subscription enforcement (additive, gated by env).
    // When enabled, uploading/analysing an X-ray consumes 1 scan credit.
    if (isSubscriptionsEnforced()) {
      // Enforce per-episode report history caps for PLAN/TRIAL contexts.
      // This prevents unbounded episode growth and matches the plan specs.
      if (episodeId) {
        const snap = await getEntitlementContext({ userUid: req.user.uid, episodeId: String(episodeId), now: new Date() });
        const cap = Number(snap?.entitlements?.reportsCap ?? 0);
        if ((snap?.sourceType === 'PLAN' || snap?.sourceType === 'TRIAL') && Number.isFinite(cap) && cap > 0) {
          const existing = await XrayCase.countDocuments({ userUid: req.user.uid, episodeId: String(episodeId) });
          if (existing >= cap) {
            await fs.unlink(req.file.path).catch(() => {});
            return res.status(402).json(
              makePaywallPayload({
                actionType: 'SCAN',
                message: `This episode has reached the report limit (${cap}). Create a new episode or upgrade to a higher plan to unlock more report slots.`,
                episodeId: String(episodeId),
                sourceHint: snap.sourceType,
                reason: 'REPORTS_CAP_REACHED',
              })
            );
          }
        }
      }

      const consumed = await consumeScan({
        userUid: req.user.uid,
        episodeId: episodeId ? String(episodeId) : null,
        ip: req.ip,
        note: 'X-ray upload + analysis',
      });
      if (!consumed) {
        // Clean up uploaded file to avoid orphan files.
        await fs.unlink(req.file.path).catch(() => {});
        return res
          .status(402)
          .json(
            makePaywallPayload({
              actionType: 'SCAN',
              message: 'No scan credits available. Activate a trial, purchase a plan, or buy a scan pack.',
              episodeId: episodeId ? String(episodeId) : null,
              sourceHint: 'PLAN/TRIAL/PACK',
            })
          );
      }
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // Stub AI analysis (replace later)
    const prob = Math.round((0.6 + Math.random() * 0.35) * 100) / 100; // 0.60–0.95
    const fractureDetected = prob > 0.7;

    const doc = await XrayCase.create({
      userUid: req.user.uid,
      episodeId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileUrl,
      analysis: {
        fractureDetected,
        probability: prob,
        fractureType: fractureDetected ? 'Possible fracture' : 'No fracture detected',
        severity: fractureDetected ? 'moderate' : 'none',
        region: 'N/A',
        recoveryTimeline: fractureDetected ? '4–6 weeks (estimate)' : 'N/A',
        recommendations: fractureDetected
          ? ['Consult an orthopedic specialist', 'Avoid heavy load on the affected area']
          : ['If pain persists, consult a specialist'],
        rehabExercises: fractureDetected
          ? ['Gentle range-of-motion exercises after doctor approval']
          : []
      }
    });

    return res.json({
      id: doc._id,
      episodeId: doc.episodeId,
      fileUrl: doc.fileUrl,
      analysis: doc.analysis,
      createdAt: doc.createdAt
    });
  } catch (err) {
    return res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// GET /api/xrays
router.get('/', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const q = { userUid: req.user.uid };
  if (req.query.episodeId) {
    const eid = String(req.query.episodeId);
    if (!mongoose.Types.ObjectId.isValid(eid)) {
      return res.status(400).json({ error: 'Invalid episodeId' });
    }
    q.episodeId = eid;
  }

  const items = await XrayCase.find(q).sort({ createdAt: -1 }).lean();

  // If an episode filter is used, annotate items with lock state based on the
  // current entitlement context (plan/trial/free base).
  if (q.episodeId && isSubscriptionsEnforced()) {
    const annotated = await annotateReportsWithLockState({
      userUid: req.user.uid,
      episodeId: String(q.episodeId),
      reports: items,
    });
    return res.json(annotated.reports);
  }

  return res.json(items);
});


// POST /api/xrays/compare
router.post('/compare', requireFirebaseAuth, requireRole(['user']), compareLimiter, async (req, res) => {
  try {
    const { leftId, rightId, notes = '' } = req.body || {};
    if (!leftId || !rightId) return res.status(400).json({ error: 'leftId and rightId are required' });
    if (!mongoose.Types.ObjectId.isValid(String(leftId)) || !mongoose.Types.ObjectId.isValid(String(rightId))) {
      return res.status(400).json({ error: 'Invalid id(s)' });
    }
    if (String(leftId) === String(rightId)) return res.status(400).json({ error: 'leftId and rightId must be different' });

    const [left, right] = await Promise.all([
      XrayCase.findOne({ _id: leftId, userUid: req.user.uid }).lean(),
      XrayCase.findOne({ _id: rightId, userUid: req.user.uid }).lean(),
    ]);
    if (!left || !right) return res.status(404).json({ error: 'Report(s) not found' });
    if (!left.episodeId || !right.episodeId || String(left.episodeId) !== String(right.episodeId)) {
      return res.status(400).json({ error: 'Reports must belong to the same episode' });
    }

    const episodeId = String(left.episodeId);

    if (isSubscriptionsEnforced()) {
      // Locked/older reports should not be usable for premium compare actions.
      const [leftActive, rightActive] = await Promise.all([
        isReportActiveForPremiumActions({ userUid: req.user.uid, episodeId, reportId: left._id, now: new Date() }),
        isReportActiveForPremiumActions({ userUid: req.user.uid, episodeId, reportId: right._id, now: new Date() }),
      ]);
      if (!leftActive.isActive || !rightActive.isActive) {
        return res.status(402).json(
          makePaywallPayload({
            actionType: 'COMPARE',
            message: 'One or both reports are locked for premium actions (only the most recent reports are active). Upgrade to unlock older reports for comparison.',
            episodeId,
            sourceHint: 'PLAN/TRIAL',
            reason: 'REPORT_LOCKED',
          })
        );
      }

      // Trial rule: compare is only available after the user has used both trial scans,
      // and only for reports created during the trial window.
      const snap = await getEntitlementContext({ userUid: req.user.uid, episodeId, now: new Date() });
      if (snap?.sourceType === 'TRIAL') {
        const trial = await UserTrial.findOne({ userUid: req.user.uid, status: 'active', episodeId, trialEndAt: { $gt: new Date() } }).lean();
        if (trial) {
          const scansUsed = Number(trial.usage?.scansUsed ?? 0);
          const required = Number(trial.entitlements?.scanCredits ?? 2);
          if (scansUsed < required) {
            return res.status(402).json(
              makePaywallPayload({
                actionType: 'COMPARE',
                message: 'Compare is available after you use both trial scans. Upload a follow-up scan to unlock comparison.',
                episodeId,
                sourceHint: 'TRIAL',
                reason: 'TRIAL_COMPARE_REQUIRES_2_SCANS',
              })
            );
          }
          const start = new Date(trial.trialStartAt);
          const end = new Date(trial.trialEndAt);
          const leftCreated = new Date(left.createdAt);
          const rightCreated = new Date(right.createdAt);
          const ok = leftCreated >= start && leftCreated <= end && rightCreated >= start && rightCreated <= end;
          if (!ok) {
            return res.status(402).json(
              makePaywallPayload({
                actionType: 'COMPARE',
                message: 'Trial compare can only be used for reports created during the active trial window.',
                episodeId,
                sourceHint: 'TRIAL',
                reason: 'TRIAL_COMPARE_WINDOW',
              })
            );
          }
        }
      }

      const consumed = await consumeCompare({ userUid: req.user.uid, episodeId, ip: req.ip, note: 'X-ray compare' });
      if (!consumed) {
        return res.status(402).json(
          makePaywallPayload({
            actionType: 'COMPARE',
            message: 'No compare actions available for this episode. Upgrade to compare scans.',
            episodeId,
            sourceHint: 'PLAN/TRIAL',
          })
        );
      }
    }

    const lp = Number(left.analysis?.probability ?? 0);
    const rp = Number(right.analysis?.probability ?? 0);
    const deltaProbability = (rp - lp);

    const cmp = await XrayComparison.create({
      userUid: req.user.uid,
      episodeId: left.episodeId,
      leftXrayCaseId: left._id,
      rightXrayCaseId: right._id,
      leftProbability: lp,
      rightProbability: rp,
      deltaProbability,
      notes: String(notes || '').slice(0, 2000),
    });

    return res.json(cmp);
  } catch (err) {
    return res.status(500).json({ error: 'Compare failed', details: err.message });
  }
});

// GET /api/xrays/comparisons?episodeId=...
router.get('/comparisons', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const q = { userUid: req.user.uid };
  if (req.query.episodeId) {
    const eid = String(req.query.episodeId);
    if (!mongoose.Types.ObjectId.isValid(eid)) return res.status(400).json({ error: 'Invalid episodeId' });
    q.episodeId = eid;
  }
  const items = await XrayComparison.find(q).sort({ createdAt: -1 }).lean();
  return res.json(items);
});

// POST /api/xrays/:id/export/pdf
router.post('/:id/export/pdf', requireFirebaseAuth, requireRole(['user']), pdfExportLimiter, async (req, res) => {
  try {
    const item = await XrayCase.findOne({ _id: req.params.id, userUid: req.user.uid }).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });

    const episodeId = item.episodeId ? String(item.episodeId) : null;

    if (isSubscriptionsEnforced()) {
      if (episodeId) {
        const active = await isReportActiveForPremiumActions({ userUid: req.user.uid, episodeId, reportId: item._id, now: new Date() });
        if (!active.isActive) {
          return res.status(402).json(
            makePaywallPayload({
              actionType: 'PDF_EXPORT',
              message: 'This report is locked for premium actions (only the most recent reports are active). Upgrade to unlock older reports for export.',
              episodeId,
              sourceHint: 'PLAN/TRIAL',
              reason: 'REPORT_LOCKED',
            })
          );
        }
      }
      const consumed = await consumePdfExport({
        userUid: req.user.uid,
        episodeId,
        ip: req.ip,
        note: 'PDF export',
        xrayCaseId: String(item._id),
        xrayCreatedAt: item.createdAt,
      });
      if (!consumed) {
        return res.status(402).json(
          makePaywallPayload({
            actionType: 'PDF_EXPORT',
            message: 'No PDF export credits available. Upgrade your plan to export reports.',
            episodeId,
            sourceHint: 'PLAN/TRIAL',
          })
        );
      }
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfBuffer = await buildXrayPdfBuffer({ xrayCase: item, hostUrl: baseUrl });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shasthoai-report-${item._id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ error: 'PDF export failed', details: err.message });
  }
});

// POST /api/xrays/:id/share
router.post('/:id/share', requireFirebaseAuth, requireRole(['user']), shareLinkLimiter, async (req, res) => {
  try {
    const item = await XrayCase.findOne({ _id: req.params.id, userUid: req.user.uid }).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });

    const episodeId = item.episodeId ? String(item.episodeId) : null;

    let consumedMeta = null;
    if (isSubscriptionsEnforced()) {
      if (episodeId) {
        const active = await isReportActiveForPremiumActions({ userUid: req.user.uid, episodeId, reportId: item._id, now: new Date() });
        if (!active.isActive) {
          return res.status(402).json(
            makePaywallPayload({
              actionType: 'SHARE_LINK',
              message: 'This report is locked for premium actions (only the most recent reports are active). Upgrade to unlock older reports for sharing.',
              episodeId,
              sourceHint: 'PLAN/TRIAL',
              reason: 'REPORT_LOCKED',
            })
          );
        }
      }
      consumedMeta = await consumeShareLink({
        userUid: req.user.uid,
        episodeId,
        ip: req.ip,
        note: 'Create share link',
        xrayCaseId: String(item._id),
        xrayCreatedAt: item.createdAt,
      });
      if (!consumedMeta) {
        return res.status(402).json(
          makePaywallPayload({
            actionType: 'SHARE_LINK',
            message: 'No share link credits available. Upgrade your plan to share reports.',
            episodeId,
            sourceHint: 'PLAN/TRIAL',
          })
        );
      }
    }

    // Expiry policy by plan/trial.
    const code = consumedMeta?.code || 'FREE_BASE';
    let expiresInDays = 7;
    if (code === 'RECOVERY_PLUS_12W') expiresInDays = 30;
    else if (code === 'RECOVERY_6W') expiresInDays = 14;
    else if (code === 'ACCIDENT_PASS_7D') expiresInDays = 14;
    else if (code === 'FREE_THREEDAYS') expiresInDays = 7;

    const token = makeShareToken();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const link = await ReportShareLink.create({
      token,
      userUid: req.user.uid,
      episodeId: item.episodeId,
      xrayCaseId: item._id,
      expiresAt,
    });

    const publicUrl = `${req.protocol}://${req.get('host')}/share/r/${token}`;
    return res.json({ token, url: publicUrl, expiresAt: link.expiresAt });
  } catch (err) {
    return res.status(500).json({ error: 'Share link creation failed', details: err.message });
  }
});

// GET /api/xrays/:id
router.get('/:id', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const item = await XrayCase.findOne({ _id: req.params.id, userUid: req.user.uid }).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json(item);
});

export default router;
