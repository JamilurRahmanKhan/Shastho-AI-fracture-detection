/**
 * Backend library: engine
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import { DateTime } from 'luxon';

import { EpisodePlan } from '../../models/EpisodePlan.js';
import { UserTrial } from '../../models/UserTrial.js';
import { EntitlementWallet } from '../../models/EntitlementWallet.js';
import { FREE_BASE } from './catalog.js';

/**
 * Subscription entitlement engine
 *
 * Deterministic precedence:
 * 1) Active paid EpisodePlan (for the episode)
 * 2) Active FREE_ThreeDays trial (only if episodeId matches trial episode)
 * 3) Global packs (e.g., scan packs)
 * 4) FREE_BASE
 */

// NOTE:
// Only some entitlement fields support the "0 = unlimited" convention.
// For most numeric limits (scanCredits, pdfExports, etc.), 0 means "none".
// Today we only treat activeMedsCap as unlimited when it is 0.
const UNLIMITED_FIELDS = new Set(['activeMedsCap']);

function isUnlimited(field, value) {
  return UNLIMITED_FIELDS.has(String(field)) && Number(value) === 0;
}

function remaining(field, limit, used) {
  if (isUnlimited(field, limit)) return null;
  return Math.max(0, Number(limit || 0) - Number(used || 0));
}

function buildSnapshot({ sourceType, sourceId, code, startAt, endAt, entitlements, usage }) {
  const e = entitlements || {};
  const u = usage || {};
  return {
    sourceType,
    sourceId,
    code,
    startAt,
    endAt,
    entitlements: {
      ...e,
      // derived convenience fields
      remaining: {
        scanCredits: remaining('scanCredits', e.scanCredits, u.scansUsed),
        pdfExports: remaining('pdfExports', e.pdfExports, u.pdfUsed),
        shareLinks: remaining('shareLinks', e.shareLinks, u.shareLinksUsed),
        compareActions: remaining('compareActions', e.compareActions, u.comparesUsed),
        scanContextChat: remaining('scanContextChat', e.scanContextChat, u.scanContextChatUsed),
        generalChat: remaining('generalChat', e.generalChat, u.generalChatUsed),
        recordsCap: remaining('recordsCap', e.recordsCap, u.recordsCounted),
        reportsCap: remaining('reportsCap', e.reportsCap, u.reportsCounted),
        activeMedsCap: remaining('activeMedsCap', e.activeMedsCap, u.activeMedsCounted),
        checkinsCap: remaining('checkinsCap', e.checkinsCap, u.checkinsUsed),
      },
      unlimited: {
        activeMeds: isUnlimited('activeMedsCap', e.activeMedsCap),
      },
    },
    usage: { ...u },
  };
}

async function getActivePaidPlan({ userUid, episodeId, now }) {
  if (!episodeId) return null;
  return EpisodePlan.findOne({
    userUid,
    episodeId,
    status: 'active',
    endAt: { $gt: now },
  }).lean();
}

async function getActiveTrial({ userUid, episodeId, now }) {
  const trial = await UserTrial.findOne({ userUid, status: 'active', trialEndAt: { $gt: now } }).lean();
  if (!trial) return null;
  if (!trial.episodeId) return null;
  if (!episodeId) return null;
  // Only applies to its trial episode
  if (String(trial.episodeId) !== String(episodeId)) return null;
  return trial;
}

function pickPackForConsumption(wallet, now, packType) {
  const packs = Array.isArray(wallet?.packs) ? wallet.packs : [];
  const eligible = packs
    .filter((p) => {
      if (!p) return false;
      if (p.packType !== packType) return false;
      if (Number(p.remainingCredits || 0) <= 0) return false;
      if (p.expiresAt && new Date(p.expiresAt) <= now) return false;
      return true;
    })
    .sort((a, b) => {
      const ta = new Date(a.purchasedAt || 0).getTime();
      const tb = new Date(b.purchasedAt || 0).getTime();
      return ta - tb;
    });
  return eligible[0] || null;
}

function pickBestPack(wallet, now) {
  // Prefer scan packs for the main UI banner; if none, fall back to PDF pack.
  return (
    pickPackForConsumption(wallet, now, 'SCAN_PACK') ||
    pickPackForConsumption(wallet, now, 'PDF_PACK')
  );
}

/**
 * Returns the current entitlement snapshot for an episode.
 * If episodeId is omitted, we return global state (trial + packs + free base).
 */
export async function getEntitlementContext({ userUid, episodeId, now = new Date() }) {
  const paid = await getActivePaidPlan({ userUid, episodeId, now });
  if (paid) {
    return buildSnapshot({
      sourceType: 'PLAN',
      sourceId: String(paid._id),
      code: paid.planCode,
      startAt: paid.startAt,
      endAt: paid.endAt,
      entitlements: paid.entitlements,
      usage: paid.usage,
    });
  }

  const trial = await getActiveTrial({ userUid, episodeId, now });
  if (trial) {
    return buildSnapshot({
      sourceType: 'TRIAL',
      sourceId: String(trial._id),
      code: trial.code || 'FREE_THREEDAYS',
      startAt: trial.trialStartAt,
      endAt: trial.trialEndAt,
      entitlements: trial.entitlements,
      usage: trial.usage,
    });
  }

  const wallet = await EntitlementWallet.findOne({ userUid }).lean();
  const pack = pickBestPack(wallet, now);
  if (pack) {
    // Packs are global; in this first iteration we expose scan credits only.
    return buildSnapshot({
      sourceType: 'PACK',
      sourceId: String(pack._id),
      code: pack.packType,
      startAt: pack.purchasedAt,
      endAt: pack.expiresAt || null,
      entitlements: {
        scanCredits: pack.packType === 'SCAN_PACK' ? Number(pack.remainingCredits || 0) : 0,
        pdfExports: pack.packType === 'PDF_PACK' ? Number(pack.remainingCredits || 0) : 0,
        shareLinks: 0,
        compareActions: 0,
        scanContextChat: 0,
        generalChat: 0,
        reportsCap: 0,
        recordsCap: 0,
        activeMedsCap: 0,
        checkinsCap: 0,
      },
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
    });
  }

  // FREE_BASE fallback
  return buildSnapshot({
    sourceType: 'FREE_BASE',
    sourceId: 'FREE_BASE',
    code: FREE_BASE.code,
    startAt: null,
    endAt: null,
    entitlements: FREE_BASE.entitlements,
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
  });
}

export function computeTrialWindow({ now = new Date(), durationHours = 72, cooldownDays = 90 }) {
  const start = DateTime.fromJSDate(now);
  const end = start.plus({ hours: durationHours });
  const next = end.plus({ days: cooldownDays });
  return {
    trialStartAt: start.toJSDate(),
    trialEndAt: end.toJSDate(),
    nextEligibleAt: next.toJSDate(),
  };
}
