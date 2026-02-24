/**
 * Frontend component: SubscriptionBanner
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { AlertCircle, Clock, Crown, Gift } from "lucide-react";
import { formatPlanCode, formatTimeLeft, getRemaining } from "./subscription-utils";

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function SubscriptionBanner({
  snapshot,
  trial,
  plan,
  onActivateTrial,
  busy,
}) {
  if (!snapshot) return null;

  const code = snapshot.code;
  const isTrial = code === "FREE_THREEDAYS";
  const isFree = code === "FREE_BASE";

  const label = plan?.name || formatPlanCode(code);
  const timeLeft = formatTimeLeft(snapshot.endAt);

  const scansRem = getRemaining(snapshot, "scanCredits");
  const pdfRem = getRemaining(snapshot, "pdfExports");
  const shareRem = getRemaining(snapshot, "shareLinks");
  const ctxChatRem = getRemaining(snapshot, "scanContextChat");
  const genChatRem = getRemaining(snapshot, "generalChat");

  const titleIcon = isTrial ? <Gift className="w-5 h-5 text-blue-700" /> : isFree ? <Clock className="w-5 h-5 text-slate-700" /> : <Crown className="w-5 h-5 text-amber-600" />;
  const tone = isFree ? "bg-white" : "bg-white";

  return (
    <div className={`rounded-2xl border border-slate-200 ${tone} shadow-sm p-5`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{titleIcon}</div>
          <div>
            <div className="text-sm text-slate-600">Current access</div>
            <div className="text-lg font-semibold text-slate-900">{label}</div>
            {snapshot.endAt ? (
              <div className="mt-1 text-sm text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Ends in {timeLeft}</span>
              </div>
            ) : (
              <div className="mt-1 text-sm text-slate-600">No active plan</div>
            )}
            {trial?.eligible === false ? (
              <div className="mt-2 text-xs text-slate-500">Trial cooldown active</div>
            ) : null}
          </div>
        </div>

        {isFree && trial?.eligible ? (
          <button
            type="button"
            onClick={() => onActivateTrial?.()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            <Gift className="w-4 h-4" />
            Activate FREE_ThreeDays
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat label="Scans left" value={scansRem == null ? "—" : scansRem} />
        <Stat label="PDF exports" value={pdfRem == null ? "—" : pdfRem} />
        <Stat label="Share links" value={shareRem == null ? "—" : shareRem} />
        <Stat label="Scan chat" value={ctxChatRem == null ? "—" : ctxChatRem} />
        <Stat label="General chat" value={genChatRem == null ? "—" : genChatRem} />
      </div>
    </div>
  );
}
