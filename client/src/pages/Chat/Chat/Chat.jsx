/**
 * Frontend page: Chat
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatInterface from "../ChatInterface/ChatInterface";
import { api } from "@/services/api";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SubscriptionBanner from "@/components/subscriptions/SubscriptionBanner";
import EpisodeSelector from "@/components/subscriptions/EpisodeSelector";
import EntitlementPaywall from "@/components/subscriptions/EntitlementPaywall";

function mapMsg(m) {
  return {
    id: m?._id || m?.id || `m_${Date.now()}`,
    type: m?.role === "user" ? "user" : "assistant",
    content: m?.content || "",
    timestamp: m?.createdAt || new Date().toISOString(),
    attachments: m?.attachments,
  };
}

function mapXrayToContext(doc) {
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
    fractureType: analysis.fractureType || "—",
    severity: analysis.severity || "—",
    recoveryTimeline: analysis.recoveryTimeline || "—",
    recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
    rehabExercises: Array.isArray(analysis.rehabExercises) ? analysis.rehabExercises : [],
    premium: doc?.premium || null,
  };
}

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const sub = useSubscription();

  const snapshot = sub?.snapshot || null;
  const trial = sub?.trial || null;
  const plan = snapshot && sub?.planMap ? sub.planMap.get(snapshot.code) : null;
  const episodes = sub?.episodes || [];

  const [episodeId, setEpisodeId] = useState(sub?.activeEpisodeId || "");
  const [messages, setMessages] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paywall, setPaywall] = useState(null);

  const [currentScan, setCurrentScan] = useState(null);
  const [scanContextEnabled, setScanContextEnabled] = useState(false);
  const [uploadingScan, setUploadingScan] = useState(false);

  useEffect(() => {
    setEpisodeId(sub?.activeEpisodeId || "");
  }, [sub?.activeEpisodeId]);

  // Clear scan context if it belongs to a different episode than the selected one
  useEffect(() => {
    if (!currentScan?.episodeId || !episodeId) return;
    if (currentScan.episodeId !== episodeId) {
      setCurrentScan(null);
      setScanContextEnabled(false);
    }
  }, [episodeId]); 

  // Load or create default chat session
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const session = await api.getDefaultChatSession();
        if (!mounted) return;
        setChatSessionId(session?._id || session?.id || null);
        const list = session?._id ? await api.listMessages(session._id) : [];
        if (!mounted) return;
        setMessages(Array.isArray(list) ? list.map(mapMsg) : []);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load chat session.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // If navigated from history with scan context, show it inside chat
  useEffect(() => {
    const ctx = location?.state?.xrayContext;
    if (!ctx?.id) return;
    setCurrentScan(ctx);

    // Ensure the selected episode matches the injected report episode
    if (ctx?.episodeId && ctx.episodeId !== episodeId) {
      setEpisodeId(ctx.episodeId);
      sub?.selectEpisode?.(ctx.episodeId);
    }
    if (ctx?.premium?.locked) {
      // Locked reports can't be used for scan-context chat (server will enforce too).
      setScanContextEnabled(false);
      setPaywall({
        actionType: 'CHAT_SCAN_CONTEXT',
        message: 'This report is locked for scan-context chat. Upgrade to unlock.',
      });
    } else {
      setScanContextEnabled(true);
      setPaywall(null);
    }
    setMessages((prev) => {
      const exists = prev.some((m) => m?.kind === "xray_report" && m?.report?.id === ctx.id);
      if (exists) return prev;
      return [
        ...prev,
        {
          id: `ctx_${ctx.id}`,
          type: "assistant",
          kind: "xray_report",
          report: ctx,
          content: "",
          timestamp: new Date().toISOString(),
        },
      ];
    });
    // Clear route state to prevent re-injection on refresh/back
    navigate(location.pathname, { replace: true, state: {} });
  }, [location?.state]);

  const uploadDisabled = useMemo(() => uploadingScan || sub?.busy, [uploadingScan, sub?.busy]);

  const handleUploadXray = async (file) => {
    if (!file) return;
    setPaywall(null);
    setError("");
    try {
      setUploadingScan(true);
      const ensuredEpisodeId = (await sub?.ensureActiveEpisode?.()) || episodeId || sub?.activeEpisodeId || null;
      // Chat uses its own ML-integrated upload endpoint to avoid changing other modules.
      const created = await api.uploadChatXray(file, ensuredEpisodeId);
      const report = mapXrayToContext(created);

      setCurrentScan(report);
      setScanContextEnabled(true);

      const now = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: `u_${Date.now()}`,
          type: "user",
          content: `Uploaded X-ray: ${file.name}`,
          timestamp: now,
        },
        {
          id: `r_${report.id || Date.now()}`,
          type: "assistant",
          kind: "xray_report",
          report,
          content: "",
          timestamp: now,
        },
      ]);

      await sub?.refresh?.(report.episodeId || ensuredEpisodeId || null);
    } catch (e) {
      if (e?.status === 402) setPaywall(e?.data || { message: e?.message });
      else {
        // Surface server-provided debugging details (helps first-time setup).
        const msg =
          (e?.data?.message || e?.message || "Failed to upload X-ray.") +
          (e?.data?.details ? `\n\nDetails: ${String(e.data.details).slice(0, 800)}` : "") +
          (e?.data?.hint ? `\n\nHint: ${String(e.data.hint).slice(0, 600)}` : "");
        setError(msg);
      }
    } finally {
      setUploadingScan(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!chatSessionId) return;
    if (!content || !content.trim()) return;
    setPaywall(null);
    setError("");

    const optimisticId = `local_${Date.now()}`;
    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        type: "user",
        content,
        timestamp: now,
      },
    ]);

    try {
      const xrayCaseId = scanContextEnabled ? currentScan?.id : null;
      const res = await api.sendMessage(chatSessionId, { content, xrayCaseId });
      const assistant = res?.assistant;
      if (assistant) {
        setMessages((prev) => [...prev, mapMsg(assistant)]);
      }
      // Refresh usage counters (scan-context chat is episode-linked; general chat is global)
      await sub?.refresh?.(currentScan?.episodeId || episodeId || null);
    } catch (e) {
      // rollback optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      if (e?.status === 402) setPaywall(e?.data || { message: e?.message });
      else setError(e?.message || "Failed to send message.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">AI Medical Assistant</h1>
          <p className="text-slate-600 text-lg">Chat with our AI for medical guidance and fracture insights</p>
        </div>

        {snapshot ? (
          <div className="mb-6">
            <SubscriptionBanner
              snapshot={snapshot}
              trial={trial}
              plan={plan}
              onActivateTrial={() => sub?.activateTrial?.()}
              busy={sub?.busy}
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <EpisodeSelector
            episodes={episodes}
            value={episodeId}
            onChange={(v) => {
              setEpisodeId(v);
              if (v) sub?.selectEpisode?.(v);
            }}
            label="Episode"
            allowAll={false}
          />

          <button
            type="button"
            onClick={() => navigate("/history")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100"
          >
            View history
          </button>
        </div>

        <EntitlementPaywall
          payload={paywall}
          busy={sub?.busy}
          onActivateTrial={trial?.eligible ? () => sub?.activateTrial?.() : null}
          onGoSettings={() => navigate("/settings")}
        />

        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center">
            <p className="text-slate-600">Loading chat...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-red-600">{error}</div>
        ) : (
          <div className="h-[600px] sm:h-[700px]">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onUploadXray={handleUploadXray}
              uploadDisabled={uploadDisabled}
              scanContext={currentScan}
              scanContextEnabled={scanContextEnabled}
              onToggleScanContext={setScanContextEnabled}
              isEmergencyMode={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
