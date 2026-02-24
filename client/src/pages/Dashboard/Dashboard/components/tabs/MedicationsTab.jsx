/**
 * Frontend page: MedicationsTab
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

"use client"

import { useEffect, useMemo, useState } from "react"
import { Pill, Plus, CheckCircle2, XCircle, Edit3, Trash2, Clock } from "lucide-react"

import { api } from "@/services/api"

function formatDate(dateString) {
  if (!dateString) return ""
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(dateString) {
  if (!dateString) return ""
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function msToHuman(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const rS = s % 60
  if (m <= 0) return `${rS}s`
  const h = Math.floor(m / 60)
  const rM = m % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${rM}m`
}

function getStatusStyles(status) {
  const base = "px-2 py-1 rounded-full text-xs font-medium border transition-colors duration-200"
  switch (status) {
    case "active":
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`
    case "completed":
      return `${base} bg-blue-50 text-blue-700 border-blue-200`
    case "paused":
      return `${base} bg-amber-50 text-amber-700 border-amber-200`
    default:
      return `${base} bg-slate-50 text-slate-700 border-slate-200`
  }
}

function getMedicationIconStyles(status) {
  const base =
    "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 flex-shrink-0"
  switch (status) {
    case "active":
      return `${base} bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600`
    case "completed":
      return `${base} bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600`
    case "paused":
      return `${base} bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600`
    default:
      return `${base} bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600`
  }
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-8">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white rounded-t-2xl z-10">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6">{children}</div>
      </div>
    </div>
  )
}

const emptyForm = {
  name: "",
  dosage: "",
  schedule: "",
  scheduleType: "interval",
  timesPerDay: 1,
  intervalMinutes: "",
  fixedTimesCsv: "",
  startDate: "",
  endDate: "",
  notes: "",
  status: "active",
}

const MedicationsTab = ({ medications = [], onMedicationsChanged }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // medication or null
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [toast, setToast] = useState({ type: "", message: "" })
  const [nowTick, setNowTick] = useState(() => Date.now())

  // Local clock tick so "Due in X" can update without re-fetching.
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 5000)
    return () => window.clearInterval(t)
  }, [])

  // Lightweight polling: keeps day-boundary logic correct (daily caps reset) and syncs server-computed schedule.
  useEffect(() => {
    if (typeof onMedicationsChanged !== "function") return
    const t = window.setInterval(() => {
      // Avoid hammering while the modal is open / user is editing.
      if (!modalOpen && !saving) onMedicationsChanged()
    }, 60000)
    return () => window.clearInterval(t)
  }, [modalOpen, saving, onMedicationsChanged])

  const clearToastSoon = () => {
    window.clearTimeout(clearToastSoon._t)
    clearToastSoon._t = window.setTimeout(() => setToast({ type: "", message: "" }), 1800)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError("")
    setModalOpen(true)
  }

  const openEdit = (m) => {
    setEditing(m)
    setForm({
      name: m?.name || "",
      dosage: m?.dosage || "",
      schedule: m?.schedule || "",
      scheduleType: m?.scheduleType || (Array.isArray(m?.times) && m.times.length ? "fixed_times" : "interval"),
      timesPerDay: Number(m?.timesPerDay ?? 1) || 1,
      intervalMinutes: m?.intervalMinutes ?? "",
      fixedTimesCsv: Array.isArray(m?.times) ? m.times.join(", ") : "",
      startDate: m?.startDate ? String(m.startDate).slice(0, 10) : "",
      endDate: m?.endDate ? String(m.endDate).slice(0, 10) : "",
      notes: m?.notes || "",
      status: m?.status || "active",
    })
    setFormError("")
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const refresh = async () => {
    if (typeof onMedicationsChanged === "function") {
      await onMedicationsChanged()
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setFormError("")
    const name = (form.name || "").trim()
    if (!name) {
      setFormError("Medication name is required")
      return
    }

    setSaving(true)
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      const timezoneOffsetMinutes = new Date().getTimezoneOffset()
      const scheduleType = (form.scheduleType || "interval").toString()
      const timesPerDay = Number(form.timesPerDay ?? 1) || 1
      const intervalRaw =
        form.intervalMinutes === "" || form.intervalMinutes === null ? null : Number(form.intervalMinutes)
      const intervalMinutes = Number.isFinite(intervalRaw) ? intervalRaw : null
      const fixedTimes = (form.fixedTimesCsv || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      // Convenience default: if interval schedule and user didn't provide intervalMinutes,
      // derive a reasonable interval from timesPerDay (e.g. 3x/day => every 480 minutes).
      const derivedInterval =
        scheduleType === "interval" && !intervalMinutes && timesPerDay > 0
          ? Math.max(1, Math.round(1440 / timesPerDay))
          : null

      const payload = {
        name,
        dosage: form.dosage || "",
        schedule: form.schedule || "",
        scheduleType,
        timesPerDay,
        intervalMinutes: scheduleType === "interval" ? intervalMinutes || derivedInterval : null,
        times: scheduleType === "fixed_times" ? fixedTimes : [],
        timezone,
        timezoneOffsetMinutes,
        startDate: form.startDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : null,
        endDate: form.endDate ? new Date(`${form.endDate}T00:00:00`).toISOString() : null,
        notes: form.notes || "",
        status: form.status || "active",
      }

      if (editing?.id) {
        await api.updateMedication(editing.id, payload)
        setToast({ type: "success", message: "Medication updated" })
      } else {
        await api.createMedication(payload)
        setToast({ type: "success", message: "Medication added" })
      }
      clearToastSoon()
      await refresh()
      setModalOpen(false)
    } catch (err) {
      setFormError(err?.message || "Failed to save medication")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (m) => {
    if (!m?.id) return
    const ok = window.confirm(`Delete medication: ${m.name || "this item"}?`)
    if (!ok) return

    try {
      await api.deleteMedication(m.id)
      setToast({ type: "success", message: "Medication deleted" })
      clearToastSoon()
      await refresh()
    } catch (err) {
      setToast({ type: "error", message: err?.message || "Failed to delete" })
      clearToastSoon()
    }
  }

  const mark = async (m, action) => {
    if (!m?.id) return
    try {
      await api.markMedication(m.id, action)
      setToast({ type: "success", message: action === "taken" ? "Marked as taken" : "Marked as skipped" })
      clearToastSoon()
      await refresh()
    } catch (err) {
      setToast({ type: "error", message: err?.message || "Action failed" })
      clearToastSoon()
    }
  }

  const enhancedMeds = useMemo(() => {
    const now = new Date(nowTick)
    const list = Array.isArray(medications) ? medications : []
    return list.map((m) => {
      const entries = Array.isArray(m.adherence) ? m.adherence : []
      const last = entries.length ? entries[entries.length - 1] : null

      const computed = m?.computed || {}
      const nextDueAtRaw = computed.nextDueAt || m?.nextDueAt || null
      const nextDueAt = nextDueAtRaw ? new Date(nextDueAtRaw) : null
      const remainingToday = Number.isFinite(Number(computed.remainingToday)) ? Number(computed.remainingToday) : null

      const isDueNow =
        (m?.status || "active") === "active" &&
        nextDueAt &&
        !Number.isNaN(nextDueAt.getTime()) &&
        nextDueAt.getTime() <= now.getTime() &&
        (remainingToday === null || remainingToday > 0)

      const dueInMs =
        nextDueAt && !Number.isNaN(nextDueAt.getTime()) ? Math.max(0, nextDueAt.getTime() - now.getTime()) : null

      return {
        ...m,
        _lastEntry: last,
        _nextDueAt: nextDueAt,
        _isDueNow: isDueNow,
        _dueInMs: dueInMs,
        _remainingToday: remainingToday,
        _eventsToday: Number.isFinite(Number(computed.eventsToday)) ? Number(computed.eventsToday) : null,
      }
    })
  }, [medications, nowTick])

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="border-0 shadow-lg lg:shadow-2xl bg-white lg:bg-white/90 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-col sm:flex-row mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 flex items-center mb-2">
              <Pill className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 mr-2 sm:mr-3 lg:mr-4 text-emerald-600 flex-shrink-0" />
              Medication Management
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600">
              Add prescriptions, track schedules, and mark doses.
            </p>
          </div>

          <button
            onClick={openAdd}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-4 py-3 shadow-lg"
            type="button"
          >
            <Plus className="w-4 h-4" />
            Add Medication
          </button>
        </div>

        {/* Toast */}
        {toast.message ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        {/* List */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          {enhancedMeds.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-5">
                <Pill className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Medications Yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Add your first medication to track dosage and schedule.
              </p>
              <button
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5"
                type="button"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            </div>
          ) : (
            enhancedMeds.map((m) => {
              const status = (m?.status || "active").toString()
              const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
              const scheduleText = (m?.schedule || "").trim() || "—"
              const timesPerDay = Number(m?.timesPerDay ?? 1) || 1

              return (
                <div
                  key={m.id}
                  className="border border-slate-200 shadow-lg lg:shadow-xl hover:shadow-xl lg:hover:shadow-2xl transition-all duration-300 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 lg:gap-6 flex-1">
                      <div className={getMedicationIconStyles(status)}>
                        <Pill className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{m.name}</h3>
                          <span className={getStatusStyles(status)}>{statusLabel}</span>
                        </div>

                        <p className="text-slate-700 font-medium text-sm sm:text-base mb-2">
                          {m.dosage ? `${m.dosage} • ` : ""}
                          {scheduleText} • {timesPerDay}x/day
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {formatDate(m.startDate) || "No start"}
                            {m.endDate ? ` → ${formatDate(m.endDate)}` : ""}
                          </span>
                          {m.notes ? <span className="text-slate-500">• {m.notes}</span> : null}
                        </div>

                        <div className="mt-3 flex flex-col gap-1 text-xs sm:text-sm">
                          <div className="text-slate-600">
                            Next:{" "}
                            {m._nextDueAt ? (
                              <span className="font-semibold">{formatDateTime(m._nextDueAt)}</span>
                            ) : (
                              <span className="font-semibold">—</span>
                            )}
                            {m._isDueNow ? (
                              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-semibold">
                                Due now
                              </span>
                            ) : m._dueInMs !== null ? (
                              <span className="ml-2 text-slate-500">(in {msToHuman(m._dueInMs)})</span>
                            ) : null}
                          </div>

                          <div className="text-slate-600">
                            Today: <span className="font-semibold">{m._eventsToday ?? "—"}</span>
                            {Number.isFinite(Number(m?.timesPerDay)) ? (
                              <span className="text-slate-500"> / {Number(m.timesPerDay)} doses</span>
                            ) : null}
                            {Number.isFinite(Number(m._remainingToday)) ? (
                              <span className="ml-2 text-slate-500">({m._remainingToday} remaining)</span>
                            ) : null}
                          </div>

                          {m._lastEntry ? (
                            <div className="text-slate-500">
                              Last: <span className="font-semibold">{m._lastEntry.status}</span> •{" "}
                              {formatDateTime(m._lastEntry.at)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto lg:w-52 flex-shrink-0">
                      {status === "active" ? (
                        <>
                          <button
                            onClick={() => mark(m, "taken")}
                            disabled={!m._isDueNow}
                            title={!m._isDueNow ? "Not due yet" : "Mark this dose as taken"}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold transition ${
                              !m._isDueNow
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                            }`}
                            type="button"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Taken
                          </button>
                          <button
                            onClick={() => mark(m, "skipped")}
                            disabled={!m._isDueNow}
                            title={!m._isDueNow ? "Not due yet" : "Mark this dose as skipped"}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold transition ${
                              !m._isDueNow
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-slate-800 text-white"
                            }`}
                            type="button"
                          >
                            <XCircle className="w-4 h-4" />
                            Skip
                          </button>
                        </>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-3 py-2"
                          type="button"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => remove(m)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold px-3 py-2"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <Modal open={modalOpen} title={editing?.id ? "Edit Medication" : "Add Medication"} onClose={closeModal}>
        <form onSubmit={submit} className="space-y-6">
          {formError ? (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-rose-900 text-sm font-medium flex items-start gap-3">
              <span className="text-rose-600 text-lg flex-shrink-0">!</span>
              <span>{formError}</span>
            </div>
          ) : null}

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Medication Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Ibuprofen"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Dosage</label>
                <input
                  type="text"
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  placeholder="e.g., 400mg"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Schedule Label (optional)</label>
                <input
                  type="text"
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="e.g., After meals, With water"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Schedule Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Schedule Type</label>
                <select
                  value={form.scheduleType}
                  onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                >
                  <option value="interval">Interval (every N minutes)</option>
                  <option value="fixed_times">Fixed Times (HH:MM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Max Times Per Day</label>
                <input
                  type="number"
                  min="1"
                  value={form.timesPerDay}
                  onChange={(e) => setForm({ ...form, timesPerDay: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
                <p className="mt-2 text-xs text-slate-500">Safety cap for daily doses (taken + skipped)</p>
              </div>

              {form.scheduleType === "interval" && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Interval Minutes</label>
                  <input
                    type="number"
                    min="1"
                    value={form.intervalMinutes}
                    onChange={(e) => setForm({ ...form, intervalMinutes: e.target.value })}
                    placeholder="e.g., 480 (every 8 hours)"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <p className="mt-2 text-xs text-slate-500">Leave blank to auto-calculate from times per day</p>
                </div>
              )}

              {form.scheduleType === "fixed_times" && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Fixed Times</label>
                  <input
                    type="text"
                    value={form.fixedTimesCsv}
                    onChange={(e) => setForm({ ...form, fixedTimesCsv: e.target.value })}
                    placeholder="e.g., 08:00, 14:00, 20:00"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <p className="mt-2 text-xs text-slate-500">Comma-separated list of times in HH:MM format</p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-200" />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Duration & Notes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">End Date (optional)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="e.g., Take with food, avoid dairy, may cause drowsiness"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {["active", "paused", "completed"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`py-3 px-4 rounded-lg font-medium text-sm transition ${
                        form.status === s
                          ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 rounded-lg px-4 py-3 font-semibold text-white shadow-lg transition ${
                saving
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              }`}
              disabled={saving}
            >
              {saving ? "Saving..." : editing?.id ? "Save Changes" : "Add Medication"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MedicationsTab
