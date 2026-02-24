/**
 * Backend route: subscriptions
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the subscriptions feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';

import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';

import { InjuryEpisode } from '../models/InjuryEpisode.js';
import { EpisodePlan } from '../models/EpisodePlan.js';
import { UserTrial } from '../models/UserTrial.js';
import { EntitlementWallet } from '../models/EntitlementWallet.js';
import { EntitlementLedger } from '../models/EntitlementLedger.js';
import { getMostRecentOpenEpisode } from '../lib/subscriptions/episodes.js';

import {
  PLAN_CATALOG,
  TRIAL_FREE_THREEDAYS,
  TRIAL_CODE,
} from '../lib/subscriptions/catalog.js';
import { computeTrialWindow, getEntitlementContext } from '../lib/subscriptions/engine.js';
import { isSubscriptionsEnforced } from '../lib/subscriptions/enforce.js';
import { trialActivationLimiter, purchasePlanLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Public: plan metadata for UI display (prices are intentionally omitted here)
router.get('/plans', (_req, res) => {
  res.json({
    trial: TRIAL_FREE_THREEDAYS,
    plans: Object.values(PLAN_CATALOG),
  });
});

// User: fetch entitlement snapshot for the current episode.
router.get('/me', requireFirebaseAuth, requireRole('user'), async (req, res) => {
  try {
    const userUid = req.user.uid;
    const requestedEpisodeId = req.query.episodeId ? String(req.query.episodeId) : null;
    const trial = await UserTrial.findOne({ userUid }).lean();
    const wallet = await EntitlementWallet.findOne({ userUid }).lean();

    // Defaulting behavior (additive):
    // If the client doesn't pass episodeId, we pick the most recent open episode.
    // If none exists, we fall back to the active trial episode (if any).
    let episodeId = requestedEpisodeId;
    let episode = null;

    // 🔒 Validate requested episode ownership
    if (episodeId) {
      const owned = await InjuryEpisode.findOne({ _id: episodeId, userUid }).lean();
      if (!owned) {
        episodeId = null;
        episode = null;
      } else {
        episode = owned;
      }
    }

    if (!episodeId) {
      episode = await getMostRecentOpenEpisode(userUid);
      if (episode?._id) episodeId = String(episode._id);
    }
    if (!episodeId && trial?.status === 'active' && trial?.episodeId) {
      episodeId = String(trial.episodeId);
    }

    const snapshot = await getEntitlementContext({ userUid, episodeId });

    res.json({
      enforcementEnabled: isSubscriptionsEnforced(),
      episodeId,
      episode: episode ? { id: episode._id, title: episode.title, status: episode.status, createdAt: episode.createdAt } : null,
      snapshot,
      wallet: wallet
        ? {
            packs: (wallet.packs || []).map((p) => ({
              id: String(p._id),
              packType: p.packType,
              totalCredits: p.totalCredits,
              remainingCredits: p.remainingCredits,
              purchasedAt: p.purchasedAt,
              expiresAt: p.expiresAt,
              meta: p.meta || {},
            })),
          }
        : null,
      trial: trial
        ? {
            status: trial.status,
            trialStartAt: trial.trialStartAt,
            trialEndAt: trial.trialEndAt,
            nextEligibleAt: trial.nextEligibleAt,
            episodeId: trial.episodeId,
          }
        : null,
    });
  } catch (e) {
    console.error('subscriptions/me failed:', e);
    res.status(500).json({ error: 'Failed to load subscription state' });
  }
});

// User: activate FREE_ThreeDays (72h) trial.
router.post('/trial/activate', requireFirebaseAuth, requireRole('user'), trialActivationLimiter, async (req, res) => {
  try {
    const userUid = req.user.uid;
    const now = new Date();

    // Verified user requirement: email_verified claim from Firebase.
    const emailVerified = Boolean(req.user?.claims?.email_verified);
    if (!emailVerified) {
      return res.status(403).json({
        error: 'Email not verified. Please verify your email before activating the free trial.',
      });
    }

    // NO-SWITCHING (global per user): trial cannot be activated while any paid plan is active.
    // Also expire any ended subscriptions to keep state consistent.
    await EpisodePlan.updateMany(
      { userUid, status: 'active', endAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );
    await UserTrial.updateMany(
      { userUid, status: 'active', trialEndAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );

    const activePlan = await EpisodePlan.findOne({ userUid, status: 'active', endAt: { $gt: now } }).lean();
    if (activePlan) {
      return res.status(409).json({
        error: 'You already have an active plan. Please wait for it to end before activating the free trial.',
        activePlan: {
          id: String(activePlan._id),
          planCode: activePlan.planCode,
          episodeId: String(activePlan.episodeId),
          endAt: activePlan.endAt,
        },
      });
    }

    // Note: Trial can run alongside paid plans, but it only applies to its Trial Episode.
    // (This matches your precedence rules: EpisodePlan overrides Trial per-episode.)

    const existing = await UserTrial.findOne({ userUid });
    if (existing?.status === 'active' && existing?.trialEndAt && new Date(existing.trialEndAt) > now) {
      return res.status(200).json({
        ok: true,
        message: 'Trial already active',
        trial: {
          status: existing.status,
          trialStartAt: existing.trialStartAt,
          trialEndAt: existing.trialEndAt,
          nextEligibleAt: existing.nextEligibleAt,
          episodeId: existing.episodeId,
        },
      });
    }

    if (existing?.nextEligibleAt && new Date(existing.nextEligibleAt) > now) {
      return res.status(400).json({
        error: 'Trial cooldown active. Please try again after your next eligible date.',
        nextEligibleAt: existing.nextEligibleAt,
      });
    }

    // Create a fresh trial episode.
    const episode = await InjuryEpisode.create({
      userUid,
      title: 'Trial Episode',
      status: 'open',
    });

    const window = computeTrialWindow({
      now,
      durationHours: TRIAL_FREE_THREEDAYS.durationHours,
      cooldownDays: TRIAL_FREE_THREEDAYS.cooldownDays,
    });

    const trialPayload = {
      status: 'active',
      trialStartAt: window.trialStartAt,
      trialEndAt: window.trialEndAt,
      nextEligibleAt: window.nextEligibleAt,
      episodeId: episode._id,
      code: TRIAL_CODE,
      entitlements: { ...TRIAL_FREE_THREEDAYS.entitlements },
      usage: {
        scansUsed: 0,
        pdfUsed: 0,
        shareLinksUsed: 0,
        comparesUsed: 0,
        scanContextChatUsed: 0,
        generalChatUsed: 0,
        reportsCounted: 0,
        recordsCounted: 0,
        activeMedsCounted: 0,
        checkinsUsed: 0,
      },
      activatedBy: 'user',
      activatedFromIp: req.ip || '',
    };

    const upserted = await UserTrial.findOneAndUpdate(
      { userUid },
      { $set: trialPayload },
      { upsert: true, new: true }
    ).lean();

    await EntitlementLedger.create({
      userUid,
      episodeId: episode._id,
      sourceType: 'TRIAL',
      sourceId: String(upserted?._id || ''),
      actionType: 'OTHER',
      amount: 0,
      note: 'Trial activated',
      ip: req.ip || '',
    });

    return res.json({
      ok: true,
      episode: {
        id: episode._id,
        title: episode.title,
        status: episode.status,
        createdAt: episode.createdAt,
      },
      trial: {
        status: upserted.status,
        trialStartAt: upserted.trialStartAt,
        trialEndAt: upserted.trialEndAt,
        nextEligibleAt: upserted.nextEligibleAt,
        episodeId: upserted.episodeId,
      },
    });
  } catch (e) {
    console.error('trial activation failed:', e);
    res.status(500).json({ error: 'Failed to activate trial' });
  }
});

// User: "purchase" an episode plan.
// NOTE: This endpoint assumes payment succeeded upstream. For now it simply
// records the plan and activates entitlements.
router.post('/episode/plan', requireFirebaseAuth, requireRole('user'), purchasePlanLimiter, async (req, res) => {
  try {
    const userUid = req.user.uid;
    const planCode = String(req.body?.planCode || '').trim();
    const plan = PLAN_CATALOG[planCode];
    if (!plan) return res.status(400).json({ error: 'Invalid planCode' });

    const now = new Date();

    // Keep state consistent: expire any ended plans/trials first.
    await EpisodePlan.updateMany(
      { userUid, status: 'active', endAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );
    await UserTrial.updateMany(
      { userUid, status: 'active', trialEndAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );

    // NO-SWITCHING (global per user): only ONE active plan OR trial at a time.
    // If anything is active, block purchase.
    const activePlans = await EpisodePlan.find({ userUid, status: 'active', endAt: { $gt: now } })
      .sort({ endAt: -1, startAt: -1 })
      .lean();

    // Defensive cleanup (in case previous builds allowed multiple active plans):
    // keep the newest, archive the rest.
    if (activePlans.length > 1) {
      const keep = activePlans[0];
      const otherIds = activePlans.slice(1).map((p) => p._id);
      await EpisodePlan.updateMany(
        { _id: { $in: otherIds } },
        { $set: { status: 'archived', adminNote: 'Auto-archived (multiple active plans detected)' } }
      );
      // After cleanup, treat as active.
      return res.status(409).json({
        error: 'You already have an active plan. Please wait for it to end before activating a new plan.',
        activePlan: {
          id: String(keep._id),
          planCode: keep.planCode,
          episodeId: String(keep.episodeId),
          endAt: keep.endAt,
        },
      });
    }

    if (activePlans.length === 1) {
      const p = activePlans[0];
      return res.status(409).json({
        error: 'You already have an active plan. Please wait for it to end before activating a new plan.',
        activePlan: {
          id: String(p._id),
          planCode: p.planCode,
          episodeId: String(p.episodeId),
          endAt: p.endAt,
        },
      });
    }

    const activeTrial = await UserTrial.findOne({ userUid, status: 'active', trialEndAt: { $gt: now } }).lean();
    if (activeTrial) {
      return res.status(409).json({
        error: 'You already have an active free trial. Please wait for it to end before activating a paid plan.',
        activeTrial: {
          id: String(activeTrial._id),
          episodeId: String(activeTrial.episodeId),
          trialEndAt: activeTrial.trialEndAt,
        },
      });
    }

    // Resolve episode (most recent open by default)
    const episodeIdRaw = req.body?.episodeId ? String(req.body.episodeId) : '';
    let episode = null;
    if (episodeIdRaw) {
      if (!mongoose.Types.ObjectId.isValid(episodeIdRaw)) {
        return res.status(400).json({ error: 'Invalid episodeId' });
      }
      episode = await InjuryEpisode.findOne({ _id: episodeIdRaw, userUid }).lean();
      if (!episode) return res.status(404).json({ error: 'Episode not found' });
    } else {
      episode = await getMostRecentOpenEpisode(userUid);
      if (!episode) {
        episode = await InjuryEpisode.create({ userUid, title: 'Injury Episode', status: 'open' });
      }
    }

    const startAt = now;
    const endAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const created = await EpisodePlan.create({
      userUid,
      episodeId: episode._id,
      planCode: plan.code,
      status: 'active',
      startAt,
      endAt,
      entitlements: plan.entitlements,
      billing: {
        currency: typeof req.body?.currency === 'string' ? req.body.currency : 'BDT',
        amount: Number(req.body?.amount || 0) || 0,
        provider: typeof req.body?.provider === 'string' ? req.body.provider : 'manual',
        providerRef: typeof req.body?.providerRef === 'string' ? req.body.providerRef : '',
        purchasedAt: now,
      },
    });

    await EntitlementLedger.create({
      userUid,
      episodeId: episode._id,
      sourceType: 'PLAN',
      sourceId: String(created._id),
      actionType: 'OTHER',
      amount: 0,
      note: `Plan purchased: ${plan.code}`,
      ip: req.ip || '',
    });

    return res.json({ ok: true, episodeId: String(episode._id), planId: String(created._id) });
  } catch (e) {
    console.error('purchase plan failed:', e);
    return res.status(500).json({ error: 'Failed to purchase plan' });
  }
});

export default router;
