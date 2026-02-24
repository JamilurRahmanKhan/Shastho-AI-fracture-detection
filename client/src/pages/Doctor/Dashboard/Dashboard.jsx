/**
 * Frontend page: Dashboard
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DoctorSidebar from "@/components/doctor/doctor-sidebar";
import DoctorNavbar from "@/components/doctor/doctor-navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

function fmtTime(d) {
  try {
    const x = new Date(d);
    return x.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Simple skeleton block for loading */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

/** Stat tile with optional click */
function StatCard({ label, value, hint, href, loading }) {
  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { to: href } : {};
  return (
    <Wrapper {...wrapperProps} className={href ? "block" : ""}>
      <Card
        className={[
          "p-5 h-full transition",
          href ? "hover:border-blue-200 hover:shadow-sm cursor-pointer" : "",
        ].join(" ")}
      >
        <p className="text-sm text-slate-600">{label}</p>
        <div className="mt-2">
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-2xl font-extrabold text-slate-900">{value}</p>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{hint}</p>
      </Card>
    </Wrapper>
  );
}

export default function DoctorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [navbarSearch, setNavbarSearch] = useState("");
  const { profile, authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.getDoctorDashboard();
      setData(res);
    } catch (e) {
      console.warn(e);
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.getDoctorDashboard();
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const doctorName = useMemo(() => {
    return data?.doctorName || profile?.name || authUser?.displayName || "Doctor";
  }, [data?.doctorName, profile?.name, authUser?.displayName]);

  const upcomingToday = useMemo(() => {
    return Array.isArray(data?.upcomingToday) ? data.upcomingToday : [];
  }, [data?.upcomingToday]);

  const filteredUpcomingToday = useMemo(() => {
    const q = navbarSearch.trim().toLowerCase();
    if (!q) return upcomingToday;
    return upcomingToday.filter((a) =>
      `${a?.patientName || ""} ${a?.type || ""} ${fmtTime(a?.datetime)} ${a?.status || ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [upcomingToday, navbarSearch]);

  const stats = data?.stats || {
    totalPatients: 0,
    pendingAppointments: 0,
    upcomingToday: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 overflow-x-hidden">
      <DoctorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 min-h-[100dvh] flex flex-col">
        <DoctorNavbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Dashboard"
          searchValue={navbarSearch}
          onSearchChange={setNavbarSearch}
          onSearchSubmit={(q) =>
            navigate(`/doctor/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`)
          }
        />

        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Dashboard
                </h1>
                <p className="text-slate-600 mt-1">
                  Welcome back, <span className="font-semibold text-slate-800">{doctorName}</span>
                </p>
              </div>

              {/* Header actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => navigate("/doctor/messages")}
                >
                  ✉️ Open Messages
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate("/doctor/appointments")}
                >
                  📅 View Appointments
                </Button>
              </div>
            </div>

            {/* Error */}
            {error ? (
              <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">Dashboard couldn’t load</p>
                  <p className="opacity-90">{error}</p>
                </div>
                <Button
                  variant="outline"
                  className="bg-transparent border-red-200 text-red-700 hover:bg-red-100"
                  onClick={load}
                >
                  Retry
                </Button>
              </div>
            ) : null}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
              <StatCard
                label="Total Patients"
                value={stats.totalPatients}
                hint="Unique patients connected to you"
                href="/doctor/patients"
                loading={loading}
              />
              <StatCard
                label="Pending Appointments"
                value={stats.pendingAppointments}
                hint="Awaiting your approval/action"
                href="/doctor/appointments?tab=pending"
                loading={loading}
              />
              <StatCard
                label="Today's Appointments"
                value={stats.upcomingToday}
                hint="Scheduled for today"
                href="/doctor/appointments"
                loading={loading}
              />
              <StatCard
                label="Unread Messages"
                value={stats.unreadMessages}
                hint="Across all conversations"
                href="/doctor/messages"
                loading={loading}
              />
              <StatCard
                label="New Notifications"
                value={stats.unreadNotifications}
                hint="Not yet read"
                href="/doctor/notifications"
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Today schedule */}
              <Card className="lg:col-span-2 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-extrabold text-slate-900">Today&apos;s Schedule</h2>
                  <Link to="/doctor/appointments">
                    <Button variant="outline" size="sm" className="bg-transparent w-full sm:w-auto">
                      View appointments
                    </Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : upcomingToday.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
                    <p className="font-semibold text-slate-900">No appointments scheduled today</p>
                    <p className="text-sm text-slate-600 mt-1">
                      You&apos;re all clear. Check upcoming appointments anytime.
                    </p>
                    <div className="mt-4">
                      <Link to="/doctor/appointments">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Go to appointments</Button>
                      </Link>
                    </div>
                  </div>
                ) : filteredUpcomingToday.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
                    <p className="font-semibold text-slate-900">No matches found</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Nothing in today&apos;s schedule matched “{navbarSearch}”.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUpcomingToday.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm transition"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{a.patientName}</p>
                          <p className="text-sm text-slate-600 truncate">{a.type || "Appointment"}</p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-slate-900">{fmtTime(a.datetime)}</p>
                          <p className="text-xs text-slate-500">{a.status || "Scheduled"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Quick actions */}
              <Card className="p-5">
                <h2 className="text-lg font-extrabold text-slate-900 mb-4">Quick Actions</h2>

                <div className="space-y-3">
                  <Link to="/doctor/appointments" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      📅 Appointments
                    </Button>
                  </Link>
                  <Link to="/doctor/patients" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      👥 Patients
                    </Button>
                  </Link>
                  <Link to="/doctor/messages" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      ✉️ Messages
                    </Button>
                  </Link>
                  <Link to="/doctor/notifications" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      🔔 Notifications
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">Tip</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Use the dashboard search to quickly jump to a patient. Press Enter to open Patients.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
