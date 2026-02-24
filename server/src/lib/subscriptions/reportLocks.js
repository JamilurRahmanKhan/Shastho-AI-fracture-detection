/**
 * Backend library: reportLocks
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import { XrayCase } from '../../models/XrayCase.js';
import { getEntitlementContext } from './engine.js';

function resolveActiveLimit(snapshot) {
  if (!snapshot) return Infinity;
  const src = snapshot.sourceType;
  if (src === 'FREE_BASE') return 3;
  if (src === 'PLAN' || src === 'TRIAL') {
    const cap = Number(snapshot?.entitlements?.reportsCap ?? 0);
    return Number.isFinite(cap) && cap > 0 ? cap : Infinity;
  }
  // PACK or anything else: don't lock reports by recency.
  return Infinity;
}

/**
 * Compute which reports are "active" (unlocked for premium actions) within an episode.
 *
 * Rules:
 * - PLAN/TRIAL: active window size = entitlements.reportsCap
 * - FREE_BASE: active window size = 3
 * - PACK: Infinity
 */
export async function getReportLockContext({ userUid, episodeId, now = new Date() }) {
  const snapshot = await getEntitlementContext({ userUid, episodeId, now });
  const activeLimit = resolveActiveLimit(snapshot);
  return { snapshot, activeLimit };
}

export async function annotateReportsWithLockState({ userUid, episodeId, reports, now = new Date() }) {
  const { snapshot, activeLimit } = await getReportLockContext({ userUid, episodeId, now });
  if (!Array.isArray(reports) || reports.length === 0) return { snapshot, activeLimit, reports: [] };

  if (!Number.isFinite(activeLimit) || activeLimit === Infinity) {
    return {
      snapshot,
      activeLimit,
      reports: reports.map((r, idx) => ({
        ...r,
        premium: {
          isActive: true,
          locked: false,
          index: idx,
          activeLimit: '∞',
        },
      })),
    };
  }

  // Reports are expected to be sorted by createdAt desc.
  const activeSet = new Set(
    reports
      .slice(0, activeLimit)
      .map((r) => String(r?._id || r?.id))
      .filter(Boolean)
  );

  const out = reports.map((r, idx) => {
    const id = String(r?._id || r?.id);
    const isActive = activeSet.has(id);
    return {
      ...r,
      premium: {
        isActive,
        locked: !isActive,
        index: idx,
        activeLimit,
        lockedReason: isActive ? null : 'REPORT_LOCKED_BY_RECENCY',
      },
    };
  });

  return { snapshot, activeLimit, reports: out };
}

export async function isReportActiveForPremiumActions({ userUid, episodeId, xrayCaseId, now = new Date() }) {
  const { activeLimit } = await getReportLockContext({ userUid, episodeId, now });
  if (!Number.isFinite(activeLimit) || activeLimit === Infinity) return { isActive: true, activeLimit };
  if (!xrayCaseId) return { isActive: false, activeLimit };

  const recent = await XrayCase.find({ userUid, episodeId })
    .sort({ createdAt: -1 })
    .select('_id')
    .limit(activeLimit)
    .lean();

  const set = new Set(recent.map((x) => String(x._id)));
  return { isActive: set.has(String(xrayCaseId)), activeLimit };
}
