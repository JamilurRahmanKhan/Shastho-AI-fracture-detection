/**
 * Backend library: medicationSchedule
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import { DateTime, FixedOffsetZone, IANAZone } from 'luxon';

const MS_MIN = 60 * 1000;

function clampInt(n, { min, max, fallback }) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  const i = Math.trunc(v);
  return Math.min(max, Math.max(min, i));
}

function normalizeTimesPerDay(n) {
  return clampInt(n, { min: 1, max: 1440, fallback: 1 });
}

function normalizeIntervalMinutes(n) {
  if (n === '' || n === null || n === undefined) return null;
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.min(10080, Math.max(1, Math.trunc(v)));
}

function normalizeOffsetMinutes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  // JS Date.getTimezoneOffset is bounded roughly [-840, 840]
  return Math.min(840, Math.max(-840, Math.trunc(v)));
}

export function getMedicationZone(med) {
  const tz = (med?.timezone || 'UTC').toString();
  if (IANAZone.isValidZone(tz)) return tz;

  // Fallback: fixed offset. JS getTimezoneOffset returns (UTC - local) in minutes.
  const offsetMinutes = normalizeOffsetMinutes(med?.timezoneOffsetMinutes);
  const zoneOffset = -offsetMinutes;
  return FixedOffsetZone.instance(zoneOffset);
}

export function getLocalDayInfo(med, now = new Date()) {
  const zone = getMedicationZone(med);
  const dt = DateTime.fromJSDate(now).setZone(zone);
  const dayKey = dt.toFormat('yyyy-LL-dd');
  const startUtc = dt.startOf('day').toUTC();
  const endUtc = dt.endOf('day').toUTC();
  return {
    zone,
    dayKey,
    dayStartUtc: startUtc.toJSDate(),
    dayEndUtc: endUtc.toJSDate(),
    nowLocal: dt,
  };
}

function parseHHmm(s) {
  const str = String(s || '').trim();
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(str);
  if (!m) return null;
  return { hh: Number(m[1]), mm: Number(m[2]), text: `${m[1]}:${m[2]}` };
}

function uniqueSortedTimes(times) {
  const parsed = (Array.isArray(times) ? times : [])
    .map(parseHHmm)
    .filter(Boolean);
  const uniq = new Map();
  for (const t of parsed) uniq.set(t.text, t);
  return Array.from(uniq.values()).sort((a, b) => (a.hh - b.hh) || (a.mm - b.mm));
}

function withinActiveDates(med, now) {
  const start = med?.startDate ? new Date(med.startDate) : null;
  const end = med?.endDate ? new Date(med.endDate) : null;
  if (start && !Number.isNaN(start.getTime()) && now < start) return { ok: false, state: 'not_started', start };
  if (end && !Number.isNaN(end.getTime()) && now > end) return { ok: false, state: 'expired', end };
  return { ok: true, state: 'active' };
}

function computeEventsToday(med, now) {
  const { dayStartUtc, dayEndUtc, dayKey, zone, nowLocal } = getLocalDayInfo(med, now);
  const entries = Array.isArray(med?.adherence) ? med.adherence : [];

  const events = entries.filter((e) => {
    const at = e?.at ? new Date(e.at) : null;
    if (!at || Number.isNaN(at.getTime())) return false;
    return at >= dayStartUtc && at <= dayEndUtc;
  });

  const usedSlotKeys = new Set();
  for (const e of events) {
    const sk = (e?.slotKey || '').toString();
    if (sk && sk.startsWith(`${dayKey}|`)) usedSlotKeys.add(sk);
  }

  return {
    dayStartUtc,
    dayEndUtc,
    dayKey,
    zone,
    nowLocal,
    eventsToday: events.length,
    usedSlotKeys,
  };
}

export function computeNextDueAt(med, now = new Date()) {
  if (!med) return null;
  const status = (med.status || 'active').toString();
  if (status !== 'active') return null;

  const timesPerDay = normalizeTimesPerDay(med.timesPerDay);
  const intervalMinutes = normalizeIntervalMinutes(med.intervalMinutes);
  const scheduleType = (med.scheduleType || 'interval').toString();

  const dateGate = withinActiveDates(med, now);
  const anchor = dateGate.state === 'not_started' && dateGate.start ? dateGate.start : now;
  if (dateGate.state === 'expired') return null;

  const { dayKey, zone, nowLocal, eventsToday, usedSlotKeys } = computeEventsToday(med, anchor);

  // Daily cap reached: next allowed is start of next local day.
  if (eventsToday >= timesPerDay) {
    const next = nowLocal.startOf('day').plus({ days: 1 }).toUTC();
    // If medication has a future startDate, anchor to it.
    if (dateGate.state === 'not_started' && dateGate.start) {
      const start = DateTime.fromJSDate(dateGate.start).toUTC();
      return (next < start ? start : next).toJSDate();
    }
    return next.toJSDate();
  }

  const entries = Array.isArray(med?.adherence) ? med.adherence : [];
  const last = entries.length ? entries[entries.length - 1] : null;
  const lastAt = last?.at ? new Date(last.at) : null;

  // Interval schedule
  if (scheduleType === 'interval') {
    if (!intervalMinutes) {
      // Derive a sane interval from the daily cap.
      const derived = Math.max(1, Math.round(1440 / timesPerDay));
      const next = (lastAt && !Number.isNaN(lastAt.getTime()))
        ? DateTime.fromJSDate(lastAt).plus({ minutes: derived }).toUTC()
        : DateTime.fromJSDate(anchor).toUTC();
      return next.toJSDate();
    }

    const next = (lastAt && !Number.isNaN(lastAt.getTime()))
      ? DateTime.fromJSDate(lastAt).plus({ minutes: intervalMinutes }).toUTC()
      : DateTime.fromJSDate(anchor).toUTC();
    return next.toJSDate();
  }

  // PRN: allow anytime, optionally with a minimum interval.
  if (scheduleType === 'prn') {
    if (intervalMinutes && lastAt && !Number.isNaN(lastAt.getTime())) {
      return DateTime.fromJSDate(lastAt).plus({ minutes: intervalMinutes }).toUTC().toJSDate();
    }
    return DateTime.fromJSDate(anchor).toUTC().toJSDate();
  }

  // Fixed times (HH:mm)
  const fixedTimes = uniqueSortedTimes(med.times);
  if (fixedTimes.length === 0) {
    // Nothing to schedule.
    return null;
  }

  // Try today (local)
  for (const t of fixedTimes) {
    const candidateLocal = nowLocal.set({ hour: t.hh, minute: t.mm, second: 0, millisecond: 0 });
    if (candidateLocal < nowLocal) continue;

    const slotKey = `${dayKey}|${t.text}`;
    if (usedSlotKeys.has(slotKey)) continue;

    return candidateLocal.toUTC().toJSDate();
  }

  // Otherwise, schedule tomorrow at the earliest fixed time.
  const tomorrowLocal = nowLocal.startOf('day').plus({ days: 1 });
  const first = fixedTimes[0];
  const dueTomorrow = tomorrowLocal.set({ hour: first.hh, minute: first.mm, second: 0, millisecond: 0 });
  return dueTomorrow.toUTC().toJSDate();
}

export function computeMedicationComputedFields(med, now = new Date()) {
  const timesPerDay = normalizeTimesPerDay(med?.timesPerDay);
  const dateGate = withinActiveDates(med, now);
  const scheduleType = (med?.scheduleType || 'interval').toString();

  const { dayKey, eventsToday } = computeEventsToday(med, now);
  const remainingToday = Math.max(0, timesPerDay - eventsToday);

  const nextDueAt = med?.nextDueAt ? new Date(med.nextDueAt) : computeNextDueAt(med, now);
  const nextDueAtMs = nextDueAt && !Number.isNaN(nextDueAt.getTime()) ? nextDueAt.getTime() : null;
  const isActive = (med?.status || 'active').toString() === 'active' && dateGate.ok;

  const isDueNow = Boolean(
    isActive &&
      remainingToday > 0 &&
      nextDueAtMs !== null &&
      nextDueAtMs <= now.getTime()
  );

  const state = !isActive
    ? (dateGate.state === 'not_started' ? 'not_started' : (dateGate.state === 'expired' ? 'expired' : 'inactive'))
    : (remainingToday <= 0 ? 'daily_cap' : 'active');

  return {
    scheduleType,
    dayKey,
    eventsToday,
    remainingToday,
    nextDueAt: nextDueAtMs ? nextDueAt.toISOString() : null,
    isDueNow,
    state,
  };
}

export function computeSlotKeyForDue(med, dueAt, now = new Date()) {
  const zone = getMedicationZone(med);
  const scheduleType = (med?.scheduleType || 'interval').toString();

  if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
    const dk = DateTime.fromJSDate(now).setZone(zone).toFormat('yyyy-LL-dd');
    return `${dk}|unscheduled`;
  }

  const dueDt = DateTime.fromJSDate(new Date(dueAt)).setZone(zone);
  const dayKey = dueDt.toFormat('yyyy-LL-dd');

  if (scheduleType === 'fixed_times') {
    const t = dueDt.toFormat('HH:mm');
    return `${dayKey}|${t}`;
  }

  // For interval / PRN, we use local dayKey + ISO minute bucket.
  return `${dayKey}|${dueDt.toFormat('HH:mm')}`;
}
