/**
 * Frontend page: PatientProfile
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DoctorSidebar from "@/components/doctor/doctor-sidebar";
import DoctorNavbar from "@/components/doctor/doctor-navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "P";
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function fmtDateTime(d) {
  if (!d) return "—";
  try {
    const x = new Date(d);
    return x.toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export default function DoctorPatientProfile() {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.getDoctorPatient(id);
        if (!mounted) return;
        setPatient(res?.patient || null);
        setAppointments(res?.appointments || []);
      } catch (e) {
        console.warn(e);
        if (mounted) setError(e?.message || "Failed to load patient");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const title = useMemo(() => {
    if (loading) return "Patient";
    return patient?.name ? patient.name : "Patient";
  }, [loading, patient?.name]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} title="Patient" />

        <main className="p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-4">
              <Link to="/doctor/patients">
                <Button variant="outline" className="bg-transparent">← Back to Patients</Button>
              </Link>
            </div>

            {error ? (
              <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            ) : null}

            <Card className="p-6 mb-6">
              {loading ? (
                <div className="text-sm text-gray-600">Loading…</div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
                      {initials(patient?.name)}
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold text-gray-900 truncate">{title}</h1>
                      <p className="text-gray-600 truncate">{patient?.email || "—"}</p>
                      <p className="text-sm text-gray-500 truncate">{patient?.phone || "—"}</p>
                    </div>
                  </div>

                  <Link to="/doctor/messages">
                    <Button className="bg-blue-600 hover:bg-blue-700">✉️ Open Messages</Button>
                  </Link>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Appointment History</h2>
                <Link to="/doctor/appointments">
                  <Button variant="outline" size="sm" className="bg-transparent">View in Appointments</Button>
                </Link>
              </div>

              {loading ? (
                <div className="text-sm text-gray-600">Loading…</div>
              ) : appointments.length === 0 ? (
                <div className="text-sm text-gray-600">No appointments yet.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {appointments.map((a) => (
                    <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{a.type || "Appointment"}</p>
                        <p className="text-sm text-gray-600">{fmtDateTime(a.datetime)}</p>
                        {a.notes ? <p className="text-sm text-gray-500 mt-1">{a.notes}</p> : null}
                      </div>
                      <span
                        className={`inline-flex items-center self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold ${
                          a.status === "completed"
                            ? "bg-teal-100 text-teal-700"
                            : a.status === "scheduled"
                              ? "bg-blue-100 text-blue-700"
                              : a.status === "pending"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {String(a.status || "").toUpperCase()}
                      </span>
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
