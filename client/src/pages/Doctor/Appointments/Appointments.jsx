/**
 * Frontend page: Appointments
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Calendar as CalendarIcon,
//   ChevronLeft,
//   ChevronRight,
//   Clock,
//   MapPin,
//   User,
//   RefreshCcw,
//   XCircle,
//   CheckCircle2,
//   MessageSquare,
//   Ban,
// } from "lucide-react";

// import DoctorNavbar from "@/components/doctor/doctor-navbar";
// import DoctorSidebar from "@/components/doctor/doctor-sidebar";
// import api from "@/services/api";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// function fmt(dt) {
//   try {
//     return new Date(dt).toLocaleString();
//   } catch {
//     return "";
//   }
// }

// function dateToInput(d) {
//   if (!d) return "";
//   const pad = (n) => String(n).padStart(2, "0");
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// }

// function inputToDate(v) {
//   if (!v || typeof v !== "string") return null;
//   const [y, m, d] = v.split("-").map((x) => Number(x));
//   if (!y || !m || !d) return null;
//   return new Date(y, m - 1, d);
// }

// function badgeVariant(status) {
//   const s = String(status || "").toLowerCase();
//   if (s === "pending") return "secondary";
//   if (s === "scheduled") return "default";
//   if (s === "rejected") return "destructive";
//   return "outline";
// }

// function startOfWeek(d) {
//   const x = new Date(d);
//   const day = x.getDay();
//   // Monday-based week: 0(Sun)->6 => offset -6, 1(Mon)->0
//   const diff = (day === 0 ? -6 : 1 - day);
//   x.setDate(x.getDate() + diff);
//   x.setHours(0, 0, 0, 0);
//   return x;
// }

// function addDays(d, n) {
//   const x = new Date(d);
//   x.setDate(x.getDate() + n);
//   return x;
// }

// function dateKey(d) {
//   const x = new Date(d);
//   const pad = (n) => String(n).padStart(2, "0");
//   return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
// }

// function dayNameFromDate(d) {
//   return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(d).getDay()];
// }

// function formatTime(d) {
//   try {
//     return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//   } catch {
//     return "";
//   }
// }

// function MiniAppt({ appt, onSelect }) {
//   const p = appt.patient || {};
//   return (
//     <button
//       onClick={() => onSelect?.(appt)}
//       className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition"
//     >
//       <div className="flex items-start justify-between gap-3">
//         <div className="min-w-0">
//           <p className="font-medium text-slate-900 truncate">{p.name || "Patient"}</p>
//           <p className="text-xs text-slate-600 truncate">{p.email || ""}</p>
//         </div>
//         <div className="text-xs text-slate-600 whitespace-nowrap">{formatTime(appt.datetime)}</div>
//       </div>
//       {appt.location ? <p className="mt-1 text-xs text-slate-600 truncate">{appt.location}</p> : null}
//     </button>
//   );
// }

// function TimeOffPill({ item }) {
//   try {
//     const s = new Date(item.startAt);
//     const e = new Date(item.endAt);
//     const label = `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
//     return (
//       <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700">
//         <span className="font-medium">Blocked:</span> {label}{item.reason ? ` • ${item.reason}` : ""}
//       </div>
//     );
//   } catch {
//     return null;
//   }
// }

// function DayView({ focusDate, appts, timeOff, availability, onSelect }) {
//   const dayName = dayNameFromDate(focusDate);
//   const dayCfg = availability?.weekly?.[dayName];
//   const isWorkingDay = dayCfg ? Boolean(dayCfg.available) : true;

//   return (
//     <div className="space-y-4">
//       {!isWorkingDay ? (
//         <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
//           <p className="font-semibold text-slate-900">Day off</p>
//           <p className="text-sm text-slate-600 mt-1">You are marked as unavailable for {dayName} in Availability settings.</p>
//         </div>
//       ) : null}

//       {(timeOff || []).length ? (
//         <div className="space-y-2">
//           {(timeOff || []).slice(0, 3).map((t) => (
//             <TimeOffPill key={t._id || t.id} item={t} />
//           ))}
//           {(timeOff || []).length > 3 ? (
//             <div className="text-xs text-slate-500">+ {timeOff.length - 3} more blocks</div>
//           ) : null}
//         </div>
//       ) : null}

//       {(appts || []).length === 0 ? (
//         <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
//           <p className="font-semibold text-slate-900">No appointments</p>
//           <p className="text-sm text-slate-600 mt-1">There are no scheduled appointments for this day.</p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {(appts || []).map((a) => (
//             <MiniAppt key={a._id || a.id} appt={a} onSelect={onSelect} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function WeekView({ weekDays, apptsByDayKey, timeOffByDayKey, onSelect, onPickDay }) {
//   return (
//     <div className="overflow-x-auto">
//       <div className="grid grid-cols-7 gap-3 min-w-[980px]">
//         {weekDays.map((d) => {
//           const k = dateKey(d);
//           const appts = apptsByDayKey[k] || [];
//           const offs = timeOffByDayKey[k] || [];
//           const isToday = dateKey(d) === dateKey(new Date());

//           return (
//             <div key={k} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
//               <button
//                 className="w-full text-left flex items-center justify-between gap-2"
//                 onClick={() => onPickDay?.(d)}
//               >
//                 <div>
//                   <p className={`text-sm font-semibold ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>{d.toLocaleDateString([], { weekday: 'short' })}</p>
//                   <p className="text-xs text-slate-600">{d.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {offs.length ? <span className="text-[11px] px-2 py-1 rounded-full bg-slate-200 text-slate-700">{offs.length} blocked</span> : null}
//                   <span className="text-[11px] px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-700">{appts.length}</span>
//                 </div>
//               </button>

//               <div className="mt-3 space-y-2">
//                 {appts.length === 0 ? (
//                   <div className="text-xs text-slate-500">No appointments</div>
//                 ) : (
//                   appts.slice(0, 4).map((a) => <MiniAppt key={a._id || a.id} appt={a} onSelect={onSelect} />)
//                 )}
//                 {appts.length > 4 ? (
//                   <div className="text-xs text-slate-500">+ {appts.length - 4} more</div>
//                 ) : null}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function MonthView({ focusDate, setFocusDate, apptsByDayKey, timeOffByDayKey, onPickDate }) {
//   const year = new Date(focusDate).getFullYear();
//   const month = new Date(focusDate).getMonth();
//   const first = new Date(year, month, 1);
//   const gridStart = startOfWeek(first);
//   const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
//   const todayKey = dateKey(new Date());

//   return (
//     <div className="grid grid-cols-7 gap-2">
//       {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
//         <div key={w} className="text-xs font-semibold text-slate-600 px-2 py-1">{w}</div>
//       ))}
//       {days.map((d) => {
//         const k = dateKey(d);
//         const inMonth = d.getMonth() === month;
//         const appts = apptsByDayKey[k] || [];
//         const offs = timeOffByDayKey[k] || [];
//         const isToday = k === todayKey;
//         const isSelected = k === dateKey(focusDate);
//         return (
//           <button
//             key={k}
//             onClick={() => {
//               setFocusDate(d);
//               onPickDate?.(d);
//             }}
//             className={`rounded-xl border p-2 text-left transition min-h-[78px] ${
//               isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
//             } ${inMonth ? '' : 'opacity-50'}`}
//           >
//             <div className="flex items-center justify-between">
//               <div className={`text-xs font-semibold ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>{d.getDate()}</div>
//               {offs.length ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">B</span> : null}
//             </div>
//             {appts.length ? (
//               <div className="mt-2 text-[11px] text-slate-700">
//                 <div className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 w-fit">
//                   {appts.length} appt
//                 </div>
//               </div>
//             ) : null}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// export default function Appointments() {
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const [activeTab, setActiveTab] = useState("requests"); // requests | schedule
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [items, setItems] = useState([]);
//   const [search, setSearch] = useState("");

//   const [scheduleDate, setScheduleDate] = useState(null);

//   // Calendar scheduling UI
//   const [viewMode, setViewMode] = useState("week"); // week | day | month | list
//   const [focusDate, setFocusDate] = useState(() => new Date());
//   const [selectedAppt, setSelectedAppt] = useState(null);
//   const [availability, setAvailability] = useState(null);
//   const [loadingAvailability, setLoadingAvailability] = useState(false);

//   const [blockOpen, setBlockOpen] = useState(false);
//   const [blockReason, setBlockReason] = useState("");
//   const [blockDate, setBlockDate] = useState(() => dateToInput(new Date()));
//   const [blockStart, setBlockStart] = useState("09:00");
//   const [blockEnd, setBlockEnd] = useState("12:00");

//   const [rejectOpen, setRejectOpen] = useState(false);
//   const [rejectReason, setRejectReason] = useState("");
//   const [activeDecision, setActiveDecision] = useState(null);
//   const [actionMessage, setActionMessage] = useState("");

//   const refresh = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const res = await api.listDoctorAppointments({ status: "pending,scheduled" });
//       setItems(Array.isArray(res) ? res : []);
//     } catch (e) {
//       setError(e?.message || "Failed to load appointments");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const refreshAvailability = async () => {
//     try {
//       setLoadingAvailability(true);
//       const res = await api.getDoctorAvailabilityMe();
//       setAvailability(res || null);
//     } catch {
//       // best-effort: calendar can still render with defaults
//       setAvailability(null);
//     } finally {
//       setLoadingAvailability(false);
//     }
//   };

//   useEffect(() => {
//     refresh();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (activeTab === "schedule" && !availability && !loadingAvailability) {
//       refreshAvailability();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeTab]);

//   const pending = useMemo(() => items.filter((x) => String(x.status).toLowerCase() === "pending"), [items]);
//   const scheduled = useMemo(() => items.filter((x) => String(x.status).toLowerCase() === "scheduled"), [items]);

//   const stats = useMemo(() => {
//     const now = Date.now();
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(today.getDate() + 1);

//     const todays = scheduled.filter((a) => {
//       const t = new Date(a.datetime);
//       return t >= today && t < tomorrow;
//     });

//     const next7 = scheduled.filter((a) => {
//       const t = new Date(a.datetime).getTime();
//       return t >= now && t <= now + 7 * 24 * 60 * 60 * 1000;
//     });

//     return {
//       pending: pending.length,
//       todays: todays.length,
//       upcoming7: next7.length,
//     };
//   }, [pending, scheduled]);

//   const filteredPending = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return pending;
//     return pending.filter((a) => {
//       const p = a.patient || {};
//       return `${p.name || ""} ${p.email || ""} ${a.notes || ""}`.toLowerCase().includes(q);
//     });
//   }, [pending, search]);

//   const filteredScheduled = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     let base = scheduled;

//     if (scheduleDate) {
//       const start = new Date(scheduleDate);
//       start.setHours(0, 0, 0, 0);
//       const end = new Date(start);
//       end.setDate(start.getDate() + 1);
//       base = base.filter((a) => {
//         const t = new Date(a.datetime);
//         return t >= start && t < end;
//       });
//     }

//     if (!q) return base;
//     return base.filter((a) => {
//       const p = a.patient || {};
//       return `${p.name || ""} ${p.email || ""} ${a.location || ""}`.toLowerCase().includes(q);
//     });
//   }, [scheduled, scheduleDate, search]);

//   // Calendar datasets (search applied, date filter handled by view itself)
//   const calendarScheduled = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return scheduled;
//     return scheduled.filter((a) => {
//       const p = a.patient || {};
//       return `${p.name || ""} ${p.email || ""} ${a.location || ""}`.toLowerCase().includes(q);
//     });
//   }, [scheduled, search]);

//   const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate]);
//   const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

//   const apptsByDayKey = useMemo(() => {
//     const map = {};
//     for (const a of calendarScheduled) {
//       const k = dateKey(a.datetime);
//       map[k] = map[k] || [];
//       map[k].push(a);
//     }
//     Object.values(map).forEach((arr) => arr.sort((x, y) => new Date(x.datetime) - new Date(y.datetime)));
//     return map;
//   }, [calendarScheduled]);

//   const timeOffByDayKey = useMemo(() => {
//     const off = Array.isArray(availability?.timeOff) ? availability.timeOff : [];
//     const map = {};
//     for (const t of off) {
//       const s = new Date(t.startAt);
//       const e = new Date(t.endAt);
//       if (isNaN(s.getTime()) || isNaN(e.getTime())) continue;
//       // Add to each day spanned
//       const cur = new Date(s);
//       cur.setHours(0, 0, 0, 0);
//       const endDay = new Date(e);
//       endDay.setHours(0, 0, 0, 0);
//       while (cur <= endDay) {
//         const k = dateKey(cur);
//         map[k] = map[k] || [];
//         map[k].push(t);
//         cur.setDate(cur.getDate() + 1);
//       }
//     }
//     return map;
//   }, [availability]);

//   const decide = async (appointmentId, action, reason = "") => {
//     try {
//       setActionMessage("");
//       await api.decideAppointmentRequest(appointmentId, action, reason);
//       setActionMessage(action === "accept" ? "Appointment accepted ✅" : "Appointment rejected ❌");
//       await refresh();
//     } catch (e) {
//       setActionMessage(e?.message || "Action failed");
//     }
//   };

//   const openReject = (appt) => {
//     setActiveDecision(appt);
//     setRejectReason("");
//     setRejectOpen(true);
//   };

//   const openChat = (appt) => {
//     // Use appointmentId query so the Messages inbox can auto-select it.
//     navigate(`/doctor/messages?appointmentId=${encodeURIComponent(appt._id || appt.id)}`);
//   };

//   const openBlock = (d = focusDate) => {
//     const day = new Date(d);
//     setBlockDate(dateToInput(day));
//     setBlockStart("09:00");
//     setBlockEnd("12:00");
//     setBlockReason("");
//     setBlockOpen(true);
//   };

//   const saveBlock = async () => {
//     const startAt = new Date(`${blockDate}T${blockStart}:00`);
//     const endAt = new Date(`${blockDate}T${blockEnd}:00`);
//     if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || endAt <= startAt) {
//       setActionMessage("Block time end must be after start.");
//       return;
//     }
//     try {
//       await api.addDoctorTimeOff({ startAt: startAt.toISOString(), endAt: endAt.toISOString(), reason: blockReason });
//       setBlockOpen(false);
//       await refreshAvailability();
//       setActionMessage("Time blocked ✅");
//     } catch (e) {
//       setActionMessage(e?.message || "Failed to block time");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       <div className="lg:pl-64">
//         <DoctorNavbar
//           onMenuClick={() => setSidebarOpen(true)}
//           title="Appointments"
//           searchValue={search}
//           onSearchChange={setSearch}
//           searchPlaceholder="Search appointments…"
//         />

//         <main className="p-4 sm:p-6">
//           <div className="max-w-7xl mx-auto space-y-6">
//             {/* Header */}
//             <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
//                 <p className="text-sm text-slate-600 mt-1">Review requests, accept/reject, and manage your upcoming schedule.</p>
//               </div>

//               <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
//                 <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-fit">
//                   <button
//                     onClick={() => setActiveTab("requests")}
//                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       activeTab === "requests" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
//                     }`}
//                   >
//                     Requests <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 rounded-full text-xs bg-white/20">{stats.pending}</span>
//                   </button>
//                   <button
//                     onClick={() => setActiveTab("schedule")}
//                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       activeTab === "schedule" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
//                     }`}
//                   >
//                     Schedule <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 rounded-full text-xs bg-white/20">{scheduled.length}</span>
//                   </button>
//                 </div>

//                 <Button onClick={refresh} variant="outline" className="gap-2">
//                   <RefreshCcw className="w-4 h-4" />
//                   Refresh
//                 </Button>
//               </div>
//             </div>

//             {/* Stats */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               <Card>
//                 <CardHeader className="pb-0">
//                   <CardTitle>Pending requests</CardTitle>
//                   <CardDescription>Needs your decision</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
//                 </CardContent>
//               </Card>
//               <Card>
//                 <CardHeader className="pb-0">
//                   <CardTitle>Today</CardTitle>
//                   <CardDescription>Accepted appointments</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-3xl font-bold text-slate-900">{stats.todays}</p>
//                 </CardContent>
//               </Card>
//               <Card>
//                 <CardHeader className="pb-0">
//                   <CardTitle>Next 7 days</CardTitle>
//                   <CardDescription>Upcoming schedule</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-3xl font-bold text-slate-900">{stats.upcoming7}</p>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Filters */}
//             <Card>
//               <CardContent className="pt-6">
//                 <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
//                   <div className="w-full md:max-w-md">
//                     <Input
//                       value={search}
//                       onChange={(e) => setSearch(e.target.value)}
//                       placeholder={activeTab === "requests" ? "Search requests by patient name/email…" : "Search schedule…"}
//                     />
//                   </div>

//                   {activeTab === "schedule" ? (
//                     <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
//                       <div className="flex items-center gap-2">
//                         <Button
//                           variant="outline"
//                           onClick={() => {
//                             const d = new Date(focusDate);
//                             if (viewMode === "day") d.setDate(d.getDate() - 1);
//                             else if (viewMode === "month") d.setMonth(d.getMonth() - 1);
//                             else d.setDate(d.getDate() - 7);
//                             setFocusDate(d);
//                           }}
//                           className="px-3"
//                         >
//                           <ChevronLeft className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           variant="outline"
//                           onClick={() => setFocusDate(new Date())}
//                         >
//                           Today
//                         </Button>
//                         <Button
//                           variant="outline"
//                           onClick={() => {
//                             const d = new Date(focusDate);
//                             if (viewMode === "day") d.setDate(d.getDate() + 1);
//                             else if (viewMode === "month") d.setMonth(d.getMonth() + 1);
//                             else d.setDate(d.getDate() + 7);
//                             setFocusDate(d);
//                           }}
//                           className="px-3"
//                         >
//                           <ChevronRight className="w-4 h-4" />
//                         </Button>
//                       </div>

//                       <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-fit">
//                         {[
//                           { id: "day", label: "Day" },
//                           { id: "week", label: "Week" },
//                           { id: "month", label: "Month" },
//                           { id: "list", label: "List" },
//                         ].map((x) => (
//                           <button
//                             key={x.id}
//                             onClick={() => setViewMode(x.id)}
//                             className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
//                               viewMode === x.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
//                             }`}
//                           >
//                             {x.label}
//                           </button>
//                         ))}
//                       </div>

//                       {viewMode === "list" ? (
//                         <div className="flex items-center gap-2">
//                           <span className="text-sm text-slate-600">Filter date:</span>
//                           <input
//                             type="date"
//                             value={dateToInput(scheduleDate)}
//                             onChange={(e) => setScheduleDate(inputToDate(e.target.value))}
//                             className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
//                           />
//                           <Button variant="ghost" onClick={() => setScheduleDate(null)} disabled={!scheduleDate}>
//                             Clear
//                           </Button>
//                         </div>
//                       ) : null}

//                       <div className="flex items-center gap-2">
//                         <Button variant="outline" className="gap-2" onClick={() => openBlock(focusDate)}>
//                           <Ban className="w-4 h-4" /> Block time
//                         </Button>
//                         <Button variant="outline" onClick={() => navigate("/doctor/availability")}>
//                           Availability settings
//                         </Button>
//                       </div>
//                     </div>
//                   ) : null}
//                 </div>

//                 {actionMessage ? (
//                   <div className="mt-4 text-sm text-slate-700">
//                     <span className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 inline-block">{actionMessage}</span>
//                   </div>
//                 ) : null}
//               </CardContent>
//             </Card>

//             {/* Content */}
//             {loading ? (
//               <div className="flex items-center justify-center py-16">
//                 <div className="text-center">
//                   <div className="loading loading-spinner loading-lg text-primary"></div>
//                   <p className="mt-3 text-sm text-slate-600">Loading…</p>
//                 </div>
//               </div>
//             ) : error ? (
//               <Card>
//                 <CardContent className="pt-6">
//                   <div className="text-red-700">{error}</div>
//                 </CardContent>
//               </Card>
//             ) : activeTab === "requests" ? (
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Appointment Requests</CardTitle>
//                   <CardDescription>Accept or reject requests to notify the patient automatically.</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {filteredPending.length === 0 ? (
//                     <div className="py-12 text-center">
//                       <p className="text-slate-900 font-semibold">No pending requests</p>
//                       <p className="text-sm text-slate-600 mt-1">New booking requests will appear here.</p>
//                     </div>
//                   ) : (
//                     <div className="space-y-4">
//                       {filteredPending.map((a) => {
//                         const p = a.patient || {};
//                         return (
//                           <div key={a._id || a.id} className="border border-slate-200 rounded-2xl bg-white p-4 sm:p-5">
//                             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//                               <div className="min-w-0">
//                                 <div className="flex flex-wrap items-center gap-2">
//                                   <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
//                                     <User className="w-4 h-4 text-slate-500" />
//                                     {p.name || "Patient"}
//                                   </span>
//                                   <Badge variant={badgeVariant(a.status)}>{String(a.status).toUpperCase()}</Badge>
//                                 </div>
//                                 <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
//                                   <div className="flex items-center gap-2">
//                                     <CalendarIcon className="w-4 h-4 text-slate-500" />
//                                     <span>{fmt(a.datetime)}</span>
//                                   </div>
//                                   <div className="flex items-center gap-2">
//                                     <Clock className="w-4 h-4 text-slate-500" />
//                                     <span className="capitalize">{a.type || "in-person"}</span>
//                                   </div>
//                                   <div className="flex items-center gap-2 sm:col-span-2">
//                                     <MapPin className="w-4 h-4 text-slate-500" />
//                                     <span className="truncate">{a.location || "—"}</span>
//                                   </div>
//                                 </div>

//                                 {a.notes ? (
//                                   <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
//                                     <p className="text-sm text-slate-700">
//                                       <span className="font-semibold">Notes:</span> {a.notes}
//                                     </p>
//                                   </div>
//                                 ) : null}
//                               </div>

//                               <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-[180px]">
//                                 <Button
//                                   className="gap-2"
//                                   onClick={() => decide(a._id || a.id, "accept")}
//                                 >
//                                   <CheckCircle2 className="w-4 h-4" />
//                                   Accept
//                                 </Button>

//                                 <Button
//                                   variant="outline"
//                                   className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
//                                   onClick={() => openReject(a)}
//                                 >
//                                   <XCircle className="w-4 h-4" />
//                                   Reject
//                                 </Button>
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="lg:col-span-2 space-y-6">
//                   <Card>
//                     <CardHeader>
//                       <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
//                         <div>
//                           <CardTitle>Schedule</CardTitle>
//                           <CardDescription>
//                             View accepted appointments by day/week/month. Use “Block time” to add exceptions.
//                           </CardDescription>
//                         </div>
//                         <div className="text-sm text-slate-600">
//                           {viewMode === "month" ? (
//                             <span>{new Date(focusDate).toLocaleString([], { month: "long", year: "numeric" })}</span>
//                           ) : viewMode === "day" ? (
//                             <span>{new Date(focusDate).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</span>
//                           ) : (
//                             <span>
//                               {weekStart.toLocaleDateString()} – {addDays(weekStart, 6).toLocaleDateString()}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </CardHeader>
//                     <CardContent>
//                       {viewMode === "list" ? (
//                         filteredScheduled.length === 0 ? (
//                           <div className="py-12 text-center">
//                             <p className="text-slate-900 font-semibold">No upcoming appointments</p>
//                             <p className="text-sm text-slate-600 mt-1">Accepted bookings will appear here.</p>
//                           </div>
//                         ) : (
//                           <div className="space-y-3">
//                             {filteredScheduled.map((a) => {
//                               const p = a.patient || {};
//                               return (
//                                 <button
//                                   key={a._id || a.id}
//                                   onClick={() => setSelectedAppt(a)}
//                                   className="w-full text-left border border-slate-200 rounded-2xl bg-white p-4 hover:bg-slate-50 transition"
//                                 >
//                                   <div className="flex items-start justify-between gap-4">
//                                     <div className="min-w-0">
//                                       <div className="flex flex-wrap items-center gap-2">
//                                         <span className="font-semibold text-slate-900 truncate">{p.name || "Patient"}</span>
//                                         <Badge variant={badgeVariant(a.status)}>{String(a.status).toUpperCase()}</Badge>
//                                       </div>
//                                       <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
//                                         <div className="flex items-center gap-2">
//                                           <CalendarIcon className="w-4 h-4 text-slate-500" />
//                                           <span>{fmt(a.datetime)}</span>
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                           <Clock className="w-4 h-4 text-slate-500" />
//                                           <span className="capitalize">{a.type || "in-person"}</span>
//                                         </div>
//                                         <div className="flex items-center gap-2 sm:col-span-2">
//                                           <MapPin className="w-4 h-4 text-slate-500" />
//                                           <span className="truncate">{a.location || "—"}</span>
//                                         </div>
//                                       </div>
//                                     </div>
//                                     <div className="text-sm text-slate-500 whitespace-nowrap">
//                                       {new Date(a.datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                                     </div>
//                                   </div>
//                                 </button>
//                               );
//                             })}
//                           </div>
//                         )
//                       ) : viewMode === "month" ? (
//                         <MonthView
//                           focusDate={focusDate}
//                           setFocusDate={setFocusDate}
//                           apptsByDayKey={apptsByDayKey}
//                           timeOffByDayKey={timeOffByDayKey}
//                           onPickDate={() => setViewMode("day")}
//                         />
//                       ) : viewMode === "day" ? (
//                         <DayView
//                           focusDate={focusDate}
//                           appts={apptsByDayKey[dateKey(focusDate)] || []}
//                           timeOff={timeOffByDayKey[dateKey(focusDate)] || []}
//                           availability={availability}
//                           onSelect={setSelectedAppt}
//                         />
//                       ) : (
//                         <WeekView
//                           weekDays={weekDays}
//                           apptsByDayKey={apptsByDayKey}
//                           timeOffByDayKey={timeOffByDayKey}
//                           onSelect={setSelectedAppt}
//                           onPickDay={(d) => {
//                             setFocusDate(d);
//                             setViewMode("day");
//                           }}
//                         />
//                       )}
//                     </CardContent>
//                   </Card>
//                 </div>

//                 <div className="space-y-6">
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>Details</CardTitle>
//                       <CardDescription>Click an appointment in the calendar to see details.</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       {selectedAppt ? (
//                         <div className="space-y-4">
//                           <div>
//                             <p className="text-sm text-slate-600">Patient</p>
//                             <p className="font-semibold text-slate-900">{selectedAppt.patient?.name || "Patient"}</p>
//                             <p className="text-sm text-slate-600">{selectedAppt.patient?.email || ""}</p>
//                           </div>

//                           <div className="grid grid-cols-1 gap-2 text-sm">
//                             <div className="flex items-center gap-2 text-slate-700">
//                               <CalendarIcon className="w-4 h-4 text-slate-500" />
//                               <span>{fmt(selectedAppt.datetime)}</span>
//                             </div>
//                             <div className="flex items-center gap-2 text-slate-700">
//                               <Clock className="w-4 h-4 text-slate-500" />
//                               <span className="capitalize">{selectedAppt.type || "in-person"}</span>
//                             </div>
//                             <div className="flex items-center gap-2 text-slate-700">
//                               <MapPin className="w-4 h-4 text-slate-500" />
//                               <span className="truncate">{selectedAppt.location || "—"}</span>
//                             </div>
//                           </div>

//                           {selectedAppt.notes ? (
//                             <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
//                               <span className="font-semibold">Notes:</span> {selectedAppt.notes}
//                             </div>
//                           ) : null}

//                           <div className="flex flex-col gap-2">
//                             <Button variant="outline" className="gap-2" onClick={() => openChat(selectedAppt)}>
//                               <MessageSquare className="w-4 h-4" /> Open chat
//                             </Button>
//                             <Button variant="ghost" onClick={() => setSelectedAppt(null)}>
//                               Clear selection
//                             </Button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="text-sm text-slate-600">
//                           Select an appointment from the calendar to view details and open the chat.
//                         </div>
//                       )}

//                       <div className="mt-6 text-xs text-slate-500">
//                         Tip: Manage your clinic hours in <span className="font-medium">Availability settings</span>.
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>
//               </div>
//             )}

//             {/* Reject dialog (single instance) */}
//             <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Reject appointment request</DialogTitle>
//                   <DialogDescription>
//                     This will notify the patient. You can optionally add a reason.
//                   </DialogDescription>
//                 </DialogHeader>

//                 <div className="mt-2">
//                   <label className="text-sm font-medium text-slate-700">Reason (optional)</label>
//                   <textarea
//                     value={rejectReason}
//                     onChange={(e) => setRejectReason(e.target.value)}
//                     rows={3}
//                     className="mt-2 w-full resize-none px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="e.g. Not available at that time"
//                   />
//                 </div>

//                 <DialogFooter>
//                   <Button variant="outline" onClick={() => setRejectOpen(false)}>
//                     Cancel
//                   </Button>
//                   <Button
//                     className="bg-red-600 hover:bg-red-700"
//                     onClick={async () => {
//                       const id = activeDecision?._id || activeDecision?.id;
//                       if (!id) return;
//                       setRejectOpen(false);
//                       await decide(id, "reject", rejectReason);
//                     }}
//                   >
//                     Reject
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>

//             {/* Block time dialog */}
//             <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Block time</DialogTitle>
//                   <DialogDescription>
//                     This creates a schedule exception so patients can’t book during this time.
//                   </DialogDescription>
//                 </DialogHeader>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div className="sm:col-span-2">
//                     <label className="block text-sm font-medium text-slate-900 mb-2">Date</label>
//                     <input
//                       type="date"
//                       value={blockDate}
//                       onChange={(e) => setBlockDate(e.target.value)}
//                       className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-slate-900 mb-2">Start time</label>
//                     <input
//                       type="time"
//                       value={blockStart}
//                       onChange={(e) => setBlockStart(e.target.value)}
//                       className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-slate-900 mb-2">End time</label>
//                     <input
//                       type="time"
//                       value={blockEnd}
//                       onChange={(e) => setBlockEnd(e.target.value)}
//                       className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
//                     />
//                   </div>
//                   <div className="sm:col-span-2">
//                     <label className="block text-sm font-medium text-slate-900 mb-2">Reason (optional)</label>
//                     <textarea
//                       value={blockReason}
//                       onChange={(e) => setBlockReason(e.target.value)}
//                       rows={3}
//                       className="w-full resize-none px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       placeholder="e.g. Meeting, surgery, personal time"
//                     />
//                   </div>
//                 </div>

//                 <DialogFooter>
//                   <Button variant="outline" onClick={() => setBlockOpen(false)}>
//                     Cancel
//                   </Button>
//                   <Button className="bg-slate-900 hover:bg-slate-800" onClick={saveBlock}>
//                     Block
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








"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCcw,
  XCircle,
  CheckCircle2,
  MessageSquare,
  Ban,
} from "lucide-react"

import DoctorNavbar from "@/components/doctor/doctor-navbar"
import DoctorSidebar from "@/components/doctor/doctor-sidebar"
import api from "@/services/api"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const cx = (...c) => c.filter(Boolean).join(" ")

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString()
  } catch {
    return ""
  }
}

function dateToInput(d) {
  if (!d) return ""
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function inputToDate(v) {
  if (!v || typeof v !== "string") return null
  const [y, m, d] = v.split("-").map((x) => Number(x))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function badgeVariant(status) {
  const s = String(status || "").toLowerCase()
  if (s === "pending") return "secondary"
  if (s === "scheduled") return "default"
  if (s === "rejected") return "destructive"
  return "outline"
}

function startOfWeek(d) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function dateKey(d) {
  const x = new Date(d)
  const pad = (n) => String(n).padStart(2, "0")
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

function dayNameFromDate(d) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(d).getDay()]
}

function formatTime(d) {
  try {
    return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function MiniAppt({ appt, onSelect, compact = false }) {
  const p = appt.patient || {}
  return (
    <button
      onClick={() => onSelect?.(appt)}
      className={cx(
        "w-full text-left rounded-lg border border-slate-200 bg-white transition hover:shadow-md hover:border-blue-300",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
        compact ? "p-2.5" : "p-3.5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cx("truncate font-semibold text-slate-900", compact ? "text-sm" : "text-base")}>
            {p.name || "Patient"}
          </p>
          <p className={cx("truncate text-slate-500 text-xs", compact ? "text-[11px]" : "")}>{p.email || ""}</p>
        </div>
        <div className={cx("shrink-0 text-blue-600 font-medium", compact ? "text-[11px]" : "text-sm")}>
          {formatTime(appt.datetime)}
        </div>
      </div>
      {appt.location ? (
        <p className="mt-2 text-xs text-slate-500 truncate flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {appt.location}
        </p>
      ) : null}
    </button>
  )
}

function TimeOffPill({ item }) {
  try {
    const s = new Date(item.startAt)
    const e = new Date(item.endAt)
    const label = `${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${e.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
        <span className="font-semibold">Blocked:</span> {label}
        {item.reason ? <span className="text-amber-700"> • {item.reason}</span> : null}
      </div>
    )
  } catch {
    return null
  }
}

function DayView({ focusDate, appts, timeOff, availability, onSelect }) {
  const dayName = dayNameFromDate(focusDate)
  const dayCfg = availability?.weekly?.[dayName]
  const isWorkingDay = dayCfg ? Boolean(dayCfg.available) : true

  return (
    <div className="space-y-4">
      {!isWorkingDay ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="font-semibold text-slate-900">Day off</p>
          <p className="text-sm text-slate-600 mt-1">
            You're marked as unavailable for <span className="font-semibold">{dayName}</span> in Availability settings.
          </p>
        </div>
      ) : null}

      {(timeOff || []).length ? (
        <div className="space-y-2">
          {(timeOff || []).slice(0, 4).map((t) => (
            <TimeOffPill key={t._id || t.id} item={t} />
          ))}
          {(timeOff || []).length > 4 ? (
            <div className="text-xs text-slate-500 px-1">+ {timeOff.length - 4} more blocks</div>
          ) : null}
        </div>
      ) : null}

      {(appts || []).length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-900 mb-1">No appointments scheduled</p>
          <p className="text-sm text-slate-600">This day is wide open. You can add block time if needed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(appts || []).map((a) => (
            <MiniAppt key={a._id || a.id} appt={a} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function WeekView({ weekDays, apptsByDayKey, timeOffByDayKey, onSelect, onPickDay }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-3">
      {weekDays.map((d) => {
        const k = dateKey(d)
        const appts = apptsByDayKey[k] || []
        const offs = timeOffByDayKey[k] || []
        const isToday = dateKey(d) === dateKey(new Date())

        return (
          <div
            key={k}
            className={cx(
              "rounded-lg border transition flex flex-col overflow-hidden",
              isToday ? "border-blue-400 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:shadow-md",
            )}
          >
            <button
              className="w-full text-left flex items-start justify-between gap-2 p-3 border-b border-inherit"
              onClick={() => onPickDay?.(d)}
            >
              <div>
                <p className={cx("text-sm font-bold", isToday ? "text-blue-700" : "text-slate-900")}>
                  {d.toLocaleDateString([], { weekday: "short" })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {d.toLocaleDateString([], { month: "short", day: "numeric" })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {offs.length ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {offs.length} blocked
                  </span>
                ) : null}
                <span
                  className={cx(
                    "text-[11px] px-2.5 py-1 rounded-full font-bold text-white",
                    appts.length > 0 ? "bg-blue-600" : "bg-slate-300",
                  )}
                >
                  {appts.length}
                </span>
              </div>
            </button>

            <div className="p-3 space-y-2 flex-1">
              {appts.length === 0 ? (
                <div className="text-xs text-slate-400 rounded-lg p-2 text-center">No appointments</div>
              ) : (
                appts.slice(0, 4).map((a) => <MiniAppt key={a._id || a.id} appt={a} onSelect={onSelect} compact />)
              )}
              {appts.length > 4 ? <div className="text-xs text-slate-500 px-1">+ {appts.length - 4} more</div> : null}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-t border-inherit bg-transparent"
              onClick={() => onPickDay?.(d)}
            >
              Open day
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ focusDate, setFocusDate, apptsByDayKey, timeOffByDayKey, onPickDate }) {
  const year = new Date(focusDate).getFullYear()
  const month = new Date(focusDate).getMonth()
  const first = new Date(year, month, 1)
  const gridStart = startOfWeek(first)
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const todayKey = dateKey(new Date())

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
        <div key={w} className="text-[10px] sm:text-xs font-bold text-slate-600 px-1 sm:px-2 py-2 text-center">
          {w}
        </div>
      ))}
      {days.map((d) => {
        const k = dateKey(d)
        const inMonth = d.getMonth() === month
        const appts = apptsByDayKey[k] || []
        const offs = timeOffByDayKey[k] || []
        const isToday = k === todayKey
        const isSelected = k === dateKey(focusDate)

        return (
          <button
            key={k}
            onClick={() => {
              setFocusDate(d)
              onPickDate?.(d)
            }}
            className={cx(
              "rounded-lg border p-1 sm:p-2 text-left transition min-h-[64px] sm:min-h-[90px] flex flex-col",
              isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50",
              inMonth ? "" : "opacity-40",
              isToday ? "ring-2 ring-blue-300 ring-offset-1" : "",
            )}
            title={`${d.toLocaleDateString()} • ${appts.length} appointments${offs.length ? ` • ${offs.length} blocked` : ""}`}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className={cx("text-xs sm:text-sm font-bold", isToday ? "text-blue-700" : "text-slate-900")}>
                {d.getDate()}
              </div>
              {offs.length ? (
                <span className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  B
                </span>
              ) : null}
            </div>
            {appts.length ? (
              <div className="flex-1 flex items-center justify-start overflow-hidden">
                <span className="text-[9px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium whitespace-nowrap">
                  {appts.length} appt{appts.length > 1 ? "s" : ""}
                </span>
              </div>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export default function Appointments() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [activeTab, setActiveTab] = useState("requests")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")

  const [scheduleDate, setScheduleDate] = useState(null)

  const [viewMode, setViewMode] = useState("week")
  const [focusDate, setFocusDate] = useState(() => new Date())
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  const [blockOpen, setBlockOpen] = useState(false)
  const [blockReason, setBlockReason] = useState("")
  const [blockDate, setBlockDate] = useState(() => dateToInput(new Date()))
  const [blockStart, setBlockStart] = useState("09:00")
  const [blockEnd, setBlockEnd] = useState("12:00")

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [activeDecision, setActiveDecision] = useState(null)
  const [actionMessage, setActionMessage] = useState("")

  const refresh = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await api.listDoctorAppointments({ status: "pending,scheduled" })
      setItems(Array.isArray(res) ? res : [])
    } catch (e) {
      setError(e?.message || "Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  const refreshAvailability = async () => {
    try {
      setLoadingAvailability(true)
      const res = await api.getDoctorAvailabilityMe()
      setAvailability(res || null)
    } catch {
      setAvailability(null)
    } finally {
      setLoadingAvailability(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (activeTab === "schedule" && !availability && !loadingAvailability) {
      refreshAvailability()
    }
  }, [activeTab])

  const pending = useMemo(() => items.filter((x) => String(x.status).toLowerCase() === "pending"), [items])
  const scheduled = useMemo(() => items.filter((x) => String(x.status).toLowerCase() === "scheduled"), [items])

  const stats = useMemo(() => {
    const now = Date.now()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const todays = scheduled.filter((a) => {
      const t = new Date(a.datetime)
      return t >= today && t < tomorrow
    })

    const next7 = scheduled.filter((a) => {
      const t = new Date(a.datetime).getTime()
      return t >= now && t <= now + 7 * 24 * 60 * 60 * 1000
    })

    return { pending: pending.length, todays: todays.length, upcoming7: next7.length }
  }, [pending, scheduled])

  const filteredPending = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pending
    return pending.filter((a) => {
      const p = a.patient || {}
      return `${p.name || ""} ${p.email || ""} ${a.notes || ""}`.toLowerCase().includes(q)
    })
  }, [pending, search])

  const filteredScheduled = useMemo(() => {
    const q = search.trim().toLowerCase()
    let base = scheduled

    if (scheduleDate) {
      const start = new Date(scheduleDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 1)
      base = base.filter((a) => {
        const t = new Date(a.datetime)
        return t >= start && t < end
      })
    }

    if (!q) return base
    return base.filter((a) => {
      const p = a.patient || {}
      return `${p.name || ""} ${p.email || ""} ${a.location || ""}`.toLowerCase().includes(q)
    })
  }, [scheduled, scheduleDate, search])

  const calendarScheduled = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return scheduled
    return scheduled.filter((a) => {
      const p = a.patient || {}
      return `${p.name || ""} ${p.email || ""} ${a.location || ""}`.toLowerCase().includes(q)
    })
  }, [scheduled, search])

  const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const apptsByDayKey = useMemo(() => {
    const map = {}
    for (const a of calendarScheduled) {
      const k = dateKey(a.datetime)
      map[k] = map[k] || []
      map[k].push(a)
    }
    Object.values(map).forEach((arr) => arr.sort((x, y) => new Date(x.datetime) - new Date(y.datetime)))
    return map
  }, [calendarScheduled])

  const timeOffByDayKey = useMemo(() => {
    const off = Array.isArray(availability?.timeOff) ? availability.timeOff : []
    const map = {}
    for (const t of off) {
      const s = new Date(t.startAt)
      const e = new Date(t.endAt)
      if (isNaN(s.getTime()) || isNaN(e.getTime())) continue

      const cur = new Date(s)
      cur.setHours(0, 0, 0, 0)
      const endDay = new Date(e)
      endDay.setHours(0, 0, 0, 0)

      while (cur <= endDay) {
        const k = dateKey(cur)
        map[k] = map[k] || []
        map[k].push(t)
        cur.setDate(cur.getDate() + 1)
      }
    }
    return map
  }, [availability])

  const decide = async (appointmentId, action, reason = "") => {
    try {
      setActionMessage("")
      await api.decideAppointmentRequest(appointmentId, action, reason)
      setActionMessage(action === "accept" ? "Appointment accepted ✅" : "Appointment rejected ❌")
      await refresh()
    } catch (e) {
      setActionMessage(e?.message || "Action failed")
    }
  }

  const openReject = (appt) => {
    setActiveDecision(appt)
    setRejectReason("")
    setRejectOpen(true)
  }

  const openChat = (appt) => {
    navigate(`/doctor/messages?appointmentId=${encodeURIComponent(appt._id || appt.id)}`)
  }

  const openBlock = (d = focusDate) => {
    const day = new Date(d)
    setBlockDate(dateToInput(day))
    setBlockStart("09:00")
    setBlockEnd("12:00")
    setBlockReason("")
    setBlockOpen(true)
  }

  const saveBlock = async () => {
    const startAt = new Date(`${blockDate}T${blockStart}:00`)
    const endAt = new Date(`${blockDate}T${blockEnd}:00`)
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || endAt <= startAt) {
      setActionMessage("Block time end must be after start.")
      return
    }
    try {
      await api.addDoctorTimeOff({ startAt: startAt.toISOString(), endAt: endAt.toISOString(), reason: blockReason })
      setBlockOpen(false)
      await refreshAvailability()
      setActionMessage("Time blocked ✅")
    } catch (e) {
      setActionMessage(e?.message || "Failed to block time")
    }
  }

  const dateLabel = useMemo(() => {
    if (viewMode === "month") return new Date(focusDate).toLocaleString([], { month: "long", year: "numeric" })
    if (viewMode === "day")
      return new Date(focusDate).toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    return `${weekStart.toLocaleDateString()} – ${addDays(weekStart, 6).toLocaleDateString()}`
  }, [focusDate, viewMode, weekStart])

  return (
    <div className="min-h-screen bg-slate-50">
      <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DoctorNavbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Appointments"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by patient name, email, or location…"
        />

        <main className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Appointments</h1>
                <p className="text-sm text-slate-600 mt-2">
                  Review requests, accept or reject, and manage your upcoming schedule efficiently.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 w-full sm:w-auto overflow-hidden shadow-sm">
                  <button
                    onClick={() => setActiveTab("requests")}
                    className={cx(
                      "flex-1 sm:flex-none px-4 py-2.5 rounded-md text-sm font-semibold transition",
                      activeTab === "requests"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    Requests
                    <span
                      className={cx(
                        "ml-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-xs font-bold",
                        activeTab === "requests" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {stats.pending}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("schedule")}
                    className={cx(
                      "flex-1 sm:flex-none px-4 py-2.5 rounded-md text-sm font-semibold transition",
                      activeTab === "schedule"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    Schedule
                    <span
                      className={cx(
                        "ml-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-xs font-bold",
                        activeTab === "schedule" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {stats.upcoming7}
                    </span>
                  </button>
                </div>

                <Button onClick={refresh} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {activeTab === "requests" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-blue-900">Pending Requests</CardTitle>
                    <CardDescription className="text-xs text-blue-700">Awaiting your decision</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-green-900">Today</CardTitle>
                    <CardDescription className="text-xs text-green-700">Accepted appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{stats.todays}</div>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-amber-900">Next 7 Days</CardTitle>
                    <CardDescription className="text-xs text-amber-700">Upcoming schedule</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">{stats.upcoming7}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "requests" && (
              <Card>
                <CardHeader className="border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Appointment Requests</CardTitle>
                      <CardDescription>Review and respond to pending appointment requests</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 text-center">
                      <p className="text-slate-600">Loading requests...</p>
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                  ) : filteredPending.length === 0 ? (
                    <div className="p-12 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="font-semibold text-slate-900 mb-1">All caught up!</p>
                      <p className="text-sm text-slate-600">You have no pending appointment requests.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {filteredPending.map((a) => (
                        <div key={a._id || a.id} className="p-4 sm:p-6 hover:bg-slate-50 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 truncate">{a.patient?.name || "Unknown"}</p>
                              <p className="text-sm text-slate-600 truncate">{a.patient?.email || ""}</p>
                              {a.notes && <p className="text-sm text-slate-600 mt-1">{a.notes}</p>}
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                {a.datetime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(a.datetime).toLocaleString()}
                                  </span>
                                )}
                                {a.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {a.location}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                              <Button
                                onClick={() => decide(a._id || a.id, "accept")}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Accept
                              </Button>
                              <Button onClick={() => openReject(a)} size="sm" variant="outline" className="gap-2">
                                <XCircle className="w-4 h-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle>Schedule</CardTitle>
                        <CardDescription>View and manage your accepted appointments</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["day", "week", "month"].map((m) => (
                          <Button
                            key={m}
                            onClick={() => setViewMode(m)}
                            size="sm"
                            variant={viewMode === m ? "default" : "outline"}
                            className="capitalize"
                          >
                            {m}
                          </Button>
                        ))}
                        <Button onClick={() => openBlock()} size="sm" variant="outline" className="gap-2">
                          <Ban className="w-4 h-4" />
                          Block time
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                          onClick={() =>
                            setFocusDate(addDays(focusDate, viewMode === "month" ? -30 : viewMode === "week" ? -7 : -1))
                          }
                          size="sm"
                          variant="outline"
                          className="p-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setFocusDate(new Date())} size="sm" variant="outline">
                          Today
                        </Button>
                        <Button
                          onClick={() =>
                            setFocusDate(addDays(focusDate, viewMode === "month" ? 30 : viewMode === "week" ? 7 : 1))
                          }
                          size="sm"
                          variant="outline"
                          className="p-2"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold text-slate-600">{dateLabel}</p>
                    </div>

                    {/* Calendar Views */}
                    {viewMode === "week" && (
                      <WeekView
                        weekDays={weekDays}
                        apptsByDayKey={apptsByDayKey}
                        timeOffByDayKey={timeOffByDayKey}
                        onSelect={setSelectedAppt}
                        onPickDay={(d) => {
                          setFocusDate(d)
                          setViewMode("day")
                        }}
                      />
                    )}
                    {viewMode === "day" && (
                      <DayView
                        focusDate={focusDate}
                        appts={apptsByDayKey[dateKey(focusDate)] || []}
                        timeOff={timeOffByDayKey[dateKey(focusDate)] || []}
                        availability={availability}
                        onSelect={setSelectedAppt}
                      />
                    )}
                    {viewMode === "month" && (
                      <MonthView
                        focusDate={focusDate}
                        setFocusDate={setFocusDate}
                        apptsByDayKey={apptsByDayKey}
                        timeOffByDayKey={timeOffByDayKey}
                        onPickDate={() => setViewMode("day")}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Selected appointment details */}
                {selectedAppt && (
                  <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader className="border-b border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Appointment Details</CardTitle>
                          <CardDescription>Patient: {selectedAppt.patient?.name}</CardDescription>
                        </div>
                        <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-600">
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Patient</p>
                          <p className="text-sm font-semibold text-slate-900">{selectedAppt.patient?.name}</p>
                          <p className="text-xs text-slate-600">{selectedAppt.patient?.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Date & Time</p>
                          <p className="text-sm text-slate-900">{fmt(selectedAppt.datetime)}</p>
                        </div>
                        {selectedAppt.location && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 uppercase">Location</p>
                            <p className="text-sm text-slate-900">{selectedAppt.location}</p>
                          </div>
                        )}
                        {selectedAppt.notes && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 uppercase">Notes</p>
                            <p className="text-sm text-slate-900">{selectedAppt.notes}</p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button onClick={() => openChat(selectedAppt)} className="gap-2 flex-1">
                            <MessageSquare className="w-4 h-4" />
                            Open Chat
                          </Button>
                          <Button onClick={() => setSelectedAppt(null)} variant="outline" className="flex-1">
                            Close
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {actionMessage && (
              <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
                {actionMessage}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Block time dialog */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block Time</DialogTitle>
            <DialogDescription>Set your unavailable time slots</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Date</label>
              <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Start Time</label>
                <Input
                  type="time"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">End Time</label>
                <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Reason (optional)</label>
              <Input
                placeholder="e.g., Lunch break, Conference"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBlock} className="bg-blue-600 hover:bg-blue-700">
              Block Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject appointment dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Appointment</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this appointment</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-xs font-semibold text-slate-700">Rejection Reason</label>
            <Input
              placeholder="Tell the patient why you're rejecting this appointment…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (activeDecision) {
                  decide(activeDecision._id || activeDecision.id, "reject", rejectReason)
                  setRejectOpen(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
