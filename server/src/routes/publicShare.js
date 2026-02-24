/**
 * Backend route: publicShare
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Express route handlers for the publicShare feature in ShasthoAI (API surface used by the web app).
 *
 * Project-specific notes:
 * - Keep request/response shapes stable — client relies on them.
 */

import express from 'express';
import mongoose from 'mongoose';
import { ReportShareLink } from '../models/ReportShareLink.js';
import { XrayCase } from '../models/XrayCase.js';
import { requireFirebaseAuth } from '../middleware/requireFirebaseAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderNotFound() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Report not available</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; padding:24px; background:#0b0b0c; color:#eaeaea;}
    .card{max-width:880px; margin:0 auto; background:#141416; border:1px solid #2a2a2f; border-radius:14px; padding:20px;}
    a{color:#8ab4f8;}
  </style>
</head>
<body>
  <div class="card">
    <h2>Report not available</h2>
    <p>This share link is invalid, expired, or has been revoked.</p>
  </div>
</body>
</html>`;
}

router.get('/r/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!token) return res.status(404).send(renderNotFound());
    // Token is generated as base64url; reject obviously invalid tokens to avoid unnecessary DB work.
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return res.status(404).send(renderNotFound());

    const link = await ReportShareLink.findOne({ token }).lean();
    if (!link) return res.status(404).send(renderNotFound());
    if (link.revokedAt) return res.status(404).send(renderNotFound());
    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) return res.status(404).send(renderNotFound());

    // Fetch report
    const report = await XrayCase.findOne({ _id: link.xrayCaseId }).lean();
    if (!report) return res.status(404).send(renderNotFound());

    // Best-effort access tracking
    try {
      await ReportShareLink.updateOne(
        { _id: link._id },
        { $inc: { accessCount: 1 }, $set: { lastAccessedAt: new Date() } }
      );
    } catch (_e) {
      // ignore
    }

    const a = report.analysis || {};
    const imgUrl = report.fileUrl ? escapeHtml(report.fileUrl) : '';

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ShasthoAI Report</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; padding:24px; background:#0b0b0c; color:#eaeaea;}
    .wrap{max-width:980px; margin:0 auto;}
    .card{background:#141416; border:1px solid #2a2a2f; border-radius:14px; padding:20px; margin-bottom:16px;}
    .grid{display:grid; grid-template-columns:1fr; gap:16px;}
    @media(min-width:900px){.grid{grid-template-columns:1.2fr 0.8fr;}}
    h1{margin:0 0 8px 0; font-size:22px;}
    .muted{color:#a1a1aa; font-size:13px;}
    .kv{margin-top:10px; font-size:14px; line-height:1.55;}
    .kv b{color:#fff;}
    img{max-width:100%; border-radius:12px; border:1px solid #2a2a2f;}
    ul{margin:8px 0 0 18px;}
    .badge{display:inline-block; padding:4px 10px; border-radius:999px; background:#232327; border:1px solid #2a2a2f; font-size:12px; margin-right:8px;}
    .disclaimer{font-size:12px; color:#9ca3af;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>ShasthoAI — Shared X-ray Report</h1>
      <div class="muted">This link expires on ${escapeHtml(new Date(link.expiresAt).toISOString())} (UTC)</div>
      <div style="margin-top:10px;">
        <span class="badge">Region: ${escapeHtml(a.region ?? 'N/A')}</span>
        <span class="badge">Fracture: ${a.fractureDetected ? 'Likely' : 'Unlikely'}</span>
        <span class="badge">Confidence: ${a.probability != null ? escapeHtml(String(Math.round(Number(a.probability) * 100))) + '%' : 'N/A'}</span>
      </div>
      <p class="disclaimer" style="margin-top:12px;">
        This report is AI-generated and for informational support only. It does not replace a medical professional’s diagnosis.
      </p>
    </div>

    <div class="grid">
      <div class="card">
        ${imgUrl ? `<img src="${imgUrl}" alt="X-ray" />` : `<div class="muted">No image available</div>`}
      </div>
      <div class="card">
        <div class="kv"><b>Fracture Type:</b> ${escapeHtml(a.fractureType ?? 'N/A')}</div>
        <div class="kv"><b>Severity:</b> ${escapeHtml(a.severity ?? 'N/A')}</div>
        <div class="kv"><b>Recovery Timeline:</b> ${escapeHtml(a.recoveryTimeline ?? 'N/A')}</div>
        <div class="kv"><b>Recommendations:</b>
          ${Array.isArray(a.recommendations) && a.recommendations.length ? `<ul>${a.recommendations.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>` : `<div class="muted">N/A</div>`}
        </div>
        <div class="kv"><b>Rehab Exercises:</b>
          ${Array.isArray(a.rehabExercises) && a.rehabExercises.length ? `<ul>${a.rehabExercises.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>` : `<div class="muted">N/A</div>`}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (_err) {
    return res.status(404).send(renderNotFound());
  }
});

// Optional: allow the owner to revoke a link.
router.post('/revoke/:token', requireFirebaseAuth, requireRole(['user']), async (req, res) => {
  const token = String(req.params.token || '').trim();
  if (!token) return res.status(400).json({ error: 'Missing token' });
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return res.status(400).json({ error: 'Invalid token' });

  const link = await ReportShareLink.findOne({ token }).lean();
  if (!link) return res.status(404).json({ error: 'Not found' });
  if (String(link.userUid) !== String(req.user.uid)) return res.status(403).json({ error: 'Forbidden' });

  await ReportShareLink.updateOne({ _id: link._id }, { $set: { revokedAt: new Date() } });
  return res.json({ ok: true });
});

export default router;
