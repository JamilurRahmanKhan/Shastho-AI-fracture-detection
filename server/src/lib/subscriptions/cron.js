/**
 * Backend library: cron
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import { EpisodePlan } from '../../models/EpisodePlan.js';
import { UserTrial } from '../../models/UserTrial.js';
import { EntitlementLedger } from '../../models/EntitlementLedger.js';

function boolEnv(name, defaultValue = true) {
  const v = process.env[name];
  if (v == null || v === '') return defaultValue;
  const s = String(v).toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(s);
}

export function isSubscriptionsCronEnabled() {
  return boolEnv('SUBSCRIPTIONS_CRON', true);
}

export function startSubscriptionsCron({ intervalMs = 5 * 60 * 1000 } = {}) {
  if (!isSubscriptionsCronEnabled()) {
    console.log('ℹ️ Subscriptions cron disabled (SUBSCRIPTIONS_CRON=false)');
    return { stop: () => {} };
  }

  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    const now = new Date();
    try {
      // Expire episode plans
      const plans = await EpisodePlan.find({ status: 'active', endAt: { $lte: now } })
        .select('_id userUid episodeId planCode endAt')
        .limit(500)
        .lean();

      for (const p of plans) {
        const updated = await EpisodePlan.updateOne(
          { _id: p._id, status: 'active' },
          { $set: { status: 'expired' } }
        );
        if (updated?.modifiedCount) {
          await EntitlementLedger.create({
            userUid: p.userUid,
            episodeId: p.episodeId,
            sourceType: 'SYSTEM',
            sourceId: String(p._id),
            actionType: 'OTHER',
            amount: 0,
            note: `Plan expired: ${p.planCode}`,
          });
        }
      }

      // Expire trials
      const trials = await UserTrial.find({ status: 'active', trialEndAt: { $lte: now } })
        .select('_id userUid episodeId code trialEndAt')
        .limit(500)
        .lean();

      for (const t of trials) {
        const updated = await UserTrial.updateOne(
          { _id: t._id, status: 'active' },
          { $set: { status: 'expired' } }
        );
        if (updated?.modifiedCount) {
          await EntitlementLedger.create({
            userUid: t.userUid,
            episodeId: t.episodeId,
            sourceType: 'SYSTEM',
            sourceId: String(t._id),
            actionType: 'OTHER',
            amount: 0,
            note: `Trial expired: ${t.code}`,
          });
        }
      }
    } catch (e) {
      console.warn('⚠️ Subscriptions cron tick failed:', e?.message || e);
    } finally {
      running = false;
    }
  };

  // Run once shortly after startup, then on an interval.
  const t0 = setTimeout(tick, 10 * 1000);
  const iv = setInterval(tick, intervalMs);

  console.log('✅ Subscriptions cron enabled');
  return {
    stop: () => {
      clearTimeout(t0);
      clearInterval(iv);
    },
  };
}
