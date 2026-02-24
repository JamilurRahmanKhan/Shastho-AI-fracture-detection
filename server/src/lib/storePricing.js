/**
 * Backend library: storePricing
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Shared backend utilities used across routes (AI providers, ML runner helpers, formatting, etc.).
 *
 * Project-specific notes:
 * - (none)
 */

import { StorePricingConfig } from '../models/StorePricingConfig.js';

let _cache = { value: null, ts: 0 };
const CACHE_MS = 15_000;

/**
 * Best-effort country code extraction.
 * - Supports explicit headers/query for deployments behind proxies/CDNs.
 * - Falls back to empty string (meaning: use base pricing config).
 */
export function getCountryCodeFromReq(req) {
  const q = String(req?.query?.country || '').trim();
  if (q) return q.toUpperCase();

  const h =
    req?.headers?.['x-country'] ||
    req?.headers?.['x-country-code'] ||
    req?.headers?.['cf-ipcountry'] ||
    req?.headers?.['x-vercel-ip-country'] ||
    req?.headers?.['x-geo-country'];

  const code = String(Array.isArray(h) ? h[0] : h || '').trim();
  return code ? code.toUpperCase() : '';
}

function pickOverride(base, countryCode) {
  if (!countryCode) return null;
  const list = Array.isArray(base?.countryOverrides) ? base.countryOverrides : [];
  return list.find((o) => String(o.countryCode || '').toUpperCase() === countryCode.toUpperCase()) || null;
}

export function applyCountryOverride(baseConfig, countryCode) {
  const c = baseConfig?.toObject ? baseConfig.toObject() : (baseConfig || {});
  const override = pickOverride(c, countryCode);
  if (!override) {
    return {
      ...c,
      activeCountryCode: countryCode || '',
      currencyCode: c.baseCurrencyCode,
      currencySymbol: c.baseCurrencySymbol,
      taxRate: c.defaultTaxRate,
      shippingFee: c.defaultShippingFee,
      freeShippingThreshold: c.freeShippingThreshold,
      isOverride: false,
    };
  }

  return {
    ...c,
    activeCountryCode: countryCode || '',
    currencyCode: override.currencyCode || c.baseCurrencyCode,
    currencySymbol: override.currencySymbol || c.baseCurrencySymbol,
    taxRate: typeof override.taxRate === 'number' ? override.taxRate : c.defaultTaxRate,
    shippingFee: typeof override.shippingFee === 'number' ? override.shippingFee : c.defaultShippingFee,
    freeShippingThreshold:
      typeof override.freeShippingThreshold === 'number' ? override.freeShippingThreshold : c.freeShippingThreshold,
    isOverride: true,
  };
}

export async function getPricingConfig({ bypassCache = false } = {}) {
  const now = Date.now();
  if (!bypassCache && _cache.value && (now - _cache.ts) < CACHE_MS) return _cache.value;

  const cfg = await StorePricingConfig.findOne({}).sort({ createdAt: 1 }).lean();
  _cache = { value: cfg, ts: now };
  return cfg;
}

function round2(n) {
  // Avoid floating errors in UI
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}

export function computePricingFromConfig(subtotal, activeConfig) {
  const sub = Number(subtotal || 0);
  const tax = round2(sub * Number(activeConfig?.taxRate || 0));
  const freeThreshold = Number(activeConfig?.freeShippingThreshold || 0);
  const shippingFee = Number(activeConfig?.shippingFee || 0);
  const shipping = sub >= freeThreshold ? 0 : shippingFee;
  const total = round2(sub + tax + shipping);

  return {
    subtotal: round2(sub),
    tax,
    shipping: round2(shipping),
    total,
    taxRate: Number(activeConfig?.taxRate || 0),
    shippingFee: shippingFee,
    freeShippingThreshold: freeThreshold,
    currencyCode: activeConfig?.currencyCode || activeConfig?.baseCurrencyCode || 'BDT',
    currencySymbol: activeConfig?.currencySymbol || activeConfig?.baseCurrencySymbol || '৳',
    isFreeShipping: sub >= freeThreshold,
    countryCode: activeConfig?.activeCountryCode || '',
  };
}

/**
 * Convenience: fetch config from DB + apply override + compute totals.
 */
export async function computePricing(subtotal, { countryCode = '' } = {}) {
  const base = await getPricingConfig();
  const active = applyCountryOverride(base, countryCode);
  return computePricingFromConfig(subtotal, active);
}
