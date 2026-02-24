/**
 * Frontend: SubscriptionContext
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

// Persisted key for user's current episode selection (user role only)
const STORAGE_KEY = "shasthoai_active_episode";

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function normalizeEpisodeId(v) {
  if (!v) return null;
  const s = String(v).trim();
  return s ? s : null;
}

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { authUser, role, loading } = useAuth();

  const [episodes, setEpisodes] = useState([]);
  const [activeEpisodeId, setActiveEpisodeId] = useState(() => normalizeEpisodeId(safeLocalStorageGet(STORAGE_KEY)));
  const [state, setState] = useState(null); // /subscriptions/me payload
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isUser = Boolean(authUser?.uid) && role === "user";

  const refresh = useCallback(
    async (episodeId = null) => {
      if (!isUser) return null;
      const eid = normalizeEpisodeId(episodeId ?? activeEpisodeId);
      setError("");
      try {
        const [me, eps] = await Promise.all([
          api.getMySubscriptionState(eid),
          api.listEpisodes({ status: "open" }).catch(() => []),
        ]);
        setState(me || null);
        setEpisodes(Array.isArray(eps) ? eps : []);
        return me;
      } catch (e) {
        setError(e?.message || "Failed to load subscription state.");
        return null;
      }
    },
    [activeEpisodeId, isUser]
  );

  const refreshPlans = useCallback(async () => {
    if (!isUser) return;
    try {
      const resp = await api.getSubscriptionPlans();
      const list = Array.isArray(resp) ? resp : resp?.plans;
      setPlans(Array.isArray(list) ? list : []);
    } catch {
      // plans are optional for now (UI only)
    }
  }, [isUser]);

  const selectEpisode = useCallback(
    async (episodeId) => {
      const eid = normalizeEpisodeId(episodeId);
      setActiveEpisodeId(eid);
      safeLocalStorageSet(STORAGE_KEY, eid);
      await refresh(eid);
    },
    [refresh]
  );

  const ensureActiveEpisode = useCallback(async () => {
    if (!isUser) return null;
    const eid = normalizeEpisodeId(activeEpisodeId);
    if (eid) return eid;
    try {
      const def = await api.getDefaultEpisode();
      const did = normalizeEpisodeId(def?._id || def?.id);
      if (did) {
        setActiveEpisodeId(did);
        safeLocalStorageSet(STORAGE_KEY, did);
        return did;
      }
    } catch {
      // ignore
    }
    return null;
  }, [activeEpisodeId, isUser]);

  const activateTrial = useCallback(async () => {
    if (!isUser) return null;
    setBusy(true);
    setError("");
    try {
      const resp = await api.activateFreeThreeDays();
      // server returns { episode: { id }, trial: { episodeId } }
      const trialEpisodeId = normalizeEpisodeId(
        resp?.episode?.id || resp?.episode?._id || resp?.trial?.episodeId
      );
      if (trialEpisodeId) {
        setActiveEpisodeId(trialEpisodeId);
        safeLocalStorageSet(STORAGE_KEY, trialEpisodeId);
      }
      await refresh(trialEpisodeId);
      return resp;
    } catch (e) {
      setError(e?.message || "Failed to activate trial.");
      return null;
    } finally {
      setBusy(false);
    }
  }, [isUser, refresh]);

  // Boot: load plans + current state once user auth is ready
  
  // 🔁 Validate stored episodeId belongs to user
  useEffect(() => {
    if (!isUser) return;
    (async () => {
      try {
        const episodes = await api.listEpisodes({ status: "open" });
        const ids = (episodes || []).map(e => normalizeEpisodeId(e.id || e._id));
        if (activeEpisodeId && !ids.includes(activeEpisodeId)) {
          safeLocalStorageSet(STORAGE_KEY, "");
          setActiveEpisodeId(null);
        }
      } catch {}
    })();
  }, [isUser]);

useEffect(() => {
    if (loading) return;
    if (!isUser) {
      // reset when leaving user role
      setState(null);
      setEpisodes([]);
      setPlans([]);
      return;
    }
    (async () => {
      const eid = await ensureActiveEpisode();
      await Promise.all([refresh(eid), refreshPlans()]);
    })();
  }, [loading, isUser, ensureActiveEpisode, refresh, refreshPlans]);

  const planMap = useMemo(() => {
    const m = new Map();
    for (const p of plans || []) {
      if (p?.code) m.set(String(p.code), p);
    }
    return m;
  }, [plans]);

  const snapshot = state?.snapshot || null;
  const trial = state?.trial || null;
  const wallet = state?.wallet || null;

  const value = useMemo(
    () => ({
      loading: Boolean(loading) || (isUser && !state && !error),
      busy,
      error,
      state,
      snapshot,
      trial,
      wallet,
      plans,
      planMap,
      episodes,
      activeEpisodeId,
      refresh,
      selectEpisode,
      activateTrial,
      ensureActiveEpisode,
    }),
    [
      loading,
      busy,
      error,
      state,
      snapshot,
      trial,
      wallet,
      plans,
      planMap,
      episodes,
      activeEpisodeId,
      refresh,
      selectEpisode,
      activateTrial,
      ensureActiveEpisode,
      isUser,
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
