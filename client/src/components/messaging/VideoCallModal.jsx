/**
 * Frontend component: VideoCallModal
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, PhoneIncoming, PhoneCall } from "lucide-react";

// Reusable video call modal for both User and Doctor panels.
// Uses streams provided by useVideoCall hook.

export default function VideoCallModal({
  call,
  otherName = "",
  hidden = false,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    const lv = localVideoRef.current;
    const rv = remoteVideoRef.current;
    const ra = remoteAudioRef.current;
    if (lv) {
      lv.srcObject = call?.localStream || null;
      // Autoplay can be blocked; try anyway.
      lv.play?.().catch(() => null);
    }
    if (rv) {
      rv.srcObject = call?.remoteStream || null;
      rv.play?.().catch(() => null);
    }
    // Some browsers can be finicky about audio autoplay. Binding remote audio
    // to a dedicated <audio> element improves reliability.
    if (ra) {
      ra.srcObject = call?.remoteStream || null;
      ra.play?.().catch(() => null);
    }
  }, [call?.state, call?.localStream, call?.remoteStream]);

  if (hidden) return null;
  if (!call || call.state === "idle") return null;

  const ringing = call.state === "ringing";
  const calling = call.state === "calling";
  const inCall = call.state === "in_call";

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Top bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Video Call</p>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                {otherName ? otherName : "Call"}
              </h3>
              {ringing ? (
                <p className="text-sm text-slate-600 mt-1">Incoming call…</p>
              ) : calling ? (
                <p className="text-sm text-slate-600 mt-1">Calling…</p>
              ) : (
                <p className="text-sm text-slate-600 mt-1">Connected</p>
              )}
            </div>

            <button
              onClick={call.endCall}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              End
            </button>
          </div>

          {/* Body */}
          <div className="relative bg-slate-900">
            <div className="aspect-video w-full">
              {/* Remote */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Remote audio (hidden) */}
              <audio ref={remoteAudioRef} autoPlay />

              {!call?.remoteStream && inCall ? (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                  Waiting for the other person's video…
                </div>
              ) : null}
            </div>

            {/* Local preview */}
            <div className="absolute bottom-4 right-4 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden border border-white/20 shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* Ringing / calling overlays */}
            {(ringing || calling) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/10 border border-white/20 text-white rounded-2xl px-5 py-4 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    {ringing ? <PhoneIncoming className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
                    <div>
                      <p className="font-semibold">{ringing ? "Incoming call" : "Calling"}</p>
                      <p className="text-sm text-white/80">{otherName || ""}</p>
                    </div>
                  </div>
                  {ringing ? (
                    <div className="mt-4 flex gap-3 justify-end">
                      <button
                        onClick={() => call.rejectCall("rejected")}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm"
                      >
                        Decline
                      </button>
                      <button
                        onClick={call.acceptCall}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                      >
                        Accept
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={call.endCall}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {inCall && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={call.toggleMic}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 flex items-center gap-2"
                >
                  {call.micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span className="text-sm">{call.micOn ? "Mute" : "Unmute"}</span>
                </button>

                <button
                  onClick={call.toggleCam}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 flex items-center gap-2"
                >
                  {call.camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span className="text-sm">{call.camOn ? "Camera" : "Camera off"}</span>
                </button>
              </div>

              <button
                onClick={call.endCall}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                Hang up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
