/**
 * Frontend component: subscription-utils
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

export function formatPlanCode(code) {
  const c = String(code || "").toUpperCase();
  if (!c) return "Free";
  if (c === "FREE_BASE") return "Free";
  if (c === "FREE_THREEDAYS") return "FREE_ThreeDays";
  if (c === "ACCIDENT_PASS_7D") return "Accident Pass (7 Days)";
  if (c === "RECOVERY_6W") return "Recovery Plan (6 Weeks)";
  if (c === "RECOVERY_PLUS_12W") return "Recovery Plus (12 Weeks)";
  if (c === "SCAN_PACK") return "Scan Pack";
  if (c === "PDF_PACK") return "PDF Export Pack";
  return code;
}

export function formatTimeLeft(endAt) {
  if (!endAt) return "";
  const end = new Date(endAt).getTime();
  const now = Date.now();
  const diff = end - now;
  if (!Number.isFinite(diff)) return "";
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const h = hrs % 24;
  const m = mins % 60;
  if (days > 0) return `${days}d ${h}h`;
  if (hrs > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getRemaining(snapshot, key) {
  return snapshot?.entitlements?.remaining?.[key];
}
