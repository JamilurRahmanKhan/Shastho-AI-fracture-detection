/**
 * Frontend component: AdminTopbar
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useMemo, useState } from "react";
import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useRoleRequestSummary from "@/hooks/useRoleRequestSummary";

export default function AdminTopbar() {
  const { profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  // Poll pending/unseen counts for the notification badge
  const { summary } = useRoleRequestSummary({ pollMs: 20000 });
  const unseen = Number(summary?.unseenPending || 0);

  const initials = useMemo(() => {
    const n = profile?.name || profile?.displayName || "Admin";
    return String(n).trim().charAt(0).toUpperCase() || "A";
  }, [profile]);

  const title = profile?.name || profile?.displayName || "Admin";
  const sub = profile?.email || "System Admin";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users, doctors, hospitals..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" type="button">
          <Bell className="w-5 h-5 text-gray-700" />
          {unseen > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[11px] leading-[18px] rounded-full text-center">
              {unseen > 99 ? "99+" : unseen}
            </span>
          )}
        </button>

        {/* Admin profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">{title}</p>
              <p className="text-xs text-gray-500 leading-tight">{sub}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
              onMouseLeave={() => setOpen(false)}
            >
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout();
                  } finally {
                    setOpen(false);
                  }
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
