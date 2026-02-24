/**
 * Frontend: DoctorRealtimeContext
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

const DoctorRealtimeContext = createContext(null);

export function DoctorRealtimeProvider({ children }) {
  const navigate = useNavigate();
  const { authUser, role } = useAuth();
  const enabled = Boolean(authUser && role === "doctor");

  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null); // { title, message }
  const [callPeerName, setCallPeerName] = useState("Patient");

  // Global (cross-page) incoming call listener for doctors.
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

  // Initial unread count
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
      // Count is also pushed by server via `notification:unreadCount`, but we keep UI snappy.
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

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const modalPeerName = useMemo(() => {
    // If the caller doesn't include a display name, we fallback to role-based labels.
    if (call?.state === "ringing") {
      const fromName = call?.incoming?.from?.name;
      if (fromName) return fromName;
      const fromRole = call?.incoming?.from?.role;
      if (fromRole === "user") return "Patient";
      if (fromRole === "doctor") return "Doctor";
      return "Incoming call";
    }
    return callPeerName || "Patient";
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
    <DoctorRealtimeContext.Provider value={ctx}>
      {children}

      {/* Global video call modal (doctor receives calls on ANY page). */}
      <VideoCallModal call={call} otherName={modalPeerName} />

      {/* Lightweight toast for new notifications */}
      {toast ? (
        <button
          type="button"
          onClick={() => {
            setToast(null);
            navigate("/doctor/notifications");
          }}
          className="fixed z-[70] top-4 right-4 w-[min(92vw,360px)] text-left rounded-2xl border border-slate-200 bg-white shadow-xl p-4 hover:bg-slate-50 transition"
        >
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          {toast.message ? <p className="mt-1 text-sm text-slate-600 line-clamp-2">{toast.message}</p> : null}
          <p className="mt-2 text-xs text-slate-500">Click to open notifications</p>
        </button>
      ) : null}
    </DoctorRealtimeContext.Provider>
  );
}

export function useDoctorRealtime() {
  const ctx = useContext(DoctorRealtimeContext);
  if (!ctx) {
    throw new Error("useDoctorRealtime must be used within DoctorRealtimeProvider");
  }
  return ctx;
}
