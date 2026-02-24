/**
 * Frontend: RootLayouts
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../pages/shared/Navbar/Navbar";
import Footer from "../pages/shared/Footer/Footer";
import { DoctorRealtimeProvider } from "@/contexts/DoctorRealtimeContext";
import { UserRealtimeProvider } from "@/contexts/UserRealtimeContext";

const RootLayouts = () => {
  const location = useLocation();
  const pathname = location.pathname || "/";
  const hideNavbar =
    pathname.startsWith("/store") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/pharmacy");
  // const hideFooter = pathname.startsWith('/doctor') || pathname.startsWith('/pharmacy');
  const hideFooter =
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/pharmacy") ||
    // User panel pages (no footer)
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/");

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbar && <Navbar />}

      {/*
              Make the main content take the remaining height so pages like
              /dashboard and /chat don't collapse and cause layout/overlap issues.
            */}
      <main className="flex-1">
        <DoctorRealtimeProvider>
          <UserRealtimeProvider>
            <Outlet />
          </UserRealtimeProvider>
        </DoctorRealtimeProvider>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
};

export default RootLayouts;
