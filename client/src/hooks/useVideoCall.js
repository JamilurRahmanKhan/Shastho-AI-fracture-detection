/**
 * Frontend: useVideoCall
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getMessagingSocket } from "@/services/messagingSocket";

// Portfolio-grade 1:1 video calling using WebRTC + Socket.IO signaling.
// - Signaling events are relayed by the backend: call:offer/call:answer/call:ice/call:end/call:reject
// - This uses free STUN servers for connectivity. For production, you would add TURN.

function createCallId(threadId) {
  try {
    return `call_${threadId}_${crypto.randomUUID()}`;
  } catch {
    return `call_${threadId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

export function useVideoCall({ threadId: defaultThreadId, enabled }) {
  const [state, setState] = useState("idle"); // idle | calling | ringing | in_call
  const [error, setError] = useState("");
  const [incoming, setIncoming] = useState(null); // { threadId, callId, from, offer }

  // The hook can be used in two ways:
  // 1) Per-thread (pass threadId) - same behavior as before.
  // 2) Global listener (pass threadId=null) - accepts calls for any thread
  //    and stores the active thread id in a ref.
  const activeThreadIdRef = useRef(defaultThreadId || null);

  // Keep streams in state so the UI re-renders when the remote track arrives.
  // Using only refs means the modal might never update even though the connection is fine.
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const callIdRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceRef = useRef([]);
  const disconnectedTimerRef = useRef(null);

  const cleanup = useCallback(async () => {
    try {
      if (disconnectedTimerRef.current) {
        clearTimeout(disconnectedTimerRef.current);
        disconnectedTimerRef.current = null;
      }
      pendingIceRef.current = [];
      if (pcRef.current) {
        try {
          pcRef.current.onicecandidate = null;
          pcRef.current.ontrack = null;
          pcRef.current.onconnectionstatechange = null;
          pcRef.current.oniceconnectionstatechange = null;
          pcRef.current.close();
        } catch {
          // ignore
        }
      }
      pcRef.current = null;
      callIdRef.current = null;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      setIncoming(null);
      setState("idle");
    } catch {
      // ignore
    }
  }, []);

  const ensureSocket = useCallback(async () => {
    const s = await getMessagingSocket();
    socketRef.current = s;
    return s;
  }, []);

  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = async (ev) => {
      if (!ev.candidate) return;
      const socket = socketRef.current || (await ensureSocket());
      const tid = activeThreadIdRef.current || defaultThreadId;
      if (!socket || !callIdRef.current || !tid) return;
      // Some browsers serialize RTCIceCandidate poorly unless converted to JSON.
      const candidate = ev.candidate?.toJSON ? ev.candidate.toJSON() : ev.candidate;
      socket.emit("call:ice", { threadId: tid, callId: callIdRef.current, candidate });
    };

    pc.ontrack = (ev) => {
      // Some browsers don't always populate ev.streams.
      // Build a MediaStream from tracks to ensure we always have a playable stream.
      const streamFromEvent = ev.streams && ev.streams[0] ? ev.streams[0] : null;
      if (streamFromEvent) {
        remoteStreamRef.current = streamFromEvent;
        setRemoteStream(streamFromEvent);
        return;
      }

      if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
      try {
        remoteStreamRef.current.addTrack(ev.track);
      } catch {
        // ignore
      }
      setRemoteStream(remoteStreamRef.current);
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      // Keep UI honest: only say "Connected" when the peer connection is actually connected.
      if (st === "connected") {
        if (disconnectedTimerRef.current) {
          clearTimeout(disconnectedTimerRef.current);
          disconnectedTimerRef.current = null;
        }
        setState((prev) => (prev === "idle" ? prev : "in_call"));
      }
      if (st === "failed") {
        // Attempt ICE restart once for better reliability.
        try {
          pc.restartIce?.();
        } catch {
          // ignore
        }
      }
      if (st === "disconnected") {
        // Disconnections can be transient (Wi-Fi change, tab backgrounding).
        // Give it a few seconds before tearing the call down.
        if (!disconnectedTimerRef.current) {
          disconnectedTimerRef.current = setTimeout(() => {
            disconnectedTimerRef.current = null;
            cleanup();
          }, 6000);
        }
      }
      if (st === "failed") {
        // If ICE restart doesn't recover quickly, end the call.
        if (!disconnectedTimerRef.current) {
          disconnectedTimerRef.current = setTimeout(() => {
            disconnectedTimerRef.current = null;
            cleanup();
          }, 1500);
        }
      }
      if (st === "closed") {
        cleanup();
      }
    };

    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState;
      if (st === "failed") {
        try {
          pc.restartIce?.();
        } catch {
          // ignore
        }
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanup, ensureSocket, defaultThreadId]);

  const getMedia = useCallback(async () => {
    setError("");
    try {
      // Request both video + audio with common processing constraints.
      // (Browser may ignore some constraints; that's fine.)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicOn(true);
      setCamOn(true);
      return stream;
    } catch (e) {
      const msg = e?.message || "Camera/microphone permission denied";
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const attachTracks = useCallback(
    async (pc) => {
      const stream = localStreamRef.current || (await getMedia());
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    },
    [getMedia]
  );

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    if (!pendingIceRef.current.length) return;
    const items = [...pendingIceRef.current];
    pendingIceRef.current = [];
    for (const c of items) {
      try {
        await pc.addIceCandidate(c);
      } catch {
        // ignore
      }
    }
  }, []);

  const startCall = useCallback(async (overrideThreadId = null) => {
    const tid = overrideThreadId || defaultThreadId || activeThreadIdRef.current;
    if (!enabled || !tid) return;
    if (state !== "idle") return;
    const socket = await ensureSocket();
    if (!socket) return;

    setState("calling");
    activeThreadIdRef.current = tid;
    const callId = createCallId(tid);
    callIdRef.current = callId;

    try {
      const pc = await ensurePeerConnection();
      await attachTracks(pc);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);

      const ack = await new Promise((resolve) => {
        socket.emit("call:offer", { threadId: tid, callId, offer }, (a) => resolve(a));
      });
      if (!ack?.ok) throw new Error(ack?.error || "Failed to start call");

      // Wait for answer
    } catch (e) {
      setError(e?.message || "Failed to start call");
      await cleanup();
    }
  }, [attachTracks, cleanup, enabled, ensurePeerConnection, ensureSocket, state, defaultThreadId]);


  const acceptCall = useCallback(async () => {
    if (!enabled) return;
    if (!incoming?.callId || !incoming?.offer) return;

    const tid = incoming?.threadId || activeThreadIdRef.current || defaultThreadId;
    if (!tid) return;

    const socket = await ensureSocket();
    if (!socket) return;

    try {
      // Standard WebRTC answer flow:
      // 1) setRemoteDescription(offer)
      // 2) attach local tracks
      // 3) createAnswer + setLocalDescription
      // This order avoids "negotiation" edge cases in some browsers.
      setState("in_call");
      callIdRef.current = incoming.callId;
      const pc = await ensurePeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));
      await attachTracks(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await flushPendingIce();

      const ack = await new Promise((resolve) => {
        socket.emit("call:answer", { threadId: tid, callId: incoming.callId, answer }, (a) => resolve(a));
      });
      if (!ack?.ok) throw new Error(ack?.error || "Failed to answer call");
      setIncoming(null);
    } catch (e) {
      setError(e?.message || "Failed to accept call");
      await cleanup();
    }
  }, [attachTracks, cleanup, enabled, ensurePeerConnection, ensureSocket, flushPendingIce, incoming, defaultThreadId]);

  const rejectCall = useCallback(
    async (reason = "rejected") => {
      try {
        const socket = await ensureSocket();
        const tid = incoming?.threadId || activeThreadIdRef.current || defaultThreadId;
        if (socket && incoming?.callId && tid) {
          socket.emit("call:reject", { threadId: tid, callId: incoming.callId, reason });
        }
      } finally {
        await cleanup();
      }
    },
    [cleanup, ensureSocket, incoming, defaultThreadId]
  );

  const endCall = useCallback(async () => {
    try {
      const socket = await ensureSocket();
      const tid = incoming?.threadId || activeThreadIdRef.current || defaultThreadId;
      if (socket && callIdRef.current && tid) {
        socket.emit("call:end", { threadId: tid, callId: callIdRef.current });
      }
    } finally {
      await cleanup();
    }
  }, [cleanup, ensureSocket, incoming, defaultThreadId]);

  const toggleMic = useCallback(() => {
    const s = localStreamRef.current;
    if (!s) return;
    const tracks = s.getAudioTracks();
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setMicOn(tracks.some((t) => t.enabled));
  }, []);

  const toggleCam = useCallback(() => {
    const s = localStreamRef.current;
    if (!s) return;
    const tracks = s.getVideoTracks();
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setCamOn(tracks.some((t) => t.enabled));
  }, []);

  // Listen for signaling events
  useEffect(() => {
    let mounted = true;
    let socket;

    const onOffer = async (p) => {
      if (!mounted) return;
      // If a specific threadId is provided, only accept offers for that thread.
      // If threadId is null, we act as a global listener for any incoming call.
      if (defaultThreadId && String(p?.threadId) !== String(defaultThreadId)) return;

      // If busy, immediately reject
      if (state !== "idle") {
        const s = socketRef.current;
        if (s && p?.callId) {
          s.emit("call:reject", { threadId: p?.threadId, callId: p.callId, reason: "busy" });
        }
        return;
      }


      // IMPORTANT: set callId immediately so we can buffer ICE candidates
      // that may arrive before the callee clicks "Accept".
      callIdRef.current = p.callId;
      pendingIceRef.current = [];
      remoteStreamRef.current = null;
      setRemoteStream(null);
      activeThreadIdRef.current = p?.threadId ? String(p.threadId) : activeThreadIdRef.current;
      setIncoming({ threadId: p?.threadId ? String(p.threadId) : null, callId: p.callId, from: p.from, offer: p.offer });
      setState("ringing");
    };

    const onAnswer = async (p) => {
      if (!mounted) return;
      const tid = defaultThreadId || activeThreadIdRef.current;
      if (tid && String(p?.threadId) !== String(tid)) return;
      if (!callIdRef.current || String(p?.callId) !== String(callIdRef.current)) return;
      try {
        const pc = await ensurePeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(p.answer));
        await flushPendingIce();
        setState("in_call");
      } catch (e) {
        setError(e?.message || "Failed to connect call");
        await cleanup();
      }
    };

    const onIce = async (p) => {
      if (!mounted) return;
      const tid = defaultThreadId || activeThreadIdRef.current;
      if (tid && String(p?.threadId) !== String(tid)) return;
      if (!callIdRef.current || String(p?.callId) !== String(callIdRef.current)) return;
      try {
        const candidate = new RTCIceCandidate(p.candidate);
        const pc = pcRef.current;
        if (!pc || !pc.remoteDescription) {
          pendingIceRef.current.push(candidate);
          return;
        }
        await pc.addIceCandidate(candidate);
      } catch {
        // ignore
      }
    };

    const onEnd = async (p) => {
      if (!mounted) return;
      const tid = defaultThreadId || activeThreadIdRef.current;
      if (tid && String(p?.threadId) !== String(tid)) return;
      if (!callIdRef.current || String(p?.callId) !== String(callIdRef.current)) return;
      await cleanup();
    };

    const onReject = async (p) => {
      if (!mounted) return;
      const tid = defaultThreadId || activeThreadIdRef.current;
      if (tid && String(p?.threadId) !== String(tid)) return;
      if (!callIdRef.current || String(p?.callId) !== String(callIdRef.current)) return;
      setError(p?.reason === "busy" ? "The other person is busy." : "Call rejected." );
      await cleanup();
    };

    (async () => {
      socket = await ensureSocket();
      if (!socket || !mounted) return;
      socket.on("call:offer", onOffer);
      socket.on("call:answer", onAnswer);
      socket.on("call:ice", onIce);
      socket.on("call:end", onEnd);
      socket.on("call:reject", onReject);
    })();

    return () => {
      mounted = false;
      if (socket) {
        socket.off("call:offer", onOffer);
        socket.off("call:answer", onAnswer);
        socket.off("call:ice", onIce);
        socket.off("call:end", onEnd);
        socket.off("call:reject", onReject);
      }
    };
  }, [cleanup, ensurePeerConnection, ensureSocket, flushPendingIce, state, defaultThreadId]);

  // When a per-thread instance changes thread, cleanup any call state.
  // (For global listener instances, defaultThreadId is null and this runs once.)
  useEffect(() => {
    cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultThreadId]);

  return {
    state,
    error,
    incoming,
    micOn,
    camOn,
    localStream,
    remoteStream,
    localStreamRef,
    remoteStreamRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCam,
    clearError: () => setError(""),
  };
}
