/**
 * Frontend page: Patients
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DoctorSidebar from "@/components/doctor/doctor-sidebar";
import DoctorNavbar from "@/components/doctor/doctor-navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "P";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const x = new Date(d);
    return x.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "—";
  }
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

export default function DoctorPatients() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [debouncedQ, setDebouncedQ] = useState(q);

  const [items, setItems] = useState([]);

  // Keep local input in sync with URL (e.g., when navigating back)
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    if (urlQ !== q) setQ(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL while typing (replace to avoid history spam)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const trimmed = q.trim();
    if (trimmed) next.set("q", trimmed);
    else next.delete("q");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Debounce search query to reduce API calls
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = async (query) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listDoctorPatients({ q: query || "" });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      console.warn(e);
      setError(e?.message || "Failed to load patients");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.listDoctorPatients({ q: debouncedQ || "" });
        if (!mounted) return;
        setItems(Array.isArray(res?.items) ? res.items : []);
      } catch (e) {
        if (!mounted) return;
        console.warn(e);
        setError(e?.message || "Failed to load patients");
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedQ]);

  const countLabel = useMemo(() => {
    if (loading) return "Loading…";
    return `${items.length} patient${items.length === 1 ? "" : "s"}`;
  }, [loading, items.length]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 overflow-x-hidden">
      <DoctorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 min-h-[100dvh] flex flex-col">
        <DoctorNavbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Patients"
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search by name, email, phone…"
        />

        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Patients</h1>
                <p className="text-slate-600 mt-1">{countLabel}</p>
              </div>

              {/* Mobile helper actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {!!q.trim() && (
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => setQ("")}
                    title="Clear search"
                  >
                    Clear
                  </Button>
                )}
                <Link to="/doctor/appointments">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Appointments</Button>
                </Link>
              </div>
            </div>

            {/* Error */}
            {error ? (
              <div className="mb-5 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">Couldn’t load patients</p>
                  <p className="opacity-90">{error}</p>
                </div>
                <Button
                  variant="outline"
                  className="bg-transparent border-red-200 text-red-700 hover:bg-red-100"
                  onClick={() => load(debouncedQ)}
                >
                  Retry
                </Button>
              </div>
            ) : null}

            <Card className="overflow-hidden border border-slate-200">
              {/* Desktop header row */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <div className="col-span-4">Patient</div>
                <div className="col-span-3">Contact</div>
                <div className="col-span-2">Last visit</div>
                <div className="col-span-2">Appointments</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {/* Loading */}
              {loading ? (
                <div className="p-5 sm:p-6 space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : items.length === 0 ? (
                <div className="p-6 sm:p-8">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-slate-900 font-bold">No patients found</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Patients appear here after you accept an appointment and a chat thread is created.
                      {q.trim() ? " Try a different search term." : ""}
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Link to="/doctor/appointments">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                          Go to appointments
                        </Button>
                      </Link>
                      {!!q.trim() && (
                        <Button
                          variant="outline"
                          className="bg-transparent w-full sm:w-auto"
                          onClick={() => setQ("")}
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {items.map((p) => (
                    <div key={p.uid} className="p-4 sm:px-6 sm:py-4">
                      {/* Mobile card layout */}
                      <div className="md:hidden">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0">
                            {initials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{p.name}</p>
                            <p className="text-sm text-slate-600 truncate">{p.email || "—"}</p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-500">Phone</p>
                            <p className="text-slate-900 truncate">{p.phone || "—"}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-500">Last visit</p>
                            <p className="text-slate-900 truncate">{fmtDate(p.lastVisitAt)}</p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-500">Appointments</p>
                            <p className="text-slate-900">{p.totalAppointments || 0}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-500">Last message</p>
                            <p className="text-slate-900 truncate">
                              {p.lastMessageAt ? fmtDate(p.lastMessageAt) : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Link to={`/doctor/patients/${encodeURIComponent(p.uid)}`}>
                            <Button className="w-full bg-transparent" variant="outline">
                              View patient
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Desktop row layout */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0">
                            {initials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-sm text-slate-600 truncate">{p.email || "—"}</p>
                          </div>
                        </div>

                        <div className="col-span-3 min-w-0">
                          <p className="text-sm text-slate-900 truncate">{p.phone || "—"}</p>
                          <p className="text-xs text-slate-500 truncate">
                            Last message: {p.lastMessageAt ? fmtDate(p.lastMessageAt) : "—"}
                          </p>
                        </div>

                        <div className="col-span-2 text-sm text-slate-900">{fmtDate(p.lastVisitAt)}</div>
                        <div className="col-span-2 text-sm text-slate-900">{p.totalAppointments || 0}</div>

                        <div className="col-span-1 flex justify-end">
                          <Link to={`/doctor/patients/${encodeURIComponent(p.uid)}`}>
                            <Button size="sm" variant="outline" className="bg-transparent">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
