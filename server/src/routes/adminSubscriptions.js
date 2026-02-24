/**
 * Backend route: adminSubscriptions
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the adminSubscriptions feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { initFirebaseAdmin } from '../config/firebaseAdmin.js';

import { EpisodePlan } from '../models/EpisodePlan.js';
import { UserTrial } from '../models/UserTrial.js';
import { EntitlementWallet } from '../models/EntitlementWallet.js';
import { EntitlementLedger } from '../models/EntitlementLedger.js';
import { InjuryEpisode } from '../models/InjuryEpisode.js';

import { getPlanFromCatalog } from '../lib/subscriptions/catalog.js';

const router = express.Router();

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

async function fetchUserProfiles(userUids) {
  const uids = Array.from(new Set((userUids || []).filter(Boolean).map((u) => String(u))));
  if (uids.length === 0) return new Map();

  try {
    const admin = initFirebaseAdmin();
    const refs = uids.slice(0, 200).map((uid) => admin.firestore().doc(`users/${uid}`));
    const snaps = await admin.firestore().getAll(...refs);
    const out = new Map();
    snaps.forEach((snap, i) => {
      const uid = uids[i];
      if (!snap?.exists) return;
      const d = snap.data() || {};
      out.set(uid, {
        uid,
        name: d.name || '',
        email: d.email || '',
        role: d.role || '',
      });
    });
    return out;
  } catch (e) {
    console.warn('adminSubscriptions: user profile enrichment failed:', e?.message || e);
    return new Map();
  }
}

// GET /api/admin/subscriptions/summary?rangeDays=30
router.get('/summary', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const rangeDays = clamp(toInt(req.query.rangeDays, 30), 1, 365);
    const start = DateTime.fromJSDate(now).minus({ days: rangeDays }).startOf('day').toJSDate();
    const prevStart = DateTime.fromJSDate(start).minus({ days: rangeDays }).toJSDate();

    const [
      activePlans,
      activeTrials,
      totalSubscribers,
      revenueAgg,
      revenueSeries,
      distribution,
      activity,
      prevActivePlans,
    ] = await Promise.all([
      EpisodePlan.countDocuments({ status: 'active', endAt: { $gt: now } }),
      UserTrial.countDocuments({ status: 'active', trialEndAt: { $gt: now } }),
      EpisodePlan.distinct('userUid', { status: 'active', endAt: { $gt: now } }).then((a) => a.length),
      EpisodePlan.aggregate([
        { $match: { status: { $in: ['active', 'expired', 'cancelled', 'archived'] }, createdAt: { $gte: start } } },
        { $group: { _id: null, amount: { $sum: '$billing.amount' } } },
      ]),
      EpisodePlan.aggregate([
        { $match: { status: { $in: ['active', 'expired', 'cancelled', 'archived'] }, createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$billing.amount' },
            plans: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      EpisodePlan.aggregate([
        { $match: { status: 'active', endAt: { $gt: now } } },
        { $group: { _id: '$planCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      EntitlementLedger.find({}).sort({ createdAt: -1 }).limit(15).lean(),
      EpisodePlan.countDocuments({ status: 'active', endAt: { $gt: start }, startAt: { $gte: prevStart, $lt: start } }),
    ]);

    const revenue = Number(revenueAgg?.[0]?.amount || 0);
    const growthRate = prevActivePlans > 0 ? Math.round(((activePlans - prevActivePlans) / prevActivePlans) * 100) : (activePlans > 0 ? 100 : 0);

    return res.json({
      rangeDays,
      kpis: {
        totalSubscribers,
        activePlans,
        activeTrials,
        revenue,
        growthRate,
      },
      revenueSeries: (revenueSeries || []).map((r) => ({ date: r._id, amount: Number(r.amount || 0), plans: Number(r.plans || 0) })),
      planDistribution: (distribution || []).map((d) => ({ code: d._id, count: Number(d.count || 0) })),
      recentActivity: (activity || []).map((a) => ({
        id: String(a._id),
        userUid: a.userUid,
        episodeId: a.episodeId ? String(a.episodeId) : null,
        sourceType: a.sourceType,
        actionType: a.actionType,
        amount: a.amount,
        note: a.note,
        createdAt: a.createdAt,
      })),
    });
  } catch (e) {
    console.error('admin subscriptions summary failed:', e);
    return res.status(500).json({ error: 'Failed to load subscription summary' });
  }
});

// GET /api/admin/subscriptions/plans
router.get('/plans', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const page = clamp(toInt(req.query.page, 1), 1, 5000);
    const limit = clamp(toInt(req.query.limit, 30), 5, 200);
    const status = req.query.status ? String(req.query.status) : null;
    const code = req.query.code ? String(req.query.code) : null;
    const q = req.query.q ? String(req.query.q).trim() : '';
    const enrich = String(req.query.enrich || '1') === '1';

    const filter = {};
    if (status && ['active', 'expired', 'cancelled', 'archived'].includes(status)) filter.status = status;
    if (code) filter.planCode = code;

    if (q) {
      // Match userUid substring and allow exact ObjectId match for episodeId
      const or = [{ userUid: { $regex: q, $options: 'i' } }];
      if (mongoose.Types.ObjectId.isValid(q)) or.push({ episodeId: new mongoose.Types.ObjectId(q) });
      filter.$or = or;
    }

    const [total, items] = await Promise.all([
      EpisodePlan.countDocuments(filter),
      EpisodePlan.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);

    const userMap = enrich ? await fetchUserProfiles(items.map((p) => p.userUid)) : new Map();

    return res.json({
      page,
      limit,
      total,
      items: items.map((p) => ({
        id: String(p._id),
        userUid: p.userUid,
        user: userMap.get(p.userUid) || null,
        episodeId: String(p.episodeId),
        planCode: p.planCode,
        status: p.status,
        startAt: p.startAt,
        endAt: p.endAt,
        billing: p.billing || { currency: 'BDT', amount: 0 },
        usage: p.usage || {},
        entitlements: p.entitlements || {},
        createdAt: p.createdAt,
      })),
    });
  } catch (e) {
    console.error('admin subscriptions plans failed:', e);
    return res.status(500).json({ error: 'Failed to list plans' });
  }
});

// GET /api/admin/subscriptions/trials
router.get('/trials', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const page = clamp(toInt(req.query.page, 1), 1, 5000);
    const limit = clamp(toInt(req.query.limit, 30), 5, 200);
    const q = req.query.q ? String(req.query.q).trim() : '';
    const filter = {};
    if (q) filter.userUid = { $regex: q, $options: 'i' };

    const [total, items] = await Promise.all([
      UserTrial.countDocuments(filter),
      UserTrial.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);

    const userMap = await fetchUserProfiles(items.map((t) => t.userUid));

    return res.json({
      page,
      limit,
      total,
      items: items.map((t) => ({
        id: String(t._id),
        userUid: t.userUid,
        user: userMap.get(t.userUid) || null,
        episodeId: String(t.episodeId),
        code: t.code,
        status: t.status,
        trialStartAt: t.trialStartAt,
        trialEndAt: t.trialEndAt,
        nextEligibleAt: t.nextEligibleAt,
        usage: t.usage || {},
        entitlements: t.entitlements || {},
        createdAt: t.createdAt,
      })),
    });
  } catch (e) {
    console.error('admin subscriptions trials failed:', e);
    return res.status(500).json({ error: 'Failed to list trials' });
  }
});

// GET /api/admin/subscriptions/activity
router.get('/activity', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const limit = clamp(toInt(req.query.limit, 30), 5, 200);
    const q = req.query.q ? String(req.query.q).trim() : '';
    const filter = {};
    if (q) {
      filter.$or = [{ userUid: { $regex: q, $options: 'i' } }, { actionType: { $regex: q, $options: 'i' } }];
    }

    const items = await EntitlementLedger.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

    const userMap = await fetchUserProfiles(items.map((x) => x.userUid));

    return res.json({
      items: items.map((x) => ({
        id: String(x._id),
        userUid: x.userUid,
        user: userMap.get(x.userUid) || null,
        episodeId: x.episodeId ? String(x.episodeId) : null,
        sourceType: x.sourceType,
        actionType: x.actionType,
        amount: x.amount,
        note: x.note,
        createdAt: x.createdAt,
      })),
    });
  } catch (e) {
    console.error('admin subscriptions activity failed:', e);
    return res.status(500).json({ error: 'Failed to load activity' });
  }
});

// GET /api/admin/subscriptions/user/:userUid/episodes
// Admin helper to choose a human-friendly episode rather than typing Mongo ObjectIds.
router.get('/user/:userUid/episodes', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const userUid = String(req.params.userUid || '').trim();
    if (!userUid) return res.status(400).json({ error: 'Missing userUid' });

    // Show open episodes first, then most recent.
    const eps = await InjuryEpisode.find({ userUid })
      .sort({ status: -1, createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      items: eps.map((e) => ({
        id: String(e._id),
        title: e.title || 'Injury Episode',
        status: e.status,
        createdAt: e.createdAt,
        closedAt: e.closedAt || null,
      })),
    });
  } catch (e) {
    console.error('admin list user episodes failed:', e);
    return res.status(500).json({ error: 'Failed to list episodes' });
  }
});

// POST /api/admin/subscriptions/grant/plan
router.post('/grant/plan', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const adminUid = req.user.uid;
    const userUid = String(req.body?.userUid || '').trim();
    const planCode = String(req.body?.planCode || '').trim();
    const episodeMode = typeof req.body?.episodeMode === 'string' ? req.body.episodeMode : 'most_recent_open';
    const episodeIdRaw = req.body?.episodeId ? String(req.body.episodeId) : '';
    const amount = Number(req.body?.amount || 0);
    const currency = typeof req.body?.currency === 'string' ? req.body.currency : 'BDT';
    const provider = typeof req.body?.provider === 'string' ? req.body.provider : 'admin';
    const providerRef = typeof req.body?.providerRef === 'string' ? req.body.providerRef : '';
    const adminNote = typeof req.body?.adminNote === 'string' ? req.body.adminNote : '';

    if (!userUid) return res.status(400).json({ error: 'Missing userUid' });
    const plan = getPlanFromCatalog(planCode);
    if (!plan) return res.status(400).json({ error: 'Invalid planCode' });

    const now = new Date();

    // Global no-switching rule: one active plan/trial per user at a time.
    await EpisodePlan.updateMany({ userUid, status: 'active', endAt: { $lte: now } }, { $set: { status: 'expired' } });
    await UserTrial.updateMany({ userUid, status: 'active', trialEndAt: { $lte: now } }, { $set: { status: 'expired' } });

    const activePlan = await EpisodePlan.findOne({ userUid, status: 'active', endAt: { $gt: now } }).lean();
    if (activePlan) {
      return res.status(409).json({
        error: 'User already has an active plan. Cancel/expire it before granting a new plan.',
        activePlan: { id: String(activePlan._id), planCode: activePlan.planCode, endAt: activePlan.endAt, episodeId: String(activePlan.episodeId) },
      });
    }

    const activeTrial = await UserTrial.findOne({ userUid, status: 'active', trialEndAt: { $gt: now } }).lean();
    if (activeTrial) {
      return res.status(409).json({
        error: 'User has an active free trial. Wait for it to end before granting a paid plan.',
        activeTrial: { id: String(activeTrial._id), trialEndAt: activeTrial.trialEndAt, episodeId: String(activeTrial.episodeId) },
      });
    }

    let episodeId = null;
    if (episodeIdRaw && mongoose.Types.ObjectId.isValid(episodeIdRaw)) episodeId = new mongoose.Types.ObjectId(episodeIdRaw);

    // Resolve episode:
    // - specific: use provided episodeId
    // - create_new: always create a new open episode for this user
    // - most_recent_open (default): attach to most recent open, else create
    let episode = null;
    if (episodeMode === 'specific' && !episodeId) return res.status(400).json({ error: 'episodeId is required for episodeMode=specific' });

    if (episodeMode === 'create_new') {
      episode = await InjuryEpisode.create({ userUid, title: 'Injury Episode', status: 'open' });
      episodeId = episode._id;
    } else if (episodeId) {
      episode = await InjuryEpisode.findOne({ _id: episodeId, userUid }).lean();
      if (!episode) return res.status(404).json({ error: 'Episode not found for user' });
    } else {
      episode = await InjuryEpisode.findOne({ userUid, status: 'open' }).sort({ createdAt: -1 }).lean();
      if (!episode) {
        episode = await InjuryEpisode.create({ userUid, title: 'Injury Episode', status: 'open' });
      }
      episodeId = episode._id;
    }
    const startAt = now;
    const endAt = DateTime.fromJSDate(now).plus({ days: plan.durationDays }).toJSDate();

    const created = await EpisodePlan.create({
      userUid,
      episodeId,
      planCode: plan.code,
      status: 'active',
      startAt,
      endAt,
      entitlements: plan.entitlements,
      billing: {
        currency,
        amount: Number.isFinite(amount) ? amount : 0,
        provider,
        providerRef,
        purchasedAt: now,
      },
      grantedByUid: adminUid,
      adminNote,
    });

    await EntitlementLedger.create({
      userUid,
      episodeId,
      sourceType: 'ADMIN_ADJUST',
      sourceId: String(created._id),
      actionType: 'OTHER',
      amount: 1,
      note: `Admin granted plan ${plan.code}${adminNote ? `: ${adminNote}` : ''}`,
      ip: req.ip,
    });

    return res.json({ id: String(created._id) });
  } catch (e) {
    console.error('admin grant plan failed:', e);
    return res.status(500).json({ error: 'Failed to grant plan' });
  }
});

// POST /api/admin/subscriptions/plans/:id/cancel
router.post('/plans/:id/cancel', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const planId = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(planId)) return res.status(400).json({ error: 'Invalid plan id' });
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';

    const now = new Date();
    const plan = await EpisodePlan.findOneAndUpdate(
      { _id: planId },
      { $set: { status: 'cancelled', endAt: now } },
      { new: true }
    ).lean();

    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    await EntitlementLedger.create({
      userUid: plan.userUid,
      episodeId: plan.episodeId,
      sourceType: 'ADMIN_ADJUST',
      sourceId: String(plan._id),
      actionType: 'OTHER',
      amount: 1,
      note: `Admin cancelled plan ${plan.planCode}${reason ? `: ${reason}` : ''}`,
      ip: req.ip,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('admin cancel plan failed:', e);
    return res.status(500).json({ error: 'Failed to cancel plan' });
  }
});

// POST /api/admin/subscriptions/grant/pack
router.post('/grant/pack', requireFirebaseAuth, requireRole('admin'), async (req, res) => {
  try {
    const userUid = String(req.body?.userUid || '').trim();
    const packType = String(req.body?.packType || '').trim();
    const credits = Number(req.body?.credits || 0);

    if (!userUid) return res.status(400).json({ error: 'Missing userUid' });
    if (!['SCAN_PACK', 'PDF_PACK'].includes(packType)) return res.status(400).json({ error: 'Invalid packType' });
    if (!Number.isFinite(credits) || credits <= 0) return res.status(400).json({ error: 'Invalid credits' });

    const meta = {
      provider: typeof req.body?.provider === 'string' ? req.body.provider : 'admin',
      providerRef: typeof req.body?.providerRef === 'string' ? req.body.providerRef : '',
      currency: typeof req.body?.currency === 'string' ? req.body.currency : 'BDT',
      amount: Number(req.body?.amount || 0) || 0,
    };

    const wallet = await EntitlementWallet.findOne({ userUid }).lean();
    if (!wallet) {
      await EntitlementWallet.create({
        userUid,
        packs: [{ packType, totalCredits: credits, remainingCredits: credits, meta }],
      });
    } else {
      await EntitlementWallet.updateOne(
        { userUid },
        { $push: { packs: { packType, totalCredits: credits, remainingCredits: credits, meta } } }
      );
    }

    await EntitlementLedger.create({
      userUid,
      episodeId: null,
      sourceType: 'ADMIN_ADJUST',
      sourceId: 'WALLET',
      actionType: 'OTHER',
      amount: credits,
      note: `Admin granted ${credits} credits (${packType})`,
      ip: req.ip,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('admin grant pack failed:', e);
    return res.status(500).json({ error: 'Failed to grant pack' });
  }
});

export default router;
