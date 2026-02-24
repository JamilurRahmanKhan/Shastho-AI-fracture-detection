/**
 * Frontend: usePresence
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { getMessagingSocket } from "@/services/messagingSocket";

// Track online/last-seen for a single uid.
// - Uses a REST fetch for initial state
// - Subscribes to Socket.IO updates for real-time status

export default function usePresence(targetUid) {
  const uid = useMemo(() => String(targetUid || "").trim(), [targetUid]);

  const [state, setState] = useState({
    uid,
    online: false,
    lastSeenAt: null,
    loading: !!uid,
  });

  useEffect(() => {
    let mounted = true;
    if (!uid) {
      setState({ uid: "", online: false, lastSeenAt: null, loading: false });
      return () => {};
    }

    setState((s) => ({ ...s, uid, loading: true }));

    (async () => {
      try {
        const p = await api.getPresence(uid);
        if (!mounted) return;
        setState({ uid, online: !!p?.online, lastSeenAt: p?.lastSeenAt || null, loading: false });
      } catch {
        if (!mounted) return;
        setState((s) => ({ ...s, loading: false }));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    let socket;

    (async () => {
      // getMessagingSocket() is async (waits for Firebase token)
      socket = await getMessagingSocket();
      if (!active || !socket) return;

      socket.emit('presence:subscribe', uid, (ack) => {
        if (!active) return;
        if (ack?.ok && ack?.presence) {
          setState((s) => ({
            ...s,
            online: !!ack.presence.online,
            lastSeenAt: ack.presence.lastSeenAt || null,
          }));
        }
      });

      const onUpdate = (p) => {
        if (!p || String(p.uid) !== uid) return;
        setState((s) => ({ ...s, online: !!p.online, lastSeenAt: p.lastSeenAt || null }));
      };

      socket.on('presence:update', onUpdate);

      // store handler so cleanup can remove it even if async finished late
      socket.__presenceOnUpdate = onUpdate;
    })();

    return () => {
      active = false;
      try {
        if (socket) {
          socket.emit('presence:unsubscribe', uid);
          const h = socket.__presenceOnUpdate;
          if (h) socket.off('presence:update', h);
          delete socket.__presenceOnUpdate;
        }
      } catch {
        // ignore
      }
    };
  }, [uid]);

  return state;
}
