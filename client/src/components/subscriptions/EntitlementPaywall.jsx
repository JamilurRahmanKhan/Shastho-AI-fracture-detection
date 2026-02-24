/**
 * Frontend component: EntitlementPaywall
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { AlertCircle, Gift, Settings } from "lucide-react";

export default function EntitlementPaywall({
  payload,
  onActivateTrial,
  onGoSettings,
  busy,
}) {
  if (!payload) return null;

  const message = payload?.message || payload?.error || "This action is locked.";
  const hint = payload?.sourceHint || payload?.actionType;

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-rose-900">Upgrade required</div>
          <p className="mt-1 text-sm text-rose-900">{message}</p>
          {hint ? <div className="mt-2 text-xs text-rose-800/80">{hint}</div> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {onActivateTrial ? (
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
            {onGoSettings ? (
              <button
                type="button"
                onClick={() => onGoSettings?.()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 font-semibold hover:bg-slate-100"
              >
                <Settings className="w-4 h-4" />
                Go to Settings
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
