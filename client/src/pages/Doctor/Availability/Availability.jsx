/**
 * Frontend page: Availability
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// import { useEffect, useMemo, useState } from "react";
// import { Plus, X } from "lucide-react";

// import DoctorNavbar from "@/components/doctor/doctor-navbar";
// import DoctorSidebar from "@/components/doctor/doctor-sidebar";
// import api from "@/services/api";

// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
  } catch {
    return "local";
  }
}


// function getDefaults() {
//   return {
//     weekly: {
//       Monday: { available: true, start: "09:00", end: "17:00", breaks: [] },
//       Tuesday: { available: true, start: "09:00", end: "17:00", breaks: [] },
//       Wednesday: { available: true, start: "09:00", end: "17:00", breaks: [] },
//       Thursday: { available: true, start: "09:00", end: "17:00", breaks: [] },
//       Friday: { available: true, start: "09:00", end: "17:00", breaks: [] },
//       Saturday: { available: false, start: "10:00", end: "14:00", breaks: [] },
//       Sunday: { available: false, start: "10:00", end: "14:00", breaks: [] },
//     },
//     slotRules: {
//       duration: 30,
//       buffer: 10,
//       maxPerDay: 10,
//       bookingNotice: 24,
//       cancellationHours: 4,
//     },
//     timeOff: [],
//     timezone: getBrowserTimeZone(),
//   };
// }

// function fmtRange(startAt, endAt) {
//   try {
//     const s = new Date(startAt);
//     const e = new Date(endAt);
//     const same = s.toDateString() === e.toDateString();
//     const date = s.toLocaleDateString();
//     const st = s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//     const et = e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//     if (same) return `${date} • ${st} – ${et}`;
//     return `${s.toLocaleString()} → ${e.toLocaleString()}`;
//   } catch {
//     return "";
//   }
// }

// function pad2(n) {
//   return String(n).padStart(2, "0");
// }

// function toDateInput(d) {
//   return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
// }

// function mergeDefaults(remote) {
//   const def = getDefaults();
//   if (!remote || typeof remote !== "object") return def;
//   return {
//     weekly: { ...def.weekly, ...(remote.weekly || {}) },
//     slotRules: { ...def.slotRules, ...(remote.slotRules || {}) },
//     timeOff: Array.isArray(remote.timeOff) ? remote.timeOff : [],
//     timezone: remote.timezone || def.timezone,
//   };
// }

// export default function DoctorAvailability() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [statusMsg, setStatusMsg] = useState("");

//   const [data, setData] = useState(getDefaults());
//   const [lastSavedSnapshot, setLastSavedSnapshot] = useState(JSON.stringify(getDefaults()));

//   // Time off modal
//   const [timeOffOpen, setTimeOffOpen] = useState(false);
//   const [timeOffReason, setTimeOffReason] = useState("");
//   const [timeOffStartDate, setTimeOffStartDate] = useState(toDateInput(new Date()));
//   const [timeOffStartTime, setTimeOffStartTime] = useState("09:00");
//   const [timeOffEndDate, setTimeOffEndDate] = useState(toDateInput(new Date()));
//   const [timeOffEndTime, setTimeOffEndTime] = useState("12:00");

//   const dirty = useMemo(() => JSON.stringify(data) !== lastSavedSnapshot, [data, lastSavedSnapshot]);

//   const refresh = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const res = await api.getDoctorAvailabilityMe();
//       const merged = mergeDefaults(res);
//       setData(merged);
//       setLastSavedSnapshot(JSON.stringify(merged));
//     } catch (e) {
//       setError(e?.message || "Failed to load availability settings");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     refresh();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const setDay = (day, patch) => {
//     setData((prev) => ({
//       ...prev,
//       weekly: {
//         ...prev.weekly,
//         [day]: {
//           ...prev.weekly[day],
//           ...patch,
//         },
//       },
//     }));
//   };

//   const addBreak = (day) => {
//     setData((prev) => {
//       const cur = prev.weekly[day];
//       const next = { start: "13:00", end: "14:00" };
//       return {
//         ...prev,
//         weekly: {
//           ...prev.weekly,
//           [day]: { ...cur, breaks: [...(cur.breaks || []), next] },
//         },
//       };
//     });
//   };

//   const updateBreak = (day, idx, patch) => {
//     setData((prev) => {
//       const cur = prev.weekly[day];
//       const breaks = [...(cur.breaks || [])];
//       breaks[idx] = { ...breaks[idx], ...patch };
//       return {
//         ...prev,
//         weekly: {
//           ...prev.weekly,
//           [day]: { ...cur, breaks },
//         },
//       };
//     });
//   };

//   const removeBreak = (day, idx) => {
//     setData((prev) => {
//       const cur = prev.weekly[day];
//       const breaks = [...(cur.breaks || [])].filter((_, i) => i !== idx);
//       return {
//         ...prev,
//         weekly: {
//           ...prev.weekly,
//           [day]: { ...cur, breaks },
//         },
//       };
//     });
//   };

//   const save = async () => {
//     try {
//       setSaving(true);
//       setError("");
//       setStatusMsg("");
//       const payload = {
//         ...data,
//         timezone: data?.timezone && data.timezone !== "local" ? data.timezone : getBrowserTimeZone(),
//       };
//       const res = await api.updateDoctorAvailabilityMe(payload);
//       const merged = mergeDefaults(res);
//       setData(merged);
//       const snap = JSON.stringify(merged);
//       setLastSavedSnapshot(snap);
//       setStatusMsg("Saved successfully ✅");
//       setTimeout(() => setStatusMsg(""), 2500);
//     } catch (e) {
//       setError(e?.message || "Failed to save");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const openTimeOff = () => {
//     const now = new Date();
//     setTimeOffStartDate(toDateInput(now));
//     setTimeOffEndDate(toDateInput(now));
//     setTimeOffStartTime("09:00");
//     setTimeOffEndTime("12:00");
//     setTimeOffReason("");
//     setTimeOffOpen(true);
//   };

//   const addTimeOff = async () => {
//     const startAt = new Date(`${timeOffStartDate}T${timeOffStartTime}:00`);
//     const endAt = new Date(`${timeOffEndDate}T${timeOffEndTime}:00`);
//     if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || endAt <= startAt) {
//       setError("Time off end must be after start.");
//       return;
//     }
//     try {
//       setError("");
//       setSaving(true);
//       const created = await api.addDoctorTimeOff({
//         startAt: startAt.toISOString(),
//         endAt: endAt.toISOString(),
//         reason: timeOffReason,
//       });
//       setData((prev) => {
//         const next = {
//           ...prev,
//           timeOff: [...(prev.timeOff || []), created],
//         };
//         // Added via API so treat as saved.
//         setSavedSnapshot(JSON.stringify(next));
//         return next;
//       });
//       setTimeOffOpen(false);
//     } catch (e) {
//       setError(e?.message || "Failed to add time off");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const removeTimeOff = async (id) => {
//     // If the item exists in DB, also remove it from DB so other screens (calendar) update.
//     const isLocalOnly = String(id).startsWith("local-");
//     setData((prev) => {
//       const next = {
//         ...prev,
//         timeOff: (prev.timeOff || []).filter((x) => String(x._id || x.id) !== String(id)),
//       };
//       // Removed from UI immediately; if API succeeds, keep as saved.
//       setSavedSnapshot(JSON.stringify(next));
//       return next;
//     });
//     if (isLocalOnly) return;
//     try {
//       await api.removeDoctorTimeOff(id);
//     } catch {
//       // best-effort; UI still removed
//     }
//   };

//   const preview = useMemo(() => {
//     return DAYS.map((day) => {
//       const d = data.weekly?.[day];
//       return {
//         day,
//         label: d?.available ? `${d.start || "--"} - ${d.end || "--"}` : "Off",
//       };
//     });
//   }, [data]);

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       <div className="lg:pl-64">
//         <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} title="Availability" showSearch={false} />

//         <main className="p-4 sm:p-6">
//           <div className="max-w-7xl mx-auto space-y-6">
//             <div className="flex flex-col gap-1">
//               <h1 className="text-2xl font-bold text-slate-900">Availability Settings</h1>
//               <p className="text-sm text-slate-600">Manage your working hours, booking rules, and time off.</p>
//             </div>

//             {loading ? (
//               <div className="flex items-center justify-center py-16">
//                 <div className="text-center">
//                   <div className="loading loading-spinner loading-lg text-primary"></div>
//                   <p className="mt-3 text-sm text-slate-600">Loading…</p>
//                 </div>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Left column */}
//                 <div className="lg:col-span-2 space-y-6">
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>Weekly Working Hours</CardTitle>
//                       <CardDescription>Select working days and set your clinic hours.</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-4">
//                         {DAYS.map((day) => {
//                           const d = data.weekly?.[day];
//                           return (
//                             <div key={day} className="pb-4 border-b border-slate-200 last:border-0">
//                               <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
//                                 <div className="w-full sm:w-36">
//                                   <label className="flex items-center gap-2">
//                                     <input
//                                       type="checkbox"
//                                       checked={Boolean(d?.available)}
//                                       onChange={(e) => setDay(day, { available: e.target.checked })}
//                                       className="rounded border-slate-300"
//                                     />
//                                     <span className="font-medium text-slate-900">{day}</span>
//                                   </label>
//                                 </div>

//                                 {d?.available ? (
//                                   <>
//                                     <div className="flex-1">
//                                       <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
//                                       <input
//                                         type="time"
//                                         value={d.start || "09:00"}
//                                         onChange={(e) => setDay(day, { start: e.target.value })}
//                                         className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                                       />
//                                     </div>
//                                     <div className="flex-1">
//                                       <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
//                                       <input
//                                         type="time"
//                                         value={d.end || "17:00"}
//                                         onChange={(e) => setDay(day, { end: e.target.value })}
//                                         className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                                       />
//                                     </div>
//                                     <div className="sm:pb-[2px]">
//                                       <Button variant="outline" className="gap-2" onClick={() => addBreak(day)}>
//                                         <Plus className="w-4 h-4" /> Add break
//                                       </Button>
//                                     </div>
//                                   </>
//                                 ) : null}
//                               </div>

//                               {d?.available && d?.breaks?.length ? (
//                                 <div className="mt-3 grid gap-2">
//                                   {d.breaks.map((b, idx) => (
//                                     <div key={idx} className="flex flex-col sm:flex-row sm:items-end gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3">
//                                       <div className="flex-1">
//                                         <label className="block text-xs font-medium text-slate-600 mb-1">Break start</label>
//                                         <input
//                                           type="time"
//                                           value={b.start}
//                                           onChange={(e) => updateBreak(day, idx, { start: e.target.value })}
//                                           className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                                         />
//                                       </div>
//                                       <div className="flex-1">
//                                         <label className="block text-xs font-medium text-slate-600 mb-1">Break end</label>
//                                         <input
//                                           type="time"
//                                           value={b.end}
//                                           onChange={(e) => updateBreak(day, idx, { end: e.target.value })}
//                                           className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                                         />
//                                       </div>
//                                       <Button
//                                         variant="ghost"
//                                         className="text-slate-700"
//                                         onClick={() => removeBreak(day, idx)}
//                                       >
//                                         <X className="w-4 h-4" />
//                                       </Button>
//                                     </div>
//                                   ))}
//                                 </div>
//                               ) : null}
//                             </div>
//                           );
//                         })}
//                       </div>
//                     </CardContent>
//                   </Card>

//                   <Card>
//                     <CardHeader>
//                       <CardTitle>Appointment Slot Rules</CardTitle>
//                       <CardDescription>These settings will be used when generating available booking slots.</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-slate-900 mb-2">Slot duration (minutes)</label>
//                           <select
//                             value={data.slotRules.duration}
//                             onChange={(e) => setData((p) => ({ ...p, slotRules: { ...p.slotRules, duration: Number(e.target.value) } }))}
//                             className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                           >
//                             {[10, 15, 20, 30, 45, 60].map((n) => (
//                               <option key={n} value={n}>{n}</option>
//                             ))}
//                           </select>
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-slate-900 mb-2">Buffer between appointments (minutes)</label>
//                           <select
//                             value={data.slotRules.buffer}
//                             onChange={(e) => setData((p) => ({ ...p, slotRules: { ...p.slotRules, buffer: Number(e.target.value) } }))}
//                             className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                           >
//                             {[0, 5, 10, 15].map((n) => (
//                               <option key={n} value={n}>{n}</option>
//                             ))}
//                           </select>
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-slate-900 mb-2">Max appointments per day</label>
//                           <Input
//                             type="number"
//                             value={data.slotRules.maxPerDay}
//                             onChange={(e) => setData((p) => ({ ...p, slotRules: { ...p.slotRules, maxPerDay: Number(e.target.value) } }))}
//                           />
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-slate-900 mb-2">Booking notice (hours)</label>
//                           <Input
//                             type="number"
//                             value={data.slotRules.bookingNotice}
//                             onChange={(e) => setData((p) => ({ ...p, slotRules: { ...p.slotRules, bookingNotice: Number(e.target.value) } }))}
//                           />
//                         </div>

//                         <div className="sm:col-span-2">
//                           <label className="block text-sm font-medium text-slate-900 mb-2">Cancellation policy (hours before)</label>
//                           <Input
//                             type="number"
//                             value={data.slotRules.cancellationHours}
//                             onChange={(e) => setData((p) => ({ ...p, slotRules: { ...p.slotRules, cancellationHours: Number(e.target.value) } }))}
//                           />
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   <Card>
//                     <CardHeader>
//                       <div className="flex items-center justify-between gap-3">
//                         <div>
//                           <CardTitle>Time Off / Exceptions</CardTitle>
//                           <CardDescription>Block specific times so patients can’t book you.</CardDescription>
//                         </div>
//                         <Button className="gap-2" onClick={openTimeOff}>
//                           <Plus className="w-4 h-4" /> Add time off
//                         </Button>
//                       </div>
//                     </CardHeader>
//                     <CardContent>
//                       {(data.timeOff || []).length === 0 ? (
//                         <div className="py-6 text-sm text-slate-600">No time off added yet.</div>
//                       ) : (
//                         <div className="space-y-2">
//                           {[...(data.timeOff || [])]
//                             .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
//                             .map((t) => (
//                               <div key={t._id || t.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
//                                 <div className="min-w-0">
//                                   <p className="font-medium text-slate-900 truncate">{fmtRange(t.startAt, t.endAt)}</p>
//                                   <p className="text-sm text-slate-600 truncate">{t.reason || "(No reason)"}</p>
//                                 </div>
//                                 <Button variant="ghost" onClick={() => removeTimeOff(t._id || t.id)}>
//                                   <X className="w-4 h-4" />
//                                 </Button>
//                               </div>
//                             ))}
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </div>

//                 {/* Right column (Preview + Save) */}
//                 <div className="space-y-6">
//                   <Card className="h-fit">
//                     <CardHeader>
//                       <CardTitle>Weekly Preview</CardTitle>
//                       <CardDescription>How your schedule looks to patients.</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-2">
//                         {preview.map((x) => (
//                           <div key={x.day} className="flex items-center justify-between text-sm">
//                             <span className="font-medium text-slate-900">{x.day}</span>
//                             <span className="text-slate-600">{x.label}</span>
//                           </div>
//                         ))}
//                       </div>

//                       {error ? <div className="mt-4 text-sm text-red-700">{error}</div> : null}
//                       {statusMsg ? <div className="mt-4 text-sm text-emerald-700">{statusMsg}</div> : null}

//                       <Button
//                         className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
//                         onClick={save}
//                         disabled={saving || !dirty}
//                       >
//                         {saving ? "Saving…" : dirty ? "Save changes" : "No unsaved changes"}
//                       </Button>

//                       <Button
//                         variant="outline"
//                         className="w-full mt-3"
//                         onClick={refresh}
//                         disabled={loading || saving}
//                       >
//                         Reset
//                       </Button>
//                     </CardContent>
//                   </Card>
//                 </div>
//               </div>
//             )}

//             {/* Add time off dialog */}
//             <Dialog open={timeOffOpen} onOpenChange={setTimeOffOpen}>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Add time off</DialogTitle>
//                   <DialogDescription>Block a specific time range (for leave, surgery, meetings, etc.).</DialogDescription>
//                 </DialogHeader>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-slate-900 mb-2">Start date</label>
//                     <input
//                       type="date"
//                       value={timeOffStartDate}
//                       onChange={(e) => setTimeOffStartDate(e.target.value)}
//                       className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-slate-900 mb-2">Start time</label>
//                     <input
//                       type="time"
//                       value={timeOffStartTime}
//                       onChange={(e) => setTimeOffStartTime(e.target.value)}
//                       className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-slate-900 mb-2">End date</label>
//                     <input
//                       type="date"
//                       value={timeOffEndDate}
//                       onChange={(e) => setTimeOffEndDate(e.target.value)}
//                       className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-slate-900 mb-2">End time</label>
//                     <input
//                       type="time"
//                       value={timeOffEndTime}
//                       onChange={(e) => setTimeOffEndTime(e.target.value)}
//                       className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                     />
//                   </div>

//                   <div className="sm:col-span-2">
//                     <label className="block text-sm font-medium text-slate-900 mb-2">Reason (optional)</label>
//                     <textarea
//                       value={timeOffReason}
//                       onChange={(e) => setTimeOffReason(e.target.value)}
//                       rows={3}
//                       className="w-full resize-none px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       placeholder="e.g. Conference, personal leave"
//                     />
//                   </div>
//                 </div>

//                 <DialogFooter>
//                   <Button variant="outline" onClick={() => setTimeOffOpen(false)}>
//                     Cancel
//                   </Button>
//                   <Button className="bg-blue-600 hover:bg-blue-700" onClick={addTimeOff}>
//                     Add
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Calendar, Clock, AlertCircle } from "lucide-react";

import DoctorNavbar from "@/components/doctor/doctor-navbar";
import DoctorSidebar from "@/components/doctor/doctor-sidebar";
import api from "@/services/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getDefaults() {
  return {
    weekly: {
      Monday: { available: true, start: "09:00", end: "17:00", breaks: [] },
      Tuesday: { available: true, start: "09:00", end: "17:00", breaks: [] },
      Wednesday: { available: true, start: "09:00", end: "17:00", breaks: [] },
      Thursday: { available: true, start: "09:00", end: "17:00", breaks: [] },
      Friday: { available: true, start: "09:00", end: "17:00", breaks: [] },
      Saturday: { available: false, start: "10:00", end: "14:00", breaks: [] },
      Sunday: { available: false, start: "10:00", end: "14:00", breaks: [] },
    },
    slotRules: {
      duration: 30,
      buffer: 10,
      maxPerDay: 10,
      bookingNotice: 24,
      cancellationHours: 4,
    },
    timeOff: [],
    timezone: getBrowserTimeZone(),
  };
}

function mergeDefaults(remote) {
  const def = getDefaults();
  if (!remote || typeof remote !== "object") return def;
  return {
    weekly: { ...def.weekly, ...(remote.weekly || {}) },
    slotRules: { ...def.slotRules, ...(remote.slotRules || {}) },
    timeOff: Array.isArray(remote.timeOff) ? remote.timeOff : [],
    timezone: remote.timezone || def.timezone,
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toDateInput(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fmtRange(startAt, endAt) {
  try {
    const s = new Date(startAt);
    const e = new Date(endAt);
    const same = s.toDateString() === e.toDateString();
    const date = s.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    const st = s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const et = e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (same) return `${date} • ${st} – ${et}`;
    return `${s.toLocaleString()} → ${e.toLocaleString()}`;
  } catch {
    return "";
  }
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-blue-50 border border-blue-100 p-2">
          <Icon className="h-5 w-5 text-blue-700" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg text-slate-900">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="text-slate-600">
              {description}
            </CardDescription>
          ) : null}
        </div>
      </div>
    </CardHeader>
  );
}

function Pill({ tone = "neutral", children }) {
  const cls =
    tone === "open"
      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
      : tone === "off"
      ? "bg-slate-100 text-slate-600 border-slate-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-100"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

export default function DoctorAvailability() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const [data, setData] = useState(getDefaults());
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(
    JSON.stringify(getDefaults())
  );

  // Time off modal
  const [timeOffOpen, setTimeOffOpen] = useState(false);
  const [timeOffReason, setTimeOffReason] = useState("");
  const [timeOffStartDate, setTimeOffStartDate] = useState(
    toDateInput(new Date())
  );
  const [timeOffStartTime, setTimeOffStartTime] = useState("09:00");
  const [timeOffEndDate, setTimeOffEndDate] = useState(toDateInput(new Date()));
  const [timeOffEndTime, setTimeOffEndTime] = useState("12:00");

  const dirty = useMemo(
    () => JSON.stringify(data) !== lastSavedSnapshot,
    [data, lastSavedSnapshot]
  );

  const refresh = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.getDoctorAvailabilityMe();
      const merged = mergeDefaults(res);
      setData(merged);
      setLastSavedSnapshot(JSON.stringify(merged));
    } catch (e) {
      setError(e?.message || "Failed to load availability settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDay = (day, patch) => {
    setData((prev) => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [day]: {
          ...prev.weekly[day],
          ...patch,
        },
      },
    }));
  };

  const addBreak = (day) => {
    setData((prev) => {
      const cur = prev.weekly[day];
      const next = { start: "13:00", end: "14:00" };
      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [day]: { ...cur, breaks: [...(cur.breaks || []), next] },
        },
      };
    });
  };

  const updateBreak = (day, idx, patch) => {
    setData((prev) => {
      const cur = prev.weekly[day];
      const breaks = [...(cur.breaks || [])];
      breaks[idx] = { ...breaks[idx], ...patch };
      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [day]: { ...cur, breaks },
        },
      };
    });
  };

  const removeBreak = (day, idx) => {
    setData((prev) => {
      const cur = prev.weekly[day];
      const breaks = [...(cur.breaks || [])].filter((_, i) => i !== idx);
      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [day]: { ...cur, breaks },
        },
      };
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setStatusMsg("");
      const payload = {
//         ...data,
        timezone: data?.timezone && data.timezone !== "local" ? data.timezone : getBrowserTimeZone(),
      };
      const res = await api.updateDoctorAvailabilityMe(payload);
      const merged = mergeDefaults(res);
      setData(merged);
      const snap = JSON.stringify(merged);
      setLastSavedSnapshot(snap);
      setStatusMsg("All changes saved.");
      setTimeout(() => setStatusMsg(""), 2200);
    } catch (e) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const openTimeOff = () => {
    const now = new Date();
    setTimeOffStartDate(toDateInput(now));
    setTimeOffEndDate(toDateInput(now));
    setTimeOffStartTime("09:00");
    setTimeOffEndTime("12:00");
    setTimeOffReason("");
    setError("");
    setTimeOffOpen(true);
  };

  const addTimeOff = async () => {
    const startAt = new Date(`${timeOffStartDate}T${timeOffStartTime}:00`);
    const endAt = new Date(`${timeOffEndDate}T${timeOffEndTime}:00`);
    if (
      isNaN(startAt.getTime()) ||
      isNaN(endAt.getTime()) ||
      endAt <= startAt
    ) {
      setError("Time off end must be after start.");
      return;
    }
    try {
      setError("");
      setSaving(true);
      const created = await api.addDoctorTimeOff({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        reason: timeOffReason,
      });

      setData((prev) => {
        const next = { ...prev, timeOff: [...(prev.timeOff || []), created] };
        // This is already saved server-side, so keep snapshot in sync to avoid “unsaved” confusion.
        setLastSavedSnapshot(JSON.stringify(next));
        return next;
      });

      setStatusMsg("Time off added.");
      setTimeout(() => setStatusMsg(""), 2200);
      setTimeOffOpen(false);
    } catch (e) {
      setError(e?.message || "Failed to add time off");
    } finally {
      setSaving(false);
    }
  };

  const removeTimeOff = async (id) => {
    setData((prev) => {
      const next = {
        ...prev,
        timeOff: (prev.timeOff || []).filter(
          (x) => String(x._id || x.id) !== String(id)
        ),
      };
      // Best UX: removing is immediate; server call is best-effort.
      setLastSavedSnapshot(JSON.stringify(next));
      return next;
    });
    try {
      await api.removeDoctorTimeOff(id);
      setStatusMsg("Time off removed.");
      setTimeout(() => setStatusMsg(""), 2200);
    } catch {
      // ignore (best-effort)
    }
  };

  const preview = useMemo(() => {
    return DAYS.map((day) => {
      const d = data.weekly?.[day];
      return {
        day,
        open: Boolean(d?.available),
        label: d?.available ? `${d?.start || "--"} – ${d?.end || "--"}` : "Off",
      };
    });
  }, [data]);

  const timeOffSorted = useMemo(() => {
    return [...(data.timeOff || [])].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [data.timeOff]);

  return (
    <div className="min-h-screen bg-slate-50">
      <DoctorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <DoctorNavbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Availability"
          showSearch={false}
        />

        <main className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white border border-slate-200 p-2 shadow-sm">
                  <Calendar className="h-6 w-6 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Availability Settings
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Set working hours, breaks, booking rules, and time
                    off—patients will see this schedule.
                  </p>
                </div>
              </div>

              {/* Top actions (always visible; matches “industry standard”) */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                <div className="flex items-center gap-2">
                  {dirty ? (
                    <Pill tone="warn">Unsaved changes</Pill>
                  ) : (
                    <Pill>All saved</Pill>
                  )}
                  {statusMsg ? <Pill tone="open">{statusMsg}</Pill> : null}
                </div>

                {/* <div className="flex gap-2">
                  <Button
                    onClick={save}
                    disabled={saving || !dirty}
                    className={dirty ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-200 text-slate-600 hover:bg-slate-200"}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button variant="outline" className="bg-transparent" onClick={refresh} disabled={loading || saving}>
                    Reset
                  </Button>
                </div> */}
                <div className="flex gap-2">
                  <Button
                    onClick={save}
                    disabled={saving || !dirty}
                    className="
      bg-blue-600 text-white hover:bg-blue-700
      focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200
    "
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={refresh}
                    disabled={loading || saving}
                    className="
      bg-white text-slate-900 border-slate-200 hover:bg-slate-50
      focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      disabled:bg-white disabled:text-slate-400 disabled:border-slate-200 disabled:hover:bg-white
    "
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Inline error */}
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">{error}</div>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <div className="loading loading-spinner loading-lg text-blue-600"></div>
                <p className="mt-3 text-sm text-slate-600">
                  Loading availability settings…
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: forms */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Weekly hours */}
                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <SectionHeader
                      icon={Clock}
                      title="Weekly Working Hours"
                      description="Choose open days, set clinic hours, and add breaks."
                    />
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {DAYS.map((day) => {
                          const d = data.weekly?.[day];
                          const open = Boolean(d?.available);
                          return (
                            <div
                              key={day}
                              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3">
                                  <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={open}
                                      onChange={(e) =>
                                        setDay(day, {
                                          available: e.target.checked,
                                        })
                                      }
                                      className="h-5 w-5 rounded-md border-slate-300 accent-blue-600"
                                    />
                                    <span className="font-semibold text-slate-900">
                                      {day}
                                    </span>
                                  </label>

                                  {open ? (
                                    <Pill tone="open">Open</Pill>
                                  ) : (
                                    <Pill tone="off">Off</Pill>
                                  )}
                                </div>

                                {open ? (
                                  <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                          START TIME
                                        </label>
                                        <input
                                          type="time"
                                          value={d.start || "09:00"}
                                          onChange={(e) =>
                                            setDay(day, {
                                              start: e.target.value,
                                            })
                                          }
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                          END TIME
                                        </label>
                                        <input
                                          type="time"
                                          value={d.end || "17:00"}
                                          onChange={(e) =>
                                            setDay(day, { end: e.target.value })
                                          }
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                      <Button
                                        variant="outline"
                                        className="bg-transparent border-slate-200 hover:bg-slate-50 w-full sm:w-auto"
                                        onClick={() => addBreak(day)}
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add break
                                      </Button>

                                      <p className="text-xs text-slate-500">
                                        Tip: Keep breaks inside your open hours.
                                      </p>
                                    </div>
                                  </>
                                ) : null}

                                {/* Breaks */}
                                {open && d?.breaks?.length ? (
                                  <div className="mt-1 space-y-2">
                                    <p className="text-xs font-semibold text-slate-600">
                                      BREAKS
                                    </p>
                                    {d.breaks.map((b, idx) => (
                                      <div
                                        key={idx}
                                        className="rounded-2xl border border-amber-200 bg-amber-50 p-3"
                                      >
                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 sm:items-end">
                                          <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                              START
                                            </label>
                                            <input
                                              type="time"
                                              value={b.start}
                                              onChange={(e) =>
                                                updateBreak(day, idx, {
                                                  start: e.target.value,
                                                })
                                              }
                                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                              END
                                            </label>
                                            <input
                                              type="time"
                                              value={b.end}
                                              onChange={(e) =>
                                                updateBreak(day, idx, {
                                                  end: e.target.value,
                                                })
                                              }
                                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            />
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 hover:bg-red-50 justify-self-start sm:justify-self-end"
                                            onClick={() =>
                                              removeBreak(day, idx)
                                            }
                                            aria-label="Remove break"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Slot rules */}
                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <SectionHeader
                      icon={Calendar}
                      title="Appointment Slot Rules"
                      description="Control slot length, buffer time, daily limit, booking notice and cancellation policy."
                    />
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Slot duration
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={data.slotRules.duration}
                              onChange={(e) =>
                                setData((p) => ({
                                  ...p,
                                  slotRules: {
                                    ...p.slotRules,
                                    duration: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {[10, 15, 20, 30, 45, 60].map((n) => (
                                <option key={n} value={n}>
                                  {n} min
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Buffer between slots
                          </label>
                          <select
                            value={data.slotRules.buffer}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                slotRules: {
                                  ...p.slotRules,
                                  buffer: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {[0, 5, 10, 15].map((n) => (
                              <option key={n} value={n}>
                                {n} min
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Max per day
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={data.slotRules.maxPerDay}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                slotRules: {
                                  ...p.slotRules,
                                  maxPerDay: Number(e.target.value),
                                },
                              }))
                            }
                            className="rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Booking notice (hours)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={data.slotRules.bookingNotice}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                slotRules: {
                                  ...p.slotRules,
                                  bookingNotice: Number(e.target.value),
                                },
                              }))
                            }
                            className="rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Cancellation policy (hours before)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={data.slotRules.cancellationHours}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                slotRules: {
                                  ...p.slotRules,
                                  cancellationHours: Number(e.target.value),
                                },
                              }))
                            }
                            className="rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Time off */}
                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-xl bg-slate-50 border border-slate-200 p-2">
                            <Calendar className="h-5 w-5 text-slate-700" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base sm:text-lg text-slate-900">
                              Time Off & Exceptions
                            </CardTitle>
                            <CardDescription className="text-slate-600">
                              Block unavailable periods (leave, surgery,
                              meetings).
                            </CardDescription>
                          </div>
                        </div>

                        <Button
                          onClick={openTimeOff}
                          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add time off
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {timeOffSorted.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                          <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            No time off yet
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Add time off to prevent bookings during unavailable
                            periods.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {timeOffSorted.map((t) => (
                            <div
                              key={t._id || t.id}
                              className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {fmtRange(t.startAt, t.endAt)}
                                  </p>
                                  <p className="text-xs text-slate-600 truncate mt-1">
                                    {t.reason || "No reason"}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:bg-red-50 flex-shrink-0 self-start sm:self-auto"
                                  onClick={() => removeTimeOff(t._id || t.id)}
                                  aria-label="Remove time off"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: preview */}
                <div className="lg:col-span-4">
                  <Card className="rounded-2xl border border-slate-200 shadow-sm lg:sticky lg:top-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg text-slate-900">
                        Weekly Preview
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        How patients see your weekly hours.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {preview.map((x) => (
                          <div
                            key={x.day}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {x.day}
                            </span>
                            <Pill tone={x.open ? "open" : "off"}>
                              {x.label}
                            </Pill>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-600">
                          Tip: Keep your hours consistent to reduce missed
                          appointments.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Dialog: Add Time Off */}
            <Dialog open={timeOffOpen} onOpenChange={setTimeOffOpen}>
              <DialogContent className="sm:max-w-[560px] rounded-2xl border border-slate-200 bg-white text-slate-900 max-h-[85vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="text-slate-900">
                    Add Time Off
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Block a specific time range when you’re unavailable.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Start date
                    </label>
                    <input
                      type="date"
                      value={timeOffStartDate}
                      onChange={(e) => setTimeOffStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Start time
                    </label>
                    <input
                      type="time"
                      value={timeOffStartTime}
                      onChange={(e) => setTimeOffStartTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      End date
                    </label>
                    <input
                      type="date"
                      value={timeOffEndDate}
                      onChange={(e) => setTimeOffEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      End time
                    </label>
                    <input
                      type="time"
                      value={timeOffEndTime}
                      onChange={(e) => setTimeOffEndTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Reason (optional)
                    </label>
                    <textarea
                      value={timeOffReason}
                      onChange={(e) => setTimeOffReason(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Conference, personal leave, surgery"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => setTimeOffOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={addTimeOff}
                    disabled={saving}
                  >
                    {saving ? "Adding…" : "Add time off"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}