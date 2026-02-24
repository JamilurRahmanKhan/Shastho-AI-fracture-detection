/**
 * Frontend: DoctorProtected
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DoctorRealtimeProvider } from "@/contexts/DoctorRealtimeContext";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-3 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function DoctorProtected() {
  const { authUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!authUser) {
    return <Navigate to="/doctor/login" replace state={{ from: location.pathname }} />;
  }

  if (role !== "doctor") {
    if (role === "pharmacy") return <Navigate to="/pharmacy/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Mount realtime handlers globally for the doctor panel (incoming calls + notifications)
  // so doctors receive events on ANY page as long as they're logged in.
  return (
    <DoctorRealtimeProvider>
      <Outlet />
    </DoctorRealtimeProvider>
  );
}
