/**
 * Backend: index
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Server entrypoint and core backend wiring for ShasthoAI.
 *
 * Project-specific notes:
 * - (none)
 */

// ---------------------------------------------------------------------------
// Environment loading
//
// This monorepo is often started from the repo root using `npm run dev`
// (concurrently). Depending on tooling, the server process CWD can be either
// the repo root or the server folder. To make `.env` loading reliable for
// first-time setups, we explicitly load `server/.env` and then fall back to
// the default dotenv behavior.
// ---------------------------------------------------------------------------
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __envFilename = fileURLToPath(import.meta.url);
const __envDirname = path.dirname(__envFilename);

// Prefer server/.env
dotenv.config({ path: path.resolve(__envDirname, '../.env') });
// Also try repo root .env (common when running from /server in dev)
dotenv.config({ path: path.resolve(__envDirname, '../../.env') });
// Fallback to CWD .env if present
dotenv.config();

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';
// (path + fileURLToPath imported above for dotenv)
import mongoose from 'mongoose';
mongoose.set('bufferCommands', false);

import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import publicShareRoutes from './routes/publicShare.js';
import { requireMongoAvailable } from './middleware/dbGate.js';
import { Medication } from './models/Medication.js';
import { StorePricingConfig } from './models/StorePricingConfig.js';
import { PharmacyInventoryItem } from './models/PharmacyInventoryItem.js';
import { initSocket } from './realtime/initSocket.js';
import { startSubscriptionsCron } from './lib/subscriptions/cron.js';

const app = express();
app.locals.dbReady = false;

// ---------------------------------------------------------------------------
// Resilience guards
//
// In local development, transient network issues (Wi‑Fi changes, VPN,
// MongoDB Atlas IP allow-list changes, etc.) can surface as driver
// exceptions. We *log* them to aid debugging but avoid crashing the
// whole server process.
//
// Note: In production you usually want a process manager (PM2, Docker,
// Kubernetes) to restart on fatal errors. In dev, staying alive makes
// iteration easier.
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
});

// Default to 5001 to avoid common local conflicts (5000 is often used by other tools).
// You can override via server/.env (PORT=5000) if you prefer.
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

// Basic security hardening
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// If MongoDB is not connected, fail fast with a clear 503 instead of timing out and throwing 500s.
// This keeps the UI responsive and makes the root cause obvious during local development.
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (app.locals.dbReady) return next();
  return res.status(503).json({ error: 'Database unavailable. Check MONGODB_URI and connection status.' });
});


// Rate limiting on API routes
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

// CORS
const origins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser clients or same-origin proxied requests
    if (!origin) return cb(null, true);

    if (origins.length === 0 || origins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded images
const __filename = __envFilename;
const __dirname = __envDirname;
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Public report share pages (token-based, no auth)
app.use('/share', publicShareRoutes);

// Root + health (useful for quick verification / load balancers)
app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'shasthoai-server',
    dbReady: Boolean(app.locals.dbReady),
    time: new Date().toISOString()
  });
});

// API
  // DB gate keeps the server responsive (503) instead of spamming 500s when
  // MongoDB is temporarily unavailable.
  app.use('/api', requireMongoAvailable, apiRoutes);

// Error handler (including multer fileFilter errors)
// In development, return a little more context so you can quickly spot the failing endpoint.
// In production, keep responses minimal.
app.use((err, req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Server error';

  // Always log server-side (helps pinpoint 500s from terminal)
  console.error(`❌ ${req.method} ${req.originalUrl} -> ${status}: ${message}`);
  if (err.stack) console.error(err.stack);

  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  res.status(status).json({
    error: message,
    ...(isProd ? {} : { stack: err.stack })
  });
});

async function start() {
  // In production, it's safer to fail fast if the database is unavailable.
  // In development, some networks/DNS setups can temporarily break Atlas SRV lookups.
  // We still start the server so you can reach /api/health and load the frontend,
  // but DB-backed endpoints will return 503 until the DB is reachable.
  let dbReady = false;
  let usedMongoUri = null;
  let lastDbError = null;

  const redactMongoUri = (uri) => {
    try {
      // mongodb+srv://user:pass@host/db?...
      return String(uri || '').replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+@/i, '$1***@');
    } catch {
      return '<invalid uri>';
    }
  };

  const guessCorrectedAtlasUri = (uri) => {
    if (!uri || typeof uri !== 'string') return null;
    if (!uri.startsWith('mongodb+srv://')) return null;

    // Common copy/paste typo seen in some setups: "...detectio.<cluster>..." (missing trailing 'n')
    // We only attempt this correction AFTER the original URI fails.
    const m = uri.match(/mongodb\+srv:\/\/([^@]+)@([^/]+)(\/.*)?$/i);
    if (!m) return null;
    const auth = m[1];
    const host = m[2];
    const rest = m[3] || '';

    if (host.includes('detectio.') && !host.includes('detection.')) {
      const correctedHost = host.replace('detectio.', 'detection.');
      return `mongodb+srv://${auth}@${correctedHost}${rest}`;
    }
    return null;
  };

  const primaryUri = process.env.MONGODB_URI;
  const candidates = [];
  if (primaryUri) candidates.push(primaryUri);

  const corrected = guessCorrectedAtlasUri(primaryUri);
  if (corrected && corrected !== primaryUri) candidates.push(corrected);

  if (process.env.MONGODB_URI_FALLBACK) {
    candidates.push(process.env.MONGODB_URI_FALLBACK);
  } else if (process.env.NODE_ENV !== 'production') {
    // Dev convenience: allow local Mongo fallback if Atlas SRV/DNS is blocked.
    candidates.push('mongodb://127.0.0.1:27017/shasthoai');
  }

  // Try candidates sequentially. This keeps production strict while making dev setup resilient.
  for (const uri of candidates) {
    try {
      await connectDB(uri);
      dbReady = true;
      usedMongoUri = uri;
      break;
    } catch (e) {
      lastDbError = e;
    }
  }

  if (dbReady) {

    // Ensure Store Pricing Config exists (deploy-ready, no manual DB setup).
    const existingPricing = await StorePricingConfig.findOne({}).lean();
    if (!existingPricing) {
      await StorePricingConfig.create({
        // Bangladesh-first defaults (matches the rest of the store data in Phase 6).
        baseCurrencyCode: 'BDT',
        baseCurrencySymbol: '৳',
        defaultTaxRate: 0.08,
        defaultShippingFee: 5.99,
        freeShippingThreshold: 50,
        countryOverrides: [],
      });
      console.log('✅ StorePricingConfig created with defaults');
    } else {
      // Migration: older Phase 7 builds created an initial USD config by mistake.
      // If the existing config still looks like that untouched default, switch to BDT automatically
      // so products (which are stored as BDT in Phase 6) can be added to cart.
      const looksLikeOldUsdDefault =
        String(existingPricing.baseCurrencyCode || '').toUpperCase() === 'USD' &&
        String(existingPricing.baseCurrencySymbol || '') === '$' &&
        Number(existingPricing.defaultTaxRate ?? 0) === 0.08 &&
        Number(existingPricing.defaultShippingFee ?? 0) === 5.99 &&
        Number(existingPricing.freeShippingThreshold ?? 0) === 50 &&
        Array.isArray(existingPricing.countryOverrides) &&
        existingPricing.countryOverrides.length === 0;

      if (looksLikeOldUsdDefault) {
        await StorePricingConfig.updateOne(
          { _id: existingPricing._id },
          {
            $set: {
              baseCurrencyCode: 'BDT',
              baseCurrencySymbol: '৳',
              updatedByUid: 'system-migration',
            },
          }
        );
        console.log('✅ StorePricingConfig migrated from USD default to BDT');
      } else {
        // If the config is USD but the existing inventory is clearly BDT-only,
        // migrate to BDT to prevent mixed-currency cart blocking.
        const cfgCode = String(existingPricing.baseCurrencyCode || '').toUpperCase();
        if (cfgCode === 'USD') {
          try {
            const total = await PharmacyInventoryItem.countDocuments({ isDeleted: false });
            if (total === 0) {
              // Bangladesh-first default: if inventory is empty but config is USD,
              // switch to BDT so new medicines are created in BDT.
              await StorePricingConfig.updateOne(
                { _id: existingPricing._id },
                {
                  $set: {
                    baseCurrencyCode: 'BDT',
                    baseCurrencySymbol: '৳',
                    updatedByUid: 'system-migration',
                  },
                }
              );
              console.log('✅ StorePricingConfig migrated to BDT (empty inventory)');
            } else {
              const usd = await PharmacyInventoryItem.countDocuments({ isDeleted: false, currency: 'USD' });
              const bdtOrMissing = await PharmacyInventoryItem.countDocuments({
                isDeleted: false,
                $or: [
                  { currency: { $exists: false } },
                  { currency: null },
                  { currency: '' },
                  { currency: 'BDT' },
                ],
              });

              const bdtRatio = bdtOrMissing / total;
              const bdtOnly = usd === 0 && bdtRatio >= 0.8;
              if (bdtOnly) {
                await StorePricingConfig.updateOne(
                  { _id: existingPricing._id },
                  {
                    $set: {
                      baseCurrencyCode: 'BDT',
                      baseCurrencySymbol: '৳',
                      updatedByUid: 'system-migration',
                    },
                  }
                );
                console.log('✅ StorePricingConfig migrated to BDT based on existing inventory');
              }
            }
          } catch (e) {
            console.warn('⚠️ StorePricingConfig migration check failed:', e?.message || e);
          }
        }
      }
    }

  } else {
    dbReady = false;
    app.locals.dbReady = false;

    console.error("\n⚠️  MongoDB connection failed.");
    console.error(String(lastDbError?.message || lastDbError || 'Unknown DB error'));

    // Show attempted targets (redacted)
    console.error("\nTried the following MONGODB_URI candidates (redacted):");
    for (const uri of candidates) console.error(`- ${redactMongoUri(uri)}`);

    console.error("\nCommon fixes:");
    console.error("- Verify the Atlas host is correct (copy the URI from Atlas > Connect).");
    console.error("- If you see ENOTFOUND/querySrv: change DNS to 1.1.1.1 or 8.8.8.8, or try a different network/VPN.");
    console.error("- Ensure Atlas Network Access allows your IP (0.0.0.0/0 for dev).");
    console.error("- If your network blocks SRV lookups, use a standard (non +srv) MongoDB URI or run local Mongo for dev.\n");

    if (process.env.NODE_ENV === 'production') {
      throw lastDbError;
    }
  }

  app.locals.dbReady = dbReady;

  // Keep DB readiness in sync if the connection drops/returns after startup.
  // This prevents hard crashes and lets the API return a clear 503 when Mongo
  // is unavailable.
  mongoose.connection.on('connected', () => {
    app.locals.dbReady = true;
  });
  mongoose.connection.on('disconnected', () => {
    app.locals.dbReady = false;
  });
  mongoose.connection.on('error', (err) => {
    app.locals.dbReady = false;
    console.warn('⚠️ MongoDB connection error:', err?.message || err);
  });

  // Background housekeeping for the subscription/trial feature.
  // Safe and additive: only updates subscription documents when they have naturally expired.
  if (dbReady) {
    startSubscriptionsCron();
  }
  const server = http.createServer(app);

  // Socket.IO (doctor <-> user messaging)
  try {
    const io = initSocket(server, { allowedOrigins: origins });
    app.locals.io = io;
  } catch (e) {
    console.warn('⚠️ Socket.IO failed to start:', e?.message || e);
    app.locals.io = null;
  }

  server.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });

  // Friendly error output for common startup failures
  server.on('error', (err) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use.`);
      console.error('Close the process using that port, or set a different PORT in server/.env.');
      console.error('Example: PORT=5002\n');
      process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
