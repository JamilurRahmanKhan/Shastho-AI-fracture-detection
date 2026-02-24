/**
 * Frontend component: EpisodeSelector
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";

const SELECT_BASE =
  "w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

export default function EpisodeSelector({
  episodes = [],
  value,
  onChange,
  label = "Episode",
  allowAll = true,
}) {
  const hasEpisodes = Array.isArray(episodes) && episodes.length > 0;
  if (!hasEpisodes) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <select
        className={SELECT_BASE}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {allowAll ? <option value="">All episodes</option> : null}
        {episodes.map((ep) => (
          <option key={ep._id || ep.id} value={ep._id || ep.id}>
            {ep.title || "Injury episode"}
          </option>
        ))}
      </select>
    </div>
  );
}
