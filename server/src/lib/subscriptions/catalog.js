/**
 * Backend library: catalog
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

/**
 * Subscription catalog
 *
 * IMPORTANT:
 * - Keep codes stable (used for storage + admin reporting).
 * - Entitlements are snapshotted into EpisodePlan/UserTrial at activation/purchase time
 *   so future catalog changes won't alter existing users.
 */

export const PLAN_CODES = {
  ACCIDENT_PASS_7D: 'ACCIDENT_PASS_7D',
  RECOVERY_6W: 'RECOVERY_6W',
  RECOVERY_PLUS_12W: 'RECOVERY_PLUS_12W',
};

export const TRIAL_CODE = 'FREE_THREEDAYS';

export const FREE_BASE = {
  code: 'FREE_BASE',
  durationDays: 0,
  episodeScoped: false,
  entitlements: {
    scanCredits: 0,
    pdfExports: 0,
    shareLinks: 0,
    compareActions: 0,
    scanContextChat: 0,
    // Your spec suggests either 5/day or 10/week.
    // We expose this as a value (not enforced yet) so UI can display it.
    generalChat: 10,
    reportsCap: 3,
    recordsCap: 3,
    activeMedsCap: 3,
    checkinsCap: 0,
  },
};

export const TRIAL_FREE_THREEDAYS = {
  code: TRIAL_CODE,
  durationHours: 72,
  cooldownDays: 90,
  episodeScoped: true,
  entitlements: {
    scanCredits: 2,
    pdfExports: 1,
    shareLinks: 1,
    compareActions: 1,
    scanContextChat: 50,
    generalChat: 10,
    reportsCap: 10,
    recordsCap: 10,
    activeMedsCap: 10,
    checkinsCap: 10,
  },
};

export const PLAN_CATALOG = {
  [PLAN_CODES.ACCIDENT_PASS_7D]: {
    code: PLAN_CODES.ACCIDENT_PASS_7D,
    durationDays: 7,
    episodeScoped: true,
    entitlements: {
      scanCredits: 1,
      pdfExports: 1,
      shareLinks: 1,
      compareActions: 0,
      scanContextChat: 30,
      generalChat: 10,
      reportsCap: 20,
      recordsCap: 10,
      activeMedsCap: 10,
      checkinsCap: 7,
    },
  },
  [PLAN_CODES.RECOVERY_6W]: {
    code: PLAN_CODES.RECOVERY_6W,
    durationDays: 42,
    episodeScoped: true,
    entitlements: {
      scanCredits: 2,
      pdfExports: 3,
      shareLinks: 3,
      compareActions: 1,
      scanContextChat: 200,
      generalChat: 30,
      reportsCap: 50,
      recordsCap: 50,
      activeMedsCap: 0, // 0 = unlimited in our internal convention
      checkinsCap: 42,
    },
  },
  [PLAN_CODES.RECOVERY_PLUS_12W]: {
    code: PLAN_CODES.RECOVERY_PLUS_12W,
    durationDays: 84,
    episodeScoped: true,
    entitlements: {
      scanCredits: 4,
      pdfExports: 10,
      shareLinks: 10,
      compareActions: 3,
      scanContextChat: 500,
      generalChat: 100,
      reportsCap: 200,
      recordsCap: 200,
      activeMedsCap: 0, // unlimited
      checkinsCap: 84,
    },
  },
};

export function getPlanFromCatalog(code) {
  if (!code) return null;
  return PLAN_CATALOG[String(code)] || null;
}
