/**
 * Backend route: chat
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the chat feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { XrayCase } from '../models/XrayCase.js';
import { generateAssistantReply } from '../lib/aiChatProvider.js';
import { chatMessageLimiter } from '../middleware/rateLimiters.js';
import {
  isSubscriptionsEnforced,
  consumeScan,
  consumeScanContextChat,
  consumeGeneralChat,
  makePaywallPayload,
} from '../lib/subscriptions/enforce.js';
import { isReportActiveForPremiumActions } from '../lib/subscriptions/reportLocks.js';
import { ensureDefaultEpisode, getEpisodeByIdForUser } from '../lib/subscriptions/episodes.js';
import { getEntitlementContext } from '../lib/subscriptions/engine.js';
import { runFractureModel } from '../lib/ml/runFractureModel.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Chat-only X-ray upload + ML analysis
// This endpoint is ONLY used by /chat and does not change /api/xrays/upload.
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeExt = ext.toLowerCase().slice(0, 10);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Only JPEG/PNG/WEBP images are allowed'));
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/chat/xrays/upload
router.post('/xrays/upload', requireFirebaseAuth, requireRole(['user']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file' });

    // Episode binding (same as X-ray module)
    let episodeId = null;
    const episodeIdRaw = req.body?.episodeId ? String(req.body.episodeId) : '';
    if (episodeIdRaw) {
      if (!mongoose.Types.ObjectId.isValid(episodeIdRaw)) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: 'Invalid episodeId' });
      }
      const ep = await getEpisodeByIdForUser(req.user.uid, episodeIdRaw);
      if (!ep) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ error: 'Episode not found' });
      }
      episodeId = ep._id;
    } else {
      const ep = await ensureDefaultEpisode(req.user.uid);
      episodeId = ep?._id || null;
    }

    // Subscription enforcement (if enabled): 1 scan credit per analysis
    if (isSubscriptionsEnforced()) {
      // Respect per-episode report cap
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
                message: `This episode has reached the report limit (${cap}). Create a new episode or upgrade to unlock more report slots.`,
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
        note: 'Chat X-ray upload + ML analysis',
      });
      if (!consumed) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(402).json(
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

    // Run ML model
    let ml;
    try {
      ml = await runFractureModel({ imagePath: req.file.path });
    } catch (e) {
      return res.status(500).json({
        error: 'ML inference failed',
        message: e?.message || 'ML inference failed',
        details: e?.details || null,
        hint:
          'Restore venv39 (with torch/ultralytics) at model/Fracture_Detection_Improved_YOLOv8/venv39, or set PYTHON_BIN to a python with the required packages.',
      });
    }

    const prob = typeof ml?.probability === 'number' ? ml.probability : 0;
    const fractureDetected = Boolean(ml?.fractureDetected);

    // Map to existing schema
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
        probability: Math.max(0, Math.min(1, prob)),
        fractureType: fractureDetected ? 'Fracture detected (YOLOv8)' : 'No fracture detected',
        severity: fractureDetected ? 'unknown' : 'none',
        region: 'N/A',
        recoveryTimeline: fractureDetected ? 'Consult specialist for timeline' : 'N/A',
        recommendations: fractureDetected
          ? ['Consult an orthopedic specialist', 'Avoid load on the affected area until reviewed']
          : ['If pain persists, consult a clinician'],
        rehabExercises: [],
        ml: {
          boxes: Array.isArray(ml?.boxes) ? ml.boxes : [],
        },
      },
    });

    return res.json({
      id: doc._id,
      episodeId: doc.episodeId,
      fileUrl: doc.fileUrl,
      analysis: doc.analysis,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Upload failed', details: err?.message || String(err) });
  }
});

// GET /api/chat/sessions/default
router.get('/sessions/default', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  let session = await ChatSession.findOne({ userUid: req.user.uid }).sort({ createdAt: -1 });
  if (!session) {
    session = await ChatSession.create({ userUid: req.user.uid, title: 'X-ray Assistant' });
  }
  return res.json(session);
});

// POST /api/chat/sessions
router.post('/sessions', requireFirebaseAuth, async (req, res) => {
  const title = (req.body?.title || 'X-ray Assistant').toString().slice(0, 80);
  const session = await ChatSession.create({ userUid: req.user.uid, title });
  return res.json(session);
});

// GET /api/chat/sessions/:id/messages
router.get('/sessions/:id/messages', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const session = await ChatSession.findOne({ _id: req.params.id, userUid: req.user.uid });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const messages = await ChatMessage.find({ sessionId: session._id, userUid: req.user.uid })
    .sort({ createdAt: 1 })
    .lean();

  return res.json(messages);
});

// POST /api/chat/sessions/:id/messages
// body: { content: string, xrayCaseId?: string }
router.post('/sessions/:id/messages', requireFirebaseAuth, requireRole(['user']), chatMessageLimiter, async (req, res) => {
  const session = await ChatSession.findOne({ _id: req.params.id, userUid: req.user.uid });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const content = (req.body?.content || '').toString().trim();
  if (!content) return res.status(400).json({ error: 'Message is empty' });
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Message is too long (max 2000 characters)' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Message is too long (max 2000 characters).' });
  }

  const xrayCaseId = req.body?.xrayCaseId ? String(req.body.xrayCaseId) : null;
  let xray = null;
  if (xrayCaseId) {
    xray = await XrayCase.findOne({ _id: xrayCaseId, userUid: req.user.uid }).lean();
  }

  // Subscription enforcement (additive, gated by env).
  // - If xrayCaseId is provided and it is bound to an episode, this is "scan-context" chat.
  // - Otherwise it's "general" chat.
  if (isSubscriptionsEnforced()) {
    if (xrayCaseId && xray?.episodeId) {
      // Locked/older reports should not be usable for scan-context chat.
      const active = await isReportActiveForPremiumActions({
        userUid: req.user.uid,
        episodeId: String(xray.episodeId),
        reportId: xray._id,
        now: new Date(),
      });
      if (!active.isActive) {
        return res.status(402).json(
          makePaywallPayload({
            actionType: 'CHAT_SCAN_CONTEXT',
            message:
              'This report is locked for scan-context chat (only the most recent reports are active). Upgrade to unlock older reports for scan-context support.',
            episodeId: String(xray.episodeId),
            sourceHint: 'PLAN/TRIAL',
            reason: 'REPORT_LOCKED',
          })
        );
      }
      const consumed = await consumeScanContextChat({
        userUid: req.user.uid,
        episodeId: String(xray.episodeId),
        ip: req.ip,
        note: 'Chat message (scan-context)',
        chatSessionId: String(session._id),
        xrayCaseId: String(xray._id),
      });
      if (!consumed) {
        return res
          .status(402)
          .json(
            makePaywallPayload({
              actionType: 'CHAT_SCAN_CONTEXT',
              message: 'Scan-context chat quota reached. Upgrade your plan or activate a trial to continue.',
              episodeId: String(xray.episodeId),
              sourceHint: 'PLAN/TRIAL',
            })
          );
      }
    } else {
      const consumed = await consumeGeneralChat({
        userUid: req.user.uid,
        ip: req.ip,
        note: 'Chat message (general)',
        chatSessionId: String(session._id),
      });
      if (!consumed) {
        return res
          .status(402)
          .json(
            makePaywallPayload({
              actionType: 'CHAT_GENERAL',
              message: 'General chat quota reached. Try again later or upgrade to a plan.',
              episodeId: null,
              sourceHint: 'PLAN/TRIAL/FREE_BASE',
            })
          );
      }
    }
  }

  const userMsg = await ChatMessage.create({
    sessionId: session._id,
    userUid: req.user.uid,
    role: 'user',
    content,
    xrayCaseId: xray?._id
  });

  const assistantText = await generateAssistantReply({
    userMessage: content,
    context: { xray }
  });

  const assistantMsg = await ChatMessage.create({
    sessionId: session._id,
    userUid: req.user.uid,
    role: 'assistant',
    content: assistantText,
    xrayCaseId: xray?._id
  });

  return res.json({ user: userMsg, assistant: assistantMsg });
});

export default router;
