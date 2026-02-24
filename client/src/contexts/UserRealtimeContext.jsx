/**
 * Frontend: UserRealtimeContext
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { getMessagingSocket } from "@/services/messagingSocket";
import { useVideoCall } from "@/hooks/useVideoCall";
import VideoCallModal from "@/components/messaging/VideoCallModal";

const UserRealtimeContext = createContext(null);

export function UserRealtimeProvider({ children }) {
  const navigate = useNavigate();
  const { authUser, role } = useAuth();
  const enabled = Boolean(authUser && role === "user");

  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null); // { title, message }
  const [callPeerName, setCallPeerName] = useState("Doctor");

  // Global (cross-page) incoming call listener for users.
  const call = useVideoCall({ threadId: null, enabled });

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await api.getUnreadNotificationCount();
      setUnreadCount(Number(res?.count || 0));
    } catch {
      // non-blocking
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }
    refreshUnreadCount();
  }, [enabled, refreshUnreadCount]);

  // Realtime notifications over Socket.IO
  useEffect(() => {
    if (!enabled) return;
    let socket;
    let mounted = true;

    const onUnreadCount = (p) => {
      if (!mounted) return;
      if (typeof p?.count === "number") setUnreadCount(p.count);
    };

    const onNew = (n) => {
      if (!mounted) return;
      setUnreadCount((c) => c + 1);
      const title = (n?.title || "Notification").toString();
      const message = (n?.message || "").toString();
      setToast({ title, message });
    };

    (async () => {
      socket = await getMessagingSocket();
      if (!socket || !mounted) return;
      socket.on("notification:unreadCount", onUnreadCount);
      socket.on("notification:new", onNew);
    })();

    return () => {
      mounted = false;
      if (socket) {
        socket.off("notification:unreadCount", onUnreadCount);
        socket.off("notification:new", onNew);
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const modalPeerName = useMemo(() => {
    if (call?.state === "ringing") {
      const fromName = call?.incoming?.from?.name;
      if (fromName) return fromName;
      const fromRole = call?.incoming?.from?.role;
      if (fromRole === "doctor") return "Doctor";
      if (fromRole === "user") return "User";
      return "Incoming call";
    }
    return callPeerName || "Doctor";
  }, [call?.incoming, call?.state, callPeerName]);

  const ctx = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
      call,
      setCallPeerName,
    }),
    [unreadCount, refreshUnreadCount, call]
  );

  return (
    <UserRealtimeContext.Provider value={ctx}>
      {children}

      {/* Global video call modal (user receives calls on ANY page). */}
      <VideoCallModal call={call} otherName={modalPeerName} />

      {toast ? (
        <button
          type="button"
          onClick={() => {
            setToast(null);
            navigate("/notifications");
          }}
          className="fixed z-[70] top-4 right-4 w-[min(92vw,360px)] text-left rounded-2xl border border-slate-200 bg-white shadow-xl p-4 hover:bg-slate-50 transition"
        >
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          {toast.message ? <p className="mt-1 text-sm text-slate-600 line-clamp-2">{toast.message}</p> : null}
          <p className="mt-2 text-xs text-slate-500">Click to open notifications</p>
        </button>
      ) : null}
    </UserRealtimeContext.Provider>
  );
}

export function useUserRealtime() {
  const ctx = useContext(UserRealtimeContext);
  if (!ctx) throw new Error("useUserRealtime must be used within UserRealtimeProvider");
  return ctx;
}
