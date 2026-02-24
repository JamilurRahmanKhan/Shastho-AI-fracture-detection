/**
 * Frontend page: AppointmentsTab
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Video,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { CalendarDays, Clock3, Stethoscope, ChevronDown } from "lucide-react";
import { api } from "@/services/api";

function toInputDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toInputTime(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildMapsUrl({ mapsUrl, lat, lng, address }) {
  const direct = (mapsUrl || "").toString().trim();
  if (direct) return direct;
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const dest = hasCoords ? `${lat},${lng}` : (address || "").toString().trim();
  if (!dest) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    dest
  )}`;
}

/**
 * AppointmentsTab Component
 *
 * Displays and manages healthcare appointments with responsive design.
 * Supports video, phone, and in-person appointment types with appropriate actions.
 *
 * @param {Object} props - Component props
 * @param {Array} props.appointments - Array of appointment objects
 * @param {string} props.appointments[].id - Unique appointment identifier
 * @param {string} props.appointments[].doctorName - Name of the healthcare provider
 * @param {string} props.appointments[].specialty - Medical specialty of the doctor
 * @param {string} props.appointments[].date - Appointment date
 * @param {string} props.appointments[].time - Appointment time
 * @param {string} props.appointments[].type - Type of appointment: "video" | "phone" | "in-person"
 * @param {string} props.appointments[].status - Appointment status: "scheduled" | "completed" | "cancelled" | "rescheduled"
 * @param {string} props.appointments[].location - Physical location (for in-person appointments)
 * @param {string} props.appointments[].notes - Additional appointment notes
 *
 * @returns {JSX.Element} Responsive appointments management interface
 */
const AppointmentsTab = ({ appointments = [], onAppointmentsChanged }) => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState("");

  const [booking, setBooking] = useState({
    doctorUid: "",
    date: "",
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleSuccess, setRescheduleSuccess] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingDoctors(true);
        setDoctorError("");
        const list = await api.listDoctors();
        if (!mounted) return;
        setDoctors(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setDoctorError(e?.message || "Failed to load doctors");
        setDoctors([]);
      } finally {
        if (mounted) setLoadingDoctors(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => d.uid === booking.doctorUid) || null;
  }, [doctors, booking.doctorUid]);

  const canSubmit =
    Boolean(booking.doctorUid && booking.date && booking.time) && !submitting;

  const handleBook = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      // Combine date+time into an ISO string.
      // Note: 'YYYY-MM-DDTHH:mm' is treated as local time by browsers.
      const dt = new Date(`${booking.date}T${booking.time}:00`);
      if (Number.isNaN(dt.getTime())) {
        throw new Error("Invalid date/time");
      }

      await api.createAppointment({
        doctorUid: booking.doctorUid,
        doctorName: selectedDoctor?.name || "Doctor",
        doctorEmail: selectedDoctor?.email || "",
        department: selectedDoctor?.department || "",
        location: selectedDoctor?.location || "",
        type: "in-person",
        datetime: dt.toISOString(),
        notes: booking.notes || "",
      });

      setSubmitSuccess(
        "Appointment request sent. You'll be notified when the doctor accepts or rejects it."
      );
      setBooking((b) => ({ ...b, time: "", notes: "" }));

      // Refresh appointments in parent (pulls from DB)
      if (typeof onAppointmentsChanged === "function") {
        await onAppointmentsChanged();
      }
    } catch (err) {
      setSubmitError(err?.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const openReschedule = (appointment) => {
    if (!appointment?.id) return;
    const dt = appointment.datetime ? new Date(appointment.datetime) : null;
    setRescheduleTarget(appointment);
    setRescheduleDate(dt ? toInputDate(dt) : "");
    setRescheduleTime(dt ? toInputTime(dt) : "");
    setRescheduleError("");
    setRescheduleSuccess("");
    setRescheduleOpen(true);
  };

  const closeReschedule = () => {
    if (rescheduleSaving) return;
    setRescheduleOpen(false);
    setRescheduleTarget(null);
    setRescheduleError("");
    setRescheduleSuccess("");
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget?.id) return;
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError("Please choose a date and time");
      return;
    }

    setRescheduleSaving(true);
    setRescheduleError("");
    setRescheduleSuccess("");

    try {
      const dt = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      if (Number.isNaN(dt.getTime())) throw new Error("Invalid date/time");

      await api.updateAppointment(rescheduleTarget.id, {
        datetime: dt.toISOString(),
      });
      setRescheduleSuccess("Appointment rescheduled successfully.");

      if (typeof onAppointmentsChanged === "function") {
        await onAppointmentsChanged();
      }

      // Close after a short tick so users can see the success message
      setTimeout(() => {
        closeReschedule();
      }, 600);
    } catch (err) {
      setRescheduleError(err?.message || "Failed to reschedule");
    } finally {
      setRescheduleSaving(false);
    }
  };

  const openDirections = (appointment) => {
    const doc = doctors.find((d) => d.uid === appointment?.doctorUid) || null;
    const url = buildMapsUrl({
      mapsUrl: doc?.mapsUrl,
      lat: doc?.locationLat,
      lng: doc?.locationLng,
      address: doc?.location || appointment?.location || "",
    });
    if (!url) {
      window.alert("Doctor location is not set yet. Please try again later.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCancel = async (appointment) => {
    if (!appointment?.id) return;
    const ok = window.confirm("Cancel this appointment request?");
    if (!ok) return;
    try {
      await api.updateAppointment(appointment.id, { status: "cancelled" });
      if (typeof onAppointmentsChanged === "function") {
        await onAppointmentsChanged();
      }
    } catch (e) {
      window.alert(e?.message || "Failed to cancel");
    }
  };

  const handleMessageDoctor = (appointment) => {
    if (!appointment?.id) return;
    if (
      appointment.status !== "scheduled" &&
      appointment.status !== "accepted"
    ) {
      window.alert(
        "Messaging is available only after the doctor accepts your request."
      );
      return;
    }
    navigate(`/dashboard/appointments/${appointment.id}/message`);
  };
  return (
    <div className="space-y-8 p-6">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-100 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
        </div>
        <p className="text-slate-600 text-base ml-11">
          Schedule and manage your healthcare appointments
        </p>
      </div>

      {/* Book Appointment Card */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm p-6">
        <form onSubmit={handleBook} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Healthcare Provider */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Healthcare Provider <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                {/* left icon */}
                <Stethoscope className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                {/* right chevron */}
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <select
                  className="w-full appearance-none pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
                     transition-colors"
                  value={booking.doctorUid}
                  onChange={(e) =>
                    setBooking((b) => ({ ...b, doctorUid: e.target.value }))
                  }
                  disabled={loadingDoctors}
                  required
                >
                  <option value="" disabled>
                    {loadingDoctors ? "Loading doctors..." : "Select a doctor"}
                  </option>

                  {/* Optional: group by department (still standard HTML, no backend change) */}
                  {(() => {
                    const groups = doctors.reduce((acc, d) => {
                      const key = d.department || "Other";
                      (acc[key] ||= []).push(d);
                      return acc;
                    }, {});

                    return Object.entries(groups).map(([dept, list]) => (
                      <optgroup key={dept} label={dept}>
                        {list.map((d) => (
                          <option key={d.uid} value={d.uid}>
                            {d.name}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Choose a provider to see availability.
              </p>

              {selectedDoctor?.location && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">
                    Location:
                  </span>{" "}
                  {selectedDoctor.location}
                </div>
              )}
            </div>

            {/* Date + Time */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={booking.date}
                    onChange={(e) =>
                      setBooking((b) => ({ ...b, date: e.target.value }))
                    }
                    onClick={(e) => e.currentTarget.showPicker?.()} // opens picker in supported browsers
                    required
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Click the field to open the calendar.
                </p>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="time"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={booking.time}
                    onChange={(e) =>
                      setBooking((b) => ({ ...b, time: e.target.value }))
                    }
                    onClick={(e) => e.currentTarget.showPicker?.()} // opens picker in supported browsers
                    required
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Click the field to open the time picker.
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Notes{" "}
              <span className="text-slate-400 font-medium">(Optional)</span>
            </label>

            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 resize-none transition-colors"
              placeholder="Add symptoms, reason for visit, or anything the provider should know..."
              rows={4}
              value={booking.notes}
              onChange={(e) =>
                setBooking((b) => ({ ...b, notes: e.target.value }))
              }
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center px-8 py-2.5 rounded-lg text-sm font-semibold
                 bg-blue-600 text-white hover:bg-blue-700
                 disabled:bg-slate-300 disabled:text-white disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 transition-colors"
            >
              {submitting ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </form>
      </div>

      {/* Appointments List */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Your Appointments
        </h2>

        {appointments.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-12 text-center">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold mb-1">
              No appointments scheduled
            </p>
            <p className="text-slate-600 text-sm">
              Book your first appointment above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`p-3 rounded-lg flex-shrink-0 ${
                          appointment.type === "video"
                            ? "bg-blue-100"
                            : appointment.type === "phone"
                            ? "bg-emerald-100"
                            : "bg-purple-100"
                        }`}
                      >
                        {appointment.type === "video" ? (
                          <Video
                            className={`w-5 h-5 ${
                              appointment.type === "video"
                                ? "text-blue-600"
                                : ""
                            }`}
                          />
                        ) : appointment.type === "phone" ? (
                          <Phone
                            className={`w-5 h-5 ${
                              appointment.type === "phone"
                                ? "text-emerald-600"
                                : ""
                            }`}
                          />
                        ) : (
                          <MapPin
                            className={`w-5 h-5 ${
                              appointment.type === "in-person"
                                ? "text-purple-600"
                                : ""
                            }`}
                          />
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {appointment.doctorName}
                        </h3>
                        {appointment.specialty && (
                          <p className="text-slate-600 text-sm mt-0.5">
                            {appointment.specialty}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>
                          {appointment.date} at {appointment.time}
                        </span>
                      </div>

                      {appointment.location && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span>{appointment.location}</span>
                        </div>
                      )}

                      <div className="pt-1">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status === "pending"
                              ? "bg-amber-100 text-amber-900"
                              : appointment.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : appointment.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : appointment.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {appointment.status === "pending"
                            ? "Pending"
                            : appointment.status === "scheduled"
                            ? "Accepted"
                            : appointment.status.charAt(0).toUpperCase() +
                              appointment.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold">Notes:</span>{" "}
                          {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto md:flex-shrink-0">
                    {appointment.status === "pending" && (
                      <>
                        <button
                          onClick={() => openReschedule(appointment)}
                          className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(appointment)}
                          className="px-4 py-2.5 border border-red-300 hover:bg-red-50 text-red-700 font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
                        >
                          Cancel Request
                        </button>
                      </>
                    )}

                    {appointment.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => handleMessageDoctor(appointment)}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
                        >
                          Message Doctor
                        </button>

                        <button
                          onClick={() => {
                            if (appointment.type === "in-person") {
                              openDirections(appointment);
                              return;
                            }
                            window.alert(
                              "This action will be available in a future update."
                            );
                          }}
                          className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
                        >
                          {appointment.type === "video"
                            ? "Join Call"
                            : appointment.type === "phone"
                            ? "Call Doctor"
                            : "Get Directions"}
                        </button>

                        <button
                          onClick={() => openReschedule(appointment)}
                          className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
                        >
                          Reschedule
                        </button>
                      </>
                    )}

                    {appointment.status === "completed" && (
                      <button className="px-4 py-2.5 border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2 whitespace-nowrap">
                        <FileText className="w-4 h-4" />
                        View Report
                      </button>
                    )}

                    {appointment.status === "rejected" && (
                      <button
                        onClick={() =>
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                        className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
                      >
                        Request Again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Reschedule Appointment
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Choose a new date and time
                  </p>
                </div>
                <button
                  onClick={closeReschedule}
                  disabled={rescheduleSaving}
                  className="text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed flex-shrink-0 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={submitReschedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                  />
                </div>

                {rescheduleError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-900 text-sm">{rescheduleError}</p>
                  </div>
                )}

                {rescheduleSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-900 text-sm font-medium">
                      {rescheduleSuccess}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeReschedule}
                    disabled={rescheduleSaving}
                    className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-700 font-medium rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduleSaving}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    {rescheduleSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsTab;
