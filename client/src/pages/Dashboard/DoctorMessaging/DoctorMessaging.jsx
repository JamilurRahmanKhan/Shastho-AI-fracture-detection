/**
 * Frontend page: DoctorMessaging
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Backward-compat route: older UI opened messages from an appointment card.
// We now use a single Messenger-like inbox for users.

export default function DoctorMessagingRedirect() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();

  useEffect(() => {
    if (appointmentId) {
      navigate(`/dashboard/messages?appointmentId=${encodeURIComponent(appointmentId)}`, { replace: true });
    } else {
      navigate("/dashboard/messages", { replace: true });
    }
  }, [appointmentId, navigate]);

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center text-slate-600">Loading…</div>
  );
}
