/**
 * Frontend: PharmacyProtected
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

export default function PharmacyProtected() {
  const { authUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!authUser) {
    return <Navigate to="/pharmacy/login" replace state={{ from: location.pathname }} />;
  }

  if (role !== "pharmacy") {
    if (role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
