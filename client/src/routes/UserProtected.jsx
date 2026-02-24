/**
 * Frontend: UserProtected
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
import { UserRealtimeProvider } from "@/contexts/UserRealtimeContext";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFDFF]">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-3 text-sm text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

export default function UserProtected() {
  const { authUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // User panel is for "user" accounts only. Redirect other roles to their panels
  // to avoid role-based 403s when user-only API endpoints are requested.
  if (role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  if (role === 'pharmacy') return <Navigate to="/pharmacy/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;

  // Mount realtime handlers globally for the user panel (incoming calls + notifications)
  // so users receive events on ANY page as long as they're logged in.
  return (
    <UserRealtimeProvider>
      <Outlet />
    </UserRealtimeProvider>
  );
}
