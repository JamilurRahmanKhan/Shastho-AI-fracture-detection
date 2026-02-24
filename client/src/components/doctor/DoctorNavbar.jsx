/**
 * Frontend component: DoctorNavbar
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorRealtime } from "@/contexts/DoctorRealtimeContext";

function getInitials(name) {
  const safe = (name || "Doctor").trim();
  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "D";
  const second = (parts[1]?.[0] || parts[0]?.[1] || "").toUpperCase();
  return (first + second).toUpperCase();
}

/**
 * DoctorNavbar
 *
 * Search behavior:
 * - If you pass `onSearchChange`, the input becomes controlled via `searchValue`.
 * - If you omit `onSearchChange`, the navbar keeps its own local query.
 * - `onSearchSubmit` runs on Enter.
 */
export default function DoctorNavbar({
  onMenuClick,
  title = "",
  showSearch = true,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search patients, reports...",
}) {
  const navigate = useNavigate();
  const { authUser, profile } = useAuth();
  const { unreadCount } = useDoctorRealtime();

  const displayName = profile?.name || profile?.displayName || authUser?.displayName || "Doctor";
  const subtitle = profile?.specialty || "Doctor";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const [localQuery, setLocalQuery] = useState("");
  const query = onSearchChange ? (searchValue ?? "") : localQuery;

  const commitQuery = (next) => {
    if (onSearchChange) onSearchChange(next);
    else setLocalQuery(next);
  };

  const submit = () => {
    const q = String(query || "").trim();
    if (onSearchSubmit) onSearchSubmit(q);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>

        <div className="flex-1 mx-4">
          {title ? <p className="mb-2 text-sm font-semibold text-gray-900">{title}</p> : null}

          {showSearch ? (
            <div className="relative max-w-xl">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => commitQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/doctor/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-[18px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Button>

          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-600">{subtitle}</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold leading-none">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
