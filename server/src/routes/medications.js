/**
 * Backend route: medications
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the medications feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { Medication } from '../models/Medication.js';
import { isSubscriptionsEnforced, getActiveMedsCapForUser, makePaywallPayload } from '../lib/subscriptions/enforce.js';
import {
  computeMedicationComputedFields,
  computeNextDueAt,
  computeSlotKeyForDue,
  getLocalDayInfo,
} from '../lib/medicationSchedule.js';

const router = express.Router();

function normalizeFixedTimes(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const times = [];
  const seen = new Set();
  for (const t of arr) {
    const s = String(t || '').trim();
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
    if (!m) continue;
    const key = `${m[1]}:${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    times.push(key);
  }
  times.sort((a, b) => {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return (ah - bh) || (am - bm);
  });
  return times;
}

router.get('/', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const now = new Date();
  const items = await Medication.find({ userUid: req.user.uid }).sort({ createdAt: -1 }).lean();
  const enriched = items.map((m) => ({
    ...m,
    id: m._id.toString(),
    computed: computeMedicationComputedFields(m, now),
  }));
  res.json(enriched);
});

router.post('/', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const name = (req.body?.name || '').toString().trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  const schedule = (req.body?.schedule ?? req.body?.frequency ?? '').toString();
  const timesPerDayRaw = req.body?.timesPerDay;
  const timesPerDay = timesPerDayRaw === undefined || timesPerDayRaw === null || timesPerDayRaw === ''
    ? 1
    : Number(timesPerDayRaw);
  const times = normalizeFixedTimes(req.body?.times);

  const timezone = (req.body?.timezone || 'UTC').toString();
  const timezoneOffsetMinutes = Number.isFinite(Number(req.body?.timezoneOffsetMinutes))
    ? Number(req.body.timezoneOffsetMinutes)
    : 0;
  const scheduleType = (req.body?.scheduleType || (times.length ? 'fixed_times' : 'interval')).toString();
  const intervalMinutesRaw = req.body?.intervalMinutes;
  const intervalMinutesNum = intervalMinutesRaw === undefined || intervalMinutesRaw === null || intervalMinutesRaw === ''
    ? null
    : Number(intervalMinutesRaw);

  // For fixed-time schedules, if user didn't explicitly provide a daily cap,
  // default it to the number of fixed times.
  const userProvidedTimesPerDay = !(timesPerDayRaw === undefined || timesPerDayRaw === null || timesPerDayRaw === '');
  const normalizedScheduleType = ['interval', 'fixed_times', 'prn'].includes(scheduleType)
    ? scheduleType
    : (times.length ? 'fixed_times' : 'interval');

  // Subscription enforcement (additive, gated by env).
  // Active medications are globally capped per user (soft-lock: existing meds remain visible).
  const desiredStatus = (req.body?.status || 'active').toString();
  if (isSubscriptionsEnforced() && desiredStatus === 'active') {
    const { cap } = await getActiveMedsCapForUser({ userUid: req.user.uid });
    if (cap !== Infinity) {
      const currentActive = await Medication.countDocuments({ userUid: req.user.uid, status: 'active' });
      if (currentActive >= cap) {
        return res
          .status(402)
          .json(
            makePaywallPayload({
              actionType: 'MED_ADD',
              message: `Active medications limit reached (${cap}). Complete/pause meds or upgrade to add more.`,
              episodeId: null,
              sourceHint: 'PLAN/TRIAL/FREE_BASE',
            })
          );
      }
    }
  }

  const doc = await Medication.create({
    userUid: req.user.uid,
    name,
    dosage: (req.body?.dosage || '').toString(),
    // Keep legacy frequency but prefer new schedule.
    frequency: (req.body?.frequency || schedule || '').toString(),
    schedule,
    scheduleType: normalizedScheduleType,
    timesPerDay: Number.isFinite(timesPerDay)
      ? Math.min(1440, Math.max(1, userProvidedTimesPerDay ? timesPerDay : (normalizedScheduleType === 'fixed_times' && times.length ? times.length : timesPerDay)))
      : 1,
    intervalMinutes: Number.isFinite(intervalMinutesNum) ? Math.min(10080, Math.max(1, intervalMinutesNum)) : null,
    times,
    timezone,
    timezoneOffsetMinutes,
    prescribedBy: (req.body?.prescribedBy || '').toString(),
    instructions: (req.body?.instructions || '').toString(),
    sideEffects: Array.isArray(req.body?.sideEffects) ? req.body.sideEffects.map(String) : [],
    startDate: req.body?.startDate ? new Date(req.body.startDate) : null,
    endDate: req.body?.endDate ? new Date(req.body.endDate) : null,
    notes: (req.body?.notes || '').toString(),
    status: desiredStatus
  });

  // Set nextDueAt for schedule logic.
  const now = new Date();
  const local = getLocalDayInfo(doc.toObject(), now);
  doc.doseCounterDayKey = local.dayKey;
  doc.doseCounterCount = 0;

  const nextDueAt = computeNextDueAt(doc.toObject(), now);
  doc.nextDueAt = nextDueAt;
  await doc.save();

  const out = doc.toObject();
  out.id = doc._id.toString();
  out.computed = computeMedicationComputedFields(out, new Date());
  res.json(out);
});

router.patch('/:id', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const doc = await Medication.findOne({ _id: req.params.id, userUid: req.user.uid });
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const up = {};
  for (const k of ['name','dosage','frequency','schedule','prescribedBy','instructions','notes','status']) {
    if (req.body?.[k] !== undefined) up[k] = req.body[k];
  }
  if (req.body?.timesPerDay !== undefined) {
    const n = Number(req.body.timesPerDay);
    up.timesPerDay = Number.isFinite(n) ? Math.min(1440, Math.max(1, n)) : 1;
  }
  if (req.body?.times !== undefined) {
    up.times = normalizeFixedTimes(req.body.times);
  }
  if (req.body?.timezone !== undefined) {
    up.timezone = (req.body.timezone || 'UTC').toString();
  }
  if (req.body?.timezoneOffsetMinutes !== undefined) {
    up.timezoneOffsetMinutes = Number.isFinite(Number(req.body.timezoneOffsetMinutes))
      ? Number(req.body.timezoneOffsetMinutes)
      : 0;
  }
  if (req.body?.scheduleType !== undefined) {
    const st = (req.body.scheduleType || '').toString();
    if (['interval','fixed_times','prn'].includes(st)) up.scheduleType = st;
  }
  if (req.body?.intervalMinutes !== undefined) {
    const n = req.body.intervalMinutes === '' || req.body.intervalMinutes === null ? null : Number(req.body.intervalMinutes);
    up.intervalMinutes = Number.isFinite(n) ? Math.min(10080, Math.max(1, n)) : null;
  }
  if (req.body?.startDate !== undefined) up.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
  if (req.body?.endDate !== undefined) up.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
  if (req.body?.sideEffects !== undefined) up.sideEffects = Array.isArray(req.body.sideEffects) ? req.body.sideEffects.map(String) : [];

  // Subscription enforcement (additive, gated by env).
  // If the user is re-activating a medication, ensure they are within the active-meds cap.
  if (
    isSubscriptionsEnforced() &&
    up.status !== undefined &&
    String(up.status) === 'active' &&
    String(doc.status) !== 'active'
  ) {
    const { cap } = await getActiveMedsCapForUser({ userUid: req.user.uid });
    if (cap !== Infinity) {
      const currentActiveExcludingThis = await Medication.countDocuments({
        userUid: req.user.uid,
        status: 'active',
        _id: { $ne: doc._id },
      });
      if (currentActiveExcludingThis >= cap) {
        return res
          .status(402)
          .json(
            makePaywallPayload({
              actionType: 'MED_REACTIVATE',
              message: `Active medications limit reached (${cap}). Complete/pause meds or upgrade to reactivate this medication.`,
              episodeId: null,
              sourceHint: 'PLAN/TRIAL/FREE_BASE',
            })
          );
      }
    }
  }

  // Optional adherence logging ("taken" / "skipped")
  // Supports either:
  //  - { action: 'taken' | 'skipped', at?: ISOString, note?: string }
  //  - { logEntry: { status: 'taken'|'skipped', at?: ISOString, note?: string } }
  const action = (req.body?.action || '').toString();
  const logEntry = req.body?.logEntry;
  const statusFromBody = logEntry?.status || action;
  if (statusFromBody === 'taken' || statusFromBody === 'skipped') {
    // Atomic dose logging (optimistic concurrency):
    // - Require that nextDueAt and doseCounter fields haven't changed since we read.
    // - Advance nextDueAt and counters in the same write so the UI can "unlock" on time.
    const now = new Date();
    const computedBefore = computeMedicationComputedFields(doc.toObject(), now);
    if (!computedBefore.isDueNow) {
      const msg = computedBefore.state === 'daily_cap'
        ? 'Daily dose limit reached'
        : (computedBefore.state === 'not_started'
            ? 'Medication schedule has not started yet'
            : (computedBefore.state === 'expired'
                ? 'Medication schedule has ended'
                : 'Dose is not due yet'));
      return res.status(409).json({ error: msg, computed: computedBefore });
    }

    const atRaw = logEntry?.at ?? req.body?.at;
    const at = atRaw ? new Date(atRaw) : now;
    const note = (logEntry?.note ?? req.body?.note ?? '').toString();
    if (Number.isNaN(at.getTime())) {
      return res.status(400).json({ error: 'Invalid dose timestamp' });
    }

    const dueAt = doc.nextDueAt ? new Date(doc.nextDueAt) : computeNextDueAt(doc.toObject(), now);
    const slotKey = computeSlotKeyForDue(doc.toObject(), dueAt, now);

    // Local day key used for the atomic daily cap counter.
    const { dayKey } = getLocalDayInfo(doc.toObject(), now);
    const currentDayKey = (doc.doseCounterDayKey || '').toString();
    const currentCount = Number.isFinite(Number(doc.doseCounterCount)) ? Number(doc.doseCounterCount) : 0;
    const nextCount = (currentDayKey === dayKey ? currentCount : 0) + 1;

    const maxPerDay = Number.isFinite(Number(doc.timesPerDay)) ? Number(doc.timesPerDay) : 1;
    if (nextCount > maxPerDay) {
      return res.status(409).json({ error: 'Daily dose limit reached', computed: computedBefore });
    }

    // Compute the next due time using a virtual doc that includes this new adherence event.
    const entry = { at, status: statusFromBody, note, slotKey, scheduledFor: dueAt };
    const virtual = doc.toObject();
    virtual.adherence = [...(Array.isArray(virtual.adherence) ? virtual.adherence : []), entry];
    virtual.doseCounterDayKey = dayKey;
    virtual.doseCounterCount = nextCount;
    virtual.nextDueAt = dueAt;
    const newNextDueAt = computeNextDueAt(virtual, now);

    const updated = await Medication.findOneAndUpdate(
      {
        _id: doc._id,
        userUid: req.user.uid,
        // nextDueAt is the concurrency guard (null matches missing fields too).
        nextDueAt: doc.nextDueAt ?? null,
        doseCounterDayKey: currentDayKey,
        doseCounterCount: currentCount,
      },
      {
        $set: {
          doseCounterDayKey: dayKey,
          doseCounterCount: nextCount,
          nextDueAt: newNextDueAt,
        },
        $push: { adherence: entry },
      },
      { new: true }
    );

    if (!updated) {
      // Concurrency conflict: ask client to refresh.
      const latest = await Medication.findOne({ _id: doc._id, userUid: req.user.uid }).lean();
      const computedLatest = latest ? computeMedicationComputedFields(latest, new Date()) : null;
      return res.status(409).json({
        error: 'This medication was updated elsewhere. Please refresh and try again.',
        computed: computedLatest,
      });
    }

    const out = updated.toObject();
    out.id = updated._id.toString();
    out.computed = computeMedicationComputedFields(out, new Date());
    return res.json(out);
  }

  Object.assign(doc, up);

  // Keep daily counters in sync if timezone/schedule changes.
  const now = new Date();
  const computedForCounters = computeMedicationComputedFields(doc.toObject(), now);
  doc.doseCounterDayKey = computedForCounters.dayKey;
  doc.doseCounterCount = computedForCounters.eventsToday;

  // Recompute nextDueAt whenever schedule changes.
  doc.nextDueAt = computeNextDueAt(doc.toObject(), now);
  await doc.save();
  const out = doc.toObject();
  out.id = doc._id.toString();
  out.computed = computeMedicationComputedFields(out, new Date());
  res.json(out);
});

router.delete('/:id', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const r = await Medication.deleteOne({ _id: req.params.id, userUid: req.user.uid });
  res.json({ deleted: r.deletedCount === 1 });
});

export default router;