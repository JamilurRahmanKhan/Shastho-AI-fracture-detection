/**
 * Backend library: enforce
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import { EpisodePlan } from '../../models/EpisodePlan.js';
import { UserTrial } from '../../models/UserTrial.js';
import { EntitlementWallet } from '../../models/EntitlementWallet.js';
import { EntitlementLedger } from '../../models/EntitlementLedger.js';
import { FreeBaseChatUsage } from '../../models/FreeBaseChatUsage.js';
import { FREE_BASE } from './catalog.js';

// ActionType values used across the subscription system.
// Keep in sync with EntitlementLedger.actionType enum.
export const ACTIONS = {
  SCAN: 'SCAN',
  PDF_EXPORT: 'PDF_EXPORT',
  SHARE_LINK: 'SHARE_LINK',
  COMPARE: 'COMPARE',
  CHAT_SCAN_CONTEXT: 'CHAT_SCAN_CONTEXT',
  CHAT_GENERAL: 'CHAT_GENERAL',
  RECORD_UPLOAD: 'RECORD_UPLOAD',
  MED_ADD: 'MED_ADD',
  CHECKIN: 'CHECKIN',
};

// export function isSubscriptionsEnforced() {
//   const v = String(process.env.SUBSCRIPTIONS_ENFORCE || '').trim().toLowerCase();
//   return v === '1' || v === 'true' || v === 'yes';
// }

export function isSubscriptionsEnforced() {
  // Default to ON so plan/trial limits behave as advertised.
  // You can explicitly disable by setting SUBSCRIPTIONS_ENFORCE=0/false/no in the server environment.
  const v = String(process.env.SUBSCRIPTIONS_ENFORCE || '').trim().toLowerCase();
  if (!v) return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function isoWeekKey(now) {
  // ISO week calculation (UTC) without external dependencies.
  // Ref: https://en.wikipedia.org/wiki/ISO_week_date#Algorithms
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // nearest Thursday
  const weekYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const week = String(weekNo).padStart(2, '0');
  return `${weekYear}-W${week}`;
}

async function writeLedgerSafe(entry) {
  try {
    await EntitlementLedger.create(entry);
  } catch (e) {
    // Ledger must never break core flows.
    console.warn('EntitlementLedger write failed:', e?.message || e);
  }
}

function pickScanPack(wallet, now) {
  const packs = Array.isArray(wallet?.packs) ? wallet.packs : [];
  const eligible = packs
    .filter((p) => {
      if (!p) return false;
      if (p.packType !== 'SCAN_PACK') return false;
      if (Number(p.remainingCredits || 0) <= 0) return false;
      if (p.expiresAt && new Date(p.expiresAt) <= now) return false;
      return true;
    })
    .sort((a, b) => new Date(a.purchasedAt || 0).getTime() - new Date(b.purchasedAt || 0).getTime());
  return eligible[0] || null;
}

function pickPdfPack(wallet, now) {
  const packs = Array.isArray(wallet?.packs) ? wallet.packs : [];
  const eligible = packs
    .filter((p) => {
      if (!p) return false;
      if (p.packType !== 'PDF_PACK') return false;
      if (Number(p.remainingCredits || 0) <= 0) return false;
      if (p.expiresAt && new Date(p.expiresAt) <= now) return false;
      return true;
    })
    .sort((a, b) => new Date(a.purchasedAt || 0).getTime() - new Date(b.purchasedAt || 0).getTime());
  return eligible[0] || null;
}

async function getActiveEpisodePlan(userUid, episodeId, now) {
  if (!episodeId) return null;
  return EpisodePlan.findOne({ userUid, episodeId, status: 'active', endAt: { $gt: now } }).lean();
}

async function getActiveTrialForEpisode(userUid, episodeId, now) {
  if (!episodeId) return null;
  const trial = await UserTrial.findOne({ userUid, status: 'active', trialEndAt: { $gt: now } }).lean();
  if (!trial?.episodeId) return null;
  if (String(trial.episodeId) !== String(episodeId)) return null;
  return trial;
}

async function consumePlanUsage({ planId, now, field, limit, amount, session = null }) {
  if (!Number.isFinite(Number(limit)) || Number(limit) <= 0) return null;
  const q = {
    _id: planId,
    status: 'active',
    endAt: { $gt: now },
    [`usage.${field}`]: { $lte: Number(limit) - Number(amount) },
  };
  const up = { $inc: { [`usage.${field}`]: Number(amount) } };
  return EpisodePlan.findOneAndUpdate(q, up, { new: true, ...(session ? { session } : {}) }).lean();
}

async function consumeTrialUsage({ trialId, now, field, limit, amount, session = null }) {
  if (!Number.isFinite(Number(limit)) || Number(limit) <= 0) return null;
  const q = {
    _id: trialId,
    status: 'active',
    trialEndAt: { $gt: now },
    [`usage.${field}`]: { $lte: Number(limit) - Number(amount) },
  };
  const up = { $inc: { [`usage.${field}`]: Number(amount) } };
  return UserTrial.findOneAndUpdate(q, up, { new: true, ...(session ? { session } : {}) }).lean();
}

async function consumeScanPack({ userUid, now, amount, session = null }) {
  const wallet = await EntitlementWallet.findOne({ userUid }, null, session ? { session } : undefined).lean();
  const pack = pickScanPack(wallet, now);
  if (!pack) return null;

  const updated = await EntitlementWallet.findOneAndUpdate(
    {
      userUid,
      'packs._id': pack._id,
      'packs.remainingCredits': { $gte: Number(amount) },
    },
    {
      $inc: { 'packs.$.remainingCredits': -Number(amount) },
    },
    { new: true, ...(session ? { session } : {}) }
  ).lean();

  if (!updated) return null;
  return { wallet: updated, packId: String(pack._id) };
}

async function consumePdfPack({ userUid, now, amount, session = null }) {
  const wallet = await EntitlementWallet.findOne({ userUid }, null, session ? { session } : undefined).lean();
  const pack = pickPdfPack(wallet, now);
  if (!pack) return null;

  const updated = await EntitlementWallet.findOneAndUpdate(
    {
      userUid,
      'packs._id': pack._id,
      'packs.remainingCredits': { $gte: Number(amount) },
    },
    {
      $inc: { 'packs.$.remainingCredits': -Number(amount) },
    },
    { new: true, ...(session ? { session } : {}) }
  ).lean();

  if (!updated) return null;
  return { wallet: updated, packId: String(pack._id) };
}

export function makePaywallPayload({ actionType, message, episodeId, sourceHint }) {
  return {
    error: message,
    code: 'PAYWALL',
    actionType,
    episodeId: episodeId || null,
    sourceHint: sourceHint || null,
  };
}

/**
 * consumeScan
 *
 * Enforces and consumes one scan credit according to precedence:
 * - Episode plan credits
 * - Trial credits (only if trial applies to episode)
 * - Scan pack credits
 */
export async function consumeScan({ userUid, episodeId, ip = '', now = new Date(), note = '', xrayCaseId = null }) {
  const plan = await getActiveEpisodePlan(userUid, episodeId, now);
  if (plan) {
    const consumed = await consumePlanUsage({
      planId: plan._id,
      now,
      field: 'scansUsed',
      limit: plan.entitlements?.scanCredits ?? 0,
      amount: 1,
    });
    if (consumed) {
      await writeLedgerSafe({
        userUid,
        episodeId,
        sourceType: 'PLAN',
        sourceId: String(consumed._id),
        actionType: ACTIONS.SCAN,
        amount: 1,
        note: note || 'Scan consumed from episode plan',
        ip,
        xrayCaseId,
      });
      return { sourceType: 'PLAN', sourceId: String(consumed._id), code: consumed.planCode };
    }

    // Plan active but no scan credits left — try pack credits (explicitly allowed).
    const packConsumed = await consumeScanPack({ userUid, now, amount: 1 });
    if (packConsumed) {
      await writeLedgerSafe({
        userUid,
        episodeId,
        sourceType: 'PACK',
        sourceId: packConsumed.packId,
        actionType: ACTIONS.SCAN,
        amount: 1,
        note: note || 'Scan consumed from scan pack (plan out of credits)',
        ip,
        xrayCaseId,
      });
      return { sourceType: 'PACK', sourceId: packConsumed.packId, code: 'SCAN_PACK' };
    }
    return null;
  }

  const trial = await getActiveTrialForEpisode(userUid, episodeId, now);
  if (trial) {
    const consumed = await consumeTrialUsage({
      trialId: trial._id,
      now,
      field: 'scansUsed',
      limit: trial.entitlements?.scanCredits ?? 0,
      amount: 1,
    });
    if (consumed) {
      await writeLedgerSafe({
        userUid,
        episodeId,
        sourceType: 'TRIAL',
        sourceId: String(consumed._id),
        actionType: ACTIONS.SCAN,
        amount: 1,
        note: note || 'Scan consumed from trial',
        ip,
        xrayCaseId,
      });
      return { sourceType: 'TRIAL', sourceId: String(consumed._id), code: consumed.code || 'FREE_THREEDAYS' };
    }
  }

  const packConsumed = await consumeScanPack({ userUid, now, amount: 1 });
  if (packConsumed) {
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'PACK',
      sourceId: packConsumed.packId,
      actionType: ACTIONS.SCAN,
      amount: 1,
      note: note || 'Scan consumed from scan pack',
      ip,
      xrayCaseId,
    });
    return { sourceType: 'PACK', sourceId: packConsumed.packId, code: 'SCAN_PACK' };
  }

  return null;
}

/**
 * consumeScanContextChat
 *
 * Enforces and consumes one scan-context chat message according to precedence:
 * - Episode plan quota
 * - Trial quota (only if trial applies)
 * Packs do not apply.
 */
export async function consumeScanContextChat({ userUid, episodeId, ip = '', now = new Date(), note = '', chatSessionId = null, xrayCaseId = null }) {
  const plan = await getActiveEpisodePlan(userUid, episodeId, now);
  if (plan) {
    const consumed = await consumePlanUsage({
      planId: plan._id,
      now,
      field: 'scanContextChatUsed',
      limit: plan.entitlements?.scanContextChat ?? 0,
      amount: 1,
    });
    if (!consumed) return null;
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'PLAN',
      sourceId: String(consumed._id),
      actionType: ACTIONS.CHAT_SCAN_CONTEXT,
      amount: 1,
      note: note || 'Scan-context chat consumed from episode plan',
      ip,
      chatSessionId,
      xrayCaseId,
    });
    return { sourceType: 'PLAN', sourceId: String(consumed._id), code: consumed.planCode };
  }

  const trial = await getActiveTrialForEpisode(userUid, episodeId, now);
  if (trial) {
    const consumed = await consumeTrialUsage({
      trialId: trial._id,
      now,
      field: 'scanContextChatUsed',
      limit: trial.entitlements?.scanContextChat ?? 0,
      amount: 1,
    });
    if (!consumed) return null;
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'TRIAL',
      sourceId: String(consumed._id),
      actionType: ACTIONS.CHAT_SCAN_CONTEXT,
      amount: 1,
      note: note || 'Scan-context chat consumed from trial',
      ip,
      chatSessionId,
      xrayCaseId,
    });
    return { sourceType: 'TRIAL', sourceId: String(consumed._id), code: consumed.code || 'FREE_THREEDAYS' };
  }

  return null;
}

async function pickBestActivePlanForGlobalQuota(userUid, now, fieldName) {
  const plans = await EpisodePlan.find({ userUid, status: 'active', endAt: { $gt: now } }).lean();
  if (!plans.length) return null;
  const sorted = plans
    .filter((p) => Number(p?.entitlements?.[fieldName] ?? 0) > 0)
    .sort((a, b) => {
      const av = Number(a?.entitlements?.[fieldName] ?? 0);
      const bv = Number(b?.entitlements?.[fieldName] ?? 0);
      if (bv !== av) return bv - av;
      return new Date(b.endAt || 0).getTime() - new Date(a.endAt || 0).getTime();
    });
  return sorted[0] || null;
}

async function pickActiveTrialForGlobalQuota(userUid, now) {
  return UserTrial.findOne({ userUid, status: 'active', trialEndAt: { $gt: now } }).lean();
}

/**
 * consumeGeneralChat
 *
 * Global general chat usage (not tied to a report).
 * Priority:
 * - Best active paid plan generalChat quota
 * - Active trial generalChat quota
 * - FREE_BASE weekly quota
 */
export async function consumeGeneralChat({ userUid, ip = '', now = new Date(), note = '', chatSessionId = null }) {
  const plan = await pickBestActivePlanForGlobalQuota(userUid, now, 'generalChat');
  if (plan) {
    const consumed = await consumePlanUsage({
      planId: plan._id,
      now,
      field: 'generalChatUsed',
      limit: plan.entitlements?.generalChat ?? 0,
      amount: 1,
    });
    if (consumed) {
      await writeLedgerSafe({
        userUid,
        episodeId: plan.episodeId,
        sourceType: 'PLAN',
        sourceId: String(consumed._id),
        actionType: ACTIONS.CHAT_GENERAL,
        amount: 1,
        note: note || 'General chat consumed from episode plan',
        ip,
        chatSessionId,
      });
      return { sourceType: 'PLAN', sourceId: String(consumed._id), code: consumed.planCode };
    }
  }

  const trial = await pickActiveTrialForGlobalQuota(userUid, now);
  if (trial && Number(trial?.entitlements?.generalChat ?? 0) > 0) {
    const consumed = await consumeTrialUsage({
      trialId: trial._id,
      now,
      field: 'generalChatUsed',
      limit: trial.entitlements?.generalChat ?? 0,
      amount: 1,
    });
    if (consumed) {
      await writeLedgerSafe({
        userUid,
        episodeId: trial.episodeId,
        sourceType: 'TRIAL',
        sourceId: String(consumed._id),
        actionType: ACTIONS.CHAT_GENERAL,
        amount: 1,
        note: note || 'General chat consumed from trial',
        ip,
        chatSessionId,
      });
      return { sourceType: 'TRIAL', sourceId: String(consumed._id), code: consumed.code || 'FREE_THREEDAYS' };
    }
  }

  // FREE_BASE weekly quota
  const limit = Number(FREE_BASE?.entitlements?.generalChat ?? 0);
  if (limit <= 0) return null;
  const weekKey = isoWeekKey(now);
  const consumed = await FreeBaseChatUsage.findOneAndUpdate(
    { userUid, weekKey, generalChatUsed: { $lte: limit - 1 } },
    { $inc: { generalChatUsed: 1 }, $setOnInsert: { userUid, weekKey } },
    { new: true, upsert: true }
  ).lean();
  if (!consumed) return null;

  await writeLedgerSafe({
    userUid,
    sourceType: 'FREE_BASE',
    sourceId: weekKey,
    actionType: ACTIONS.CHAT_GENERAL,
    amount: 1,
    note: note || 'General chat consumed from FREE_BASE weekly quota',
    ip,
    chatSessionId,
  });
  return { sourceType: 'FREE_BASE', sourceId: weekKey, code: 'FREE_BASE' };
}


/**
 * consumePdfExport
 * Episode-scoped PDF export credits. Priority: episode plan -> trial.
 */
export async function consumePdfExport({ userUid, episodeId, ip = '', now = new Date(), note = '', xrayCaseId = null, xrayCreatedAt = null, session = null }) {
  const plan = await getActiveEpisodePlan(userUid, episodeId, now);
  if (plan) {
    const consumed = await consumePlanUsage({
      planId: plan._id,
      now,
      field: 'pdfExportsUsed',
      limit: plan.entitlements?.pdfExports ?? 0,
      amount: 1,
      session,
    });
    if (consumed) {
      await writeLedgerSafe({
        userUid,
        episodeId,
        sourceType: 'PLAN',
        sourceId: String(consumed._id),
        actionType: ACTIONS.PDF_EXPORT,
        amount: 1,
        note: note || 'PDF export consumed from episode plan',
        ip,
        xrayCaseId,
      });
      return { sourceType: 'PLAN', sourceId: String(consumed._id), code: consumed.planCode };
    }

    // Plan active but out of PDF credits — allow using a PDF pack if available.
    const packConsumed = await consumePdfPack({ userUid, now, amount: 1, session });
    if (packConsumed) {
      await writeLedgerSafe({
        userUid,
        episodeId,
        sourceType: 'PACK',
        sourceId: packConsumed.packId,
        actionType: ACTIONS.PDF_EXPORT,
        amount: 1,
        note: note || 'PDF export consumed from PDF pack (plan out of credits)',
        ip,
        xrayCaseId,
      });
      return { sourceType: 'PACK', sourceId: packConsumed.packId, code: 'PDF_PACK' };
    }
    return null;
  }

  const trial = await getActiveTrialForEpisode(userUid, episodeId, now);
  if (trial) {
    // Trial credits can only be used for reports created during the active trial window.
    if (xrayCreatedAt) {
      const created = new Date(xrayCreatedAt);
      const start = new Date(trial.trialStartAt);
      const end = new Date(trial.trialEndAt);
      const within = created >= start && created <= end;
      if (!within) {
        // Skip trial usage and allow fallback to PDF pack.
        const packConsumed = await consumePdfPack({ userUid, now, amount: 1, session });
        if (packConsumed) {
          await writeLedgerSafe({
            userUid,
            episodeId,
            sourceType: 'PACK',
            sourceId: packConsumed.packId,
            actionType: ACTIONS.PDF_EXPORT,
            amount: 1,
            note: note || 'PDF export consumed from PDF pack (trial not eligible for this report)',
            ip,
            xrayCaseId,
          });
          return { sourceType: 'PACK', sourceId: packConsumed.packId, code: 'PDF_PACK' };
        }
        return null;
      }
    }

    const consumed = await consumeTrialUsage({
      trialId: trial._id,
      now,
      field: 'pdfExportsUsed',
      limit: trial.entitlements?.pdfExports ?? 0,
      amount: 1,
      session,
    });
    if (!consumed) {
      // Trial out of credits — allow PDF pack.
      const packConsumed = await consumePdfPack({ userUid, now, amount: 1, session });
      if (packConsumed) {
        await writeLedgerSafe({
          userUid,
          episodeId,
          sourceType: 'PACK',
          sourceId: packConsumed.packId,
          actionType: ACTIONS.PDF_EXPORT,
          amount: 1,
          note: note || 'PDF export consumed from PDF pack (trial out of credits)',
          ip,
          xrayCaseId,
        });
        return { sourceType: 'PACK', sourceId: packConsumed.packId, code: 'PDF_PACK' };
      }
      return null;
    }
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'TRIAL',
      sourceId: String(consumed._id),
      actionType: ACTIONS.PDF_EXPORT,
      amount: 1,
      note: note || 'PDF export consumed from trial',
      ip,
      xrayCaseId,
    });
    return { sourceType: 'TRIAL', sourceId: String(consumed._id), code: consumed.code || 'FREE_THREEDAYS' };
  }

  // No plan/trial — fall back to PDF pack if available.
  const packConsumed = await consumePdfPack({ userUid, now, amount: 1, session });
  if (packConsumed) {
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'PACK',
      sourceId: packConsumed.packId,
      actionType: ACTIONS.PDF_EXPORT,
      amount: 1,
      note: note || 'PDF export consumed from PDF pack',
      ip,
      xrayCaseId,
    });
    return { sourceType: 'PACK', sourceId: packConsumed.packId, code: 'PDF_PACK' };
  }

  return null;
}

/**
 * consumeShareLink
 * Episode-scoped share link credits. Priority: episode plan -> trial.
 */
export async function consumeShareLink({ userUid, episodeId, ip = '', now = new Date(), note = '', xrayCaseId = null, xrayCreatedAt = null, session = null }) {
  const plan = await getActiveEpisodePlan(userUid, episodeId, now);
  if (plan) {
    const consumed = await consumePlanUsage({
      planId: plan._id,
      now,
      field: 'shareLinksUsed',
      limit: plan.entitlements?.shareLinks ?? 0,
      amount: 1,
      session,
    });
    if (!consumed) return null;
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'PLAN',
      sourceId: String(consumed._id),
      actionType: ACTIONS.SHARE_LINK,
      amount: 1,
      note: note || 'Share link consumed from episode plan',
      ip,
      xrayCaseId,
    });
    return { sourceType: 'PLAN', sourceId: String(consumed._id), code: consumed.planCode };
  }

  const trial = await getActiveTrialForEpisode(userUid, episodeId, now);
  if (trial) {
    // Trial share links are restricted to reports created during the active trial window.
    if (xrayCreatedAt) {
      const created = new Date(xrayCreatedAt);
      const start = new Date(trial.trialStartAt);
      const end = new Date(trial.trialEndAt);
      const within = created >= start && created <= end;
      if (!within) return null;
    }
    const consumed = await consumeTrialUsage({
      trialId: trial._id,
      now,
      field: 'shareLinksUsed',
      limit: trial.entitlements?.shareLinks ?? 0,
      amount: 1,
      session,
    });
    if (!consumed) return null;
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'TRIAL',
      sourceId: String(consumed._id),
      actionType: ACTIONS.SHARE_LINK,
      amount: 1,
      note: note || 'Share link consumed from trial',
      ip,
      xrayCaseId,
    });
    return { sourceType: 'TRIAL', sourceId: String(consumed._id), code: consumed.code || 'FREE_THREEDAYS' };
  }

  return null;
}

/**
 * consumeCompare
 * Episode-scoped compare credits. Priority: episode plan -> trial.
 */
export async function consumeCompare({ userUid, episodeId, ip = '', now = new Date(), note = '', session = null }) {
  const plan = await getActiveEpisodePlan(userUid, episodeId, now);
  if (plan) {
    const consumed = await consumePlanUsage({
      planId: plan._id,
      now,
      field: 'comparesUsed',
      limit: plan.entitlements?.compareActions ?? 0,
      amount: 1,
      session,
    });
    if (!consumed) return null;
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'PLAN',
      sourceId: String(consumed._id),
      actionType: ACTIONS.COMPARE,
      amount: 1,
      note: note || 'Compare consumed from episode plan',
      ip,
    });
    return { sourceType: 'PLAN', sourceId: String(consumed._id), code: consumed.planCode };
  }

  const trial = await getActiveTrialForEpisode(userUid, episodeId, now);
  if (trial) {
    const consumed = await consumeTrialUsage({
      trialId: trial._id,
      now,
      field: 'comparesUsed',
      limit: trial.entitlements?.compareActions ?? 0,
      amount: 1,
      session,
    });
    if (!consumed) return null;
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'TRIAL',
      sourceId: String(consumed._id),
      actionType: ACTIONS.COMPARE,
      amount: 1,
      note: note || 'Compare consumed from trial',
      ip,
    });
    return { sourceType: 'TRIAL', sourceId: String(consumed._id), code: consumed.code || 'FREE_THREEDAYS' };
  }

  return null;
}

/**
 * consumeCheckIn
 * Episode-scoped rehab progress check-ins. Priority: episode plan -> trial.
 */
export async function consumeCheckIn({ userUid, episodeId, ip = '', now = new Date(), note = '', session = null }) {
  const plan = await getActiveEpisodePlan(userUid, episodeId, now);
  if (plan) {
    const consumed = await consumePlanUsage({
      planId: plan._id,
      now,
      field: 'checkinsUsed',
      limit: plan.entitlements?.checkinsCap ?? 0,
      amount: 1,
      session,
    });
    if (!consumed) return null;
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'PLAN',
      sourceId: String(consumed._id),
      actionType: ACTIONS.CHECKIN,
      amount: 1,
      note: note || 'Check-in consumed from episode plan',
      ip,
    });
    return { sourceType: 'PLAN', sourceId: String(consumed._id), code: consumed.planCode };
  }

  const trial = await getActiveTrialForEpisode(userUid, episodeId, now);
  if (trial) {
    const consumed = await consumeTrialUsage({
      trialId: trial._id,
      now,
      field: 'checkinsUsed',
      limit: trial.entitlements?.checkinsCap ?? 0,
      amount: 1,
      session,
    });
    if (!consumed) return null;
    await writeLedgerSafe({
      userUid,
      episodeId,
      sourceType: 'TRIAL',
      sourceId: String(consumed._id),
      actionType: ACTIONS.CHECKIN,
      amount: 1,
      note: note || 'Check-in consumed from trial',
      ip,
    });
    return { sourceType: 'TRIAL', sourceId: String(consumed._id), code: consumed.code || 'FREE_THREEDAYS' };
  }

  return null;
}

async function getGlobalMaxCap(userUid, now, capField) {
  const plans = await EpisodePlan.find({ userUid, status: 'active', endAt: { $gt: now } }).lean();
  const trial = await UserTrial.findOne({ userUid, status: 'active', trialEndAt: { $gt: now } }).lean();

  const values = [];
  for (const p of plans) values.push(Number(p?.entitlements?.[capField] ?? 0));
  if (trial) values.push(Number(trial?.entitlements?.[capField] ?? 0));

  // activeMedsCap: 0 means unlimited (if any plan/trial has 0, treat as unlimited)
  if (capField === 'activeMedsCap' && values.some((v) => v === 0) && values.length) {
    return { cap: Infinity, source: 'UNLIMITED' };
  }

  const max = values.length ? Math.max(...values) : Number(FREE_BASE?.entitlements?.[capField] ?? 0);
  return { cap: Number.isFinite(max) ? max : Number(FREE_BASE?.entitlements?.[capField] ?? 0), source: 'MAX' };
}

export async function getRecordsCapForUser({ userUid, now = new Date() }) {
  return getGlobalMaxCap(userUid, now, 'recordsCap');
}

export async function getActiveMedsCapForUser({ userUid, now = new Date() }) {
  return getGlobalMaxCap(userUid, now, 'activeMedsCap');
}
