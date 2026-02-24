/**
 * Backend library: episodes
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import { InjuryEpisode } from '../../models/InjuryEpisode.js';

/**
 * Episode helpers (Step 2)
 *
 * Additive utilities to create/select episodes without affecting existing flows.
 */

export async function getMostRecentOpenEpisode(userUid) {
  return InjuryEpisode.findOne({ userUid, status: 'open' })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getEpisodeByIdForUser(userUid, episodeId) {
  if (!episodeId) return null;
  return InjuryEpisode.findOne({ _id: episodeId, userUid }).lean();
}

/**
 * Ensures a default open episode exists for a user.
 * Used for flows like X-ray uploads when the caller doesn't specify an episode.
 */
export async function ensureDefaultEpisode(userUid, opts = {}) {
  const existing = await getMostRecentOpenEpisode(userUid);
  if (existing) return existing;

  const title = typeof opts.title === 'string' && opts.title.trim() ? opts.title.trim() : 'Injury Episode';
  const meta = opts.meta && typeof opts.meta === 'object' ? opts.meta : null;

  const created = await InjuryEpisode.create({
    userUid,
    title,
    status: 'open',
    ...(meta ? { meta: { ...meta } } : {}),
  });

  // Return a lean snapshot for consistency
  return InjuryEpisode.findById(created._id).lean();
}

export async function pickDefaultEpisodeId(userUid) {
  const ep = await getMostRecentOpenEpisode(userUid);
  return ep ? String(ep._id) : null;
}
