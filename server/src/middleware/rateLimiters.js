/**
 * Backend middleware: rateLimiters
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express middleware used to enforce authentication/authorization, rate limiting, and request guards.
 *
 * Project-specific notes:
 * - (none)
 */

import rateLimit from 'express-rate-limit';

// Focused rate limiters for high-cost or abuse-prone endpoints.
// All limiters respond with JSON so the client can show a friendly message.

function uidOrIpKey(req) {
  const uid = req.user?.uid;
  return uid ? `uid:${uid}` : req.ip;
}

function jsonHandler(actionLabel) {
  return (_req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      action: actionLabel,
      message: 'Rate limit reached. Please try again shortly.'
    });
  };
}

export const xrayUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: uidOrIpKey,
  handler: jsonHandler('XRAY_UPLOAD')
});

export const pdfExportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: uidOrIpKey,
  handler: jsonHandler('PDF_EXPORT')
});

export const shareLinkLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: uidOrIpKey,
  handler: jsonHandler('SHARE_LINK')
});

export const compareLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: uidOrIpKey,
  handler: jsonHandler('COMPARE')
});

export const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: uidOrIpKey,
  handler: jsonHandler('CHAT_MESSAGE')
});

export const trialActivationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: uidOrIpKey,
  handler: jsonHandler('TRIAL_ACTIVATE')
});

export const purchasePlanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: uidOrIpKey,
  handler: jsonHandler('PURCHASE_PLAN')
});
