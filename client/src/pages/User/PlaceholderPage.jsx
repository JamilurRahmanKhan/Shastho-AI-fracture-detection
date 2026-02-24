/**
 * Frontend page: PlaceholderPage
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";

const TITLES = {
  "/upload": "Upload X-ray",
  "/reports": "My Reports",
  "/profile": "Profile",
  "/settings": "Settings",
  "/analytics": "Analytics",
  "/reviews": "Patient Reviews",
};

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || "Coming Soon";

  return (
    <div className="min-h-screen bg-[#FCFDFF]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-slate-600">
          This feature page is currently a placeholder so links don’t break. You can implement the real UI and APIs
          later.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ul className="list-disc pl-5 text-slate-700 space-y-2">
            <li>Wire this page to real backend data</li>
            <li>Add UI components or reuse existing dashboard components</li>
            <li>Keep the route stable to avoid broken links</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Open AI Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
