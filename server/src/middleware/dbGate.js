/**
 * Backend middleware: dbGate
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express middleware used to enforce authentication/authorization, rate limiting, and request guards.
 *
 * Project-specific notes:
 * - (none)
 */

/**
 * DB gate middleware
 *
 * When MongoDB is temporarily unavailable (network hiccup, Atlas IP allowlist,
 * etc.), many endpoints would otherwise throw and spam the logs. This middleware
 * short-circuits DB-backed endpoints with a clear 503 response.
 *
 * Keep the allow-list tight so it doesn't change existing behavior when DB is up.
 */

export function requireMongoAvailable(req, res, next) {
  if (req.app?.locals?.dbReady) return next();

  // Allow a small set of endpoints to function without MongoDB.
  const allow = [
    // Plan catalogue is static config; safe to serve even if DB is down.
    { method: 'GET', prefix: '/subscriptions/plans' },
  ];

  const path = req.path || '';
  const isAllowed = allow.some((rule) => req.method === rule.method && path.startsWith(rule.prefix));
  if (isAllowed) return next();

  return res.status(503).json({
    message: 'Database temporarily unavailable. Please try again.',
    code: 'DB_UNAVAILABLE',
    hint: 'Check MongoDB Atlas Network Access (IP allowlist) and your MONGODB_URI.',
  });
}
