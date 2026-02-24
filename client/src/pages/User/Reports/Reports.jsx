/**
 * Frontend page: Reports
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, MessageSquare, UploadCloud, Download, Link as LinkIcon } from "lucide-react";
import { api } from "@/services/api";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SubscriptionBanner from "@/components/subscriptions/SubscriptionBanner";
import EpisodeSelector from "@/components/subscriptions/EpisodeSelector";
import EntitlementPaywall from "@/components/subscriptions/EntitlementPaywall";

function mapXrayToReport(doc) {
  const analysis = doc?.analysis || {};
  const prob01 = typeof analysis.probability === "number" ? analysis.probability : null;
  return {
    id: doc?._id || doc?.id,
    episodeId: doc?.episodeId || null,
    createdAt: doc?.createdAt,
    fileName: doc?.originalName || "X-ray",
    fileUrl: doc?.fileUrl || "",
    region: analysis.region || "—",
    fractureDetected: Boolean(analysis.fractureDetected),
    probability: prob01 == null ? null : Math.round(prob01 * 100),
    recoveryTimeline: analysis.recoveryTimeline || "—",
    severity: analysis.severity || "—",
    recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
    rehabExercises: Array.isArray(analysis.rehabExercises) ? analysis.rehabExercises : [],
    premium: doc?.premium || null,
  };
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const sub = useSubscription();
  const snapshot = sub?.snapshot || null;
  const trial = sub?.trial || null;
  const plan = snapshot && sub?.planMap ? sub.planMap.get(snapshot.code) : null;
  const episodes = sub?.episodes || [];
  const [episodeId, setEpisodeId] = useState(sub?.activeEpisodeId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [paywall, setPaywall] = useState(null);

  useEffect(() => {
    setEpisodeId(sub?.activeEpisodeId || "");
  }, [sub?.activeEpisodeId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        setPaywall(null);
        const list = episodeId ? await api.listXrays({ episodeId }) : await api.listXrays();
        const mapped = Array.isArray(list) ? list.map(mapXrayToReport) : [];
        if (mounted) setReports(mapped);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load reports.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [episodeId]);

  const onAskAI = (r) => {
    navigate("/chat", { state: { xrayContext: r } });
  };

  const onExportPdf = async (r) => {
    if (!r?.id) return;
    setPaywall(null);
    try {
      const blob = await api.exportXrayPdf(r.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xray_report_${r.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      await sub?.refresh?.(r.episodeId || episodeId || null);
    } catch (e) {
      if (e?.status === 402) setPaywall(e?.data || { message: e?.message });
      else setError(e?.message || "Failed to export PDF.");
    }
  };

  const onShare = async (r) => {
    if (!r?.id) return;
    setPaywall(null);
    try {
      const resp = await api.createShareLink(r.id);
      const url = resp?.url;
      if (url) {
        await navigator.clipboard?.writeText(url).catch(() => {});
        window.open(url, "_blank", "noopener,noreferrer");
      }
      await sub?.refresh?.(r.episodeId || episodeId || null);
    } catch (e) {
      if (e?.status === 402) setPaywall(e?.data || { message: e?.message });
      else setError(e?.message || "Failed to create share link.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">X-ray History</h1>
            <p className="mt-2 text-slate-600">All of your past X-ray analysis results (read-only when you have no active plan).</p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
            >
              <UploadCloud className="w-4 h-4" />
              AI Chat (Upload)
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {snapshot ? (
          <SubscriptionBanner
            snapshot={snapshot}
            trial={trial}
            plan={plan}
            onActivateTrial={() => sub?.activateTrial?.()}
            busy={sub?.busy}
          />
        ) : null}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <EpisodeSelector
            episodes={episodes}
            value={episodeId}
            onChange={(v) => {
              setEpisodeId(v);
              if (v) sub?.selectEpisode?.(v);
            }}
            label="Episode"
            allowAll={true}
          />
        </div>

        <EntitlementPaywall
          payload={paywall}
          busy={sub?.busy}
          onActivateTrial={trial?.eligible ? () => sub?.activateTrial?.() : null}
          onGoSettings={() => navigate("/settings")}
        />

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-slate-700">Loading…</div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-red-600">{error}</div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">No reports yet</h2>
            </div>
            <p className="mt-2 text-slate-600">Upload an X-ray in AI Chat to generate your first report.</p>
            <Link
              to="/chat"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-blue-700"
            >
              <UploadCloud className="w-4 h-4" />
              Go to AI Chat
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm text-slate-600">File</div>
                    <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      {r.fileName || "X-ray"}
                      {r.premium?.locked ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                          Locked
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</div>
                    {r.fileUrl && (
                      <a href={r.fileUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-blue-700 hover:underline">
                        View image
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onAskAI(r)}
                      disabled={!!r.premium?.locked}
                      title={r.premium?.locked ? "This report is locked for scan-context chat." : ""}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Ask AI
                    </button>

                    <button
                      onClick={() => onExportPdf(r)}
                      disabled={!!r.premium?.locked}
                      title={r.premium?.locked ? "This report is locked for export." : ""}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>

                    <button
                      onClick={() => onShare(r)}
                      disabled={!!r.premium?.locked}
                      title={r.premium?.locked ? "This report is locked for sharing." : ""}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-600">Region</div>
                    <div className="font-semibold text-slate-900">{r.region || "—"}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-600">Fracture</div>
                    <div className={`font-semibold ${r.fractureDetected ? "text-red-600" : "text-emerald-600"}`}>
                      {r.fractureDetected ? "Detected" : "Not detected"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-600">Confidence</div>
                    <div className="font-semibold text-slate-900">{typeof r.probability === "number" ? `${r.probability}%` : "—"}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-600">Recovery</div>
                    <div className="font-semibold text-slate-900">{r.recoveryTimeline || "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-500">
          Note: In production, uploaded images should be stored in a managed object storage (e.g., S3 / GCS) instead of local disk.
        </div>
      </div>
    </div>
  );
}
