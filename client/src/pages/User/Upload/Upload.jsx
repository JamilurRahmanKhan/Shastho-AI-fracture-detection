/**
 * Frontend page: Upload
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// This route is kept for backwards-compatibility (bookmarks/old links).
// X-ray upload now lives in the AI Chat page.
export default function UploadXrayPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/chat", { replace: true }), 0);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-md w-full">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">X-ray upload moved</h1>
        <p className="text-slate-600 mb-4">Upload your X-ray directly inside the AI Chat to get your report and ask follow-up questions in one place.</p>
        <div className="flex gap-3">
          <Link
            to="/chat"
            className="flex-1 text-center rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            Go to AI Chat
          </Link>
          <Link
            to="/history"
            className="flex-1 text-center rounded-lg border border-slate-200 bg-white text-slate-700 px-4 py-2 hover:bg-slate-100"
          >
            View History
          </Link>
        </div>
      </div>
    </div>
  );
}
