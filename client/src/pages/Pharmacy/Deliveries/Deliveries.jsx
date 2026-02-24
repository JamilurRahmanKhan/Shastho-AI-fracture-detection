/**
 * Frontend page: Deliveries
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
// import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
// import { MapPin, Truck, Eye, Users, Plus, X, Save, Trash2 } from "lucide-react";
// import api from "@/services/api";

// const DELIVERY_LABEL = {
//   pending_rider: "Pending Rider",
//   assigned: "Assigned",
//   picked_up: "Picked Up",
//   out_for_delivery: "Out for Delivery",
//   delivered: "Delivered",
//   failed: "Failed",
//   returned: "Returned",
// };

// function statusBadge(status) {
//   const s = status || "pending_rider";
//   if (s === "out_for_delivery") return <Badge className="bg-blue-100 text-blue-800">Out for Delivery</Badge>;
//   if (s === "assigned") return <Badge className="bg-purple-100 text-purple-800">Assigned</Badge>;
//   if (s === "picked_up") return <Badge className="bg-indigo-100 text-indigo-800">Picked Up</Badge>;
//   if (s === "delivered") return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
//   if (s === "failed") return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
//   if (s === "returned") return <Badge className="bg-amber-100 text-amber-800">Returned</Badge>;
//   return <Badge className="bg-gray-100 text-gray-800">Pending Rider</Badge>;
// }

// function Modal({ open, onClose, title, children }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-50">
//       <div className="absolute inset-0 bg-black/30" onClick={onClose} />
//       <div className="absolute inset-0 flex items-center justify-center p-4">
//         <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100">
//           <div className="flex items-center justify-between p-4 border-b">
//             <h3 className="text-lg font-bold text-gray-900">{title}</h3>
//             <button
//               onClick={onClose}
//               className="p-2 rounded-xl hover:bg-gray-100"
//               aria-label="Close"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//           <div className="p-4">{children}</div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function Deliveries() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [items, setItems] = useState([]);

//   const [statusFilter, setStatusFilter] = useState("");
//   const [q, setQ] = useState("");

//   const [riders, setRiders] = useState([]);
//   const [ridersLoading, setRidersLoading] = useState(false);
//   const [ridersError, setRidersError] = useState("");

//   const [assignOpen, setAssignOpen] = useState(false);
//   const [assignTarget, setAssignTarget] = useState(null);
//   const [assignRiderId, setAssignRiderId] = useState("");
//   const [assignEta, setAssignEta] = useState("");
//   const [assignErr, setAssignErr] = useState("");
//   const [assignBusy, setAssignBusy] = useState(false);

//   const [ridersOpen, setRidersOpen] = useState(false);
//   const [newRider, setNewRider] = useState({ name: "", phone: "", vehicleType: "" });
//   const [riderBusy, setRiderBusy] = useState(false);

//   const [statusBusyId, setStatusBusyId] = useState("");

//   async function loadDeliveries() {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await api.listPharmacyDeliveries({ status: statusFilter, q });
//       setItems(res?.items || []);
//     } catch (e) {
//       setError(e?.message || "Failed to load deliveries");
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadRiders() {
//     setRidersLoading(true);
//     setRidersError("");
//     try {
//       const res = await api.listDeliveryRiders();
//       setRiders(res?.items || []);
//     } catch (e) {
//       setRidersError(e?.message || "Failed to load riders");
//     } finally {
//       setRidersLoading(false);
//     }
//   }

//   useEffect(() => {
//     // initial load
//     loadDeliveries();
//     loadRiders();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const filtered = useMemo(() => {
//     const query = q.trim().toLowerCase();
//     if (!query) return items;
//     return items.filter((it) => String(it.orderNo || "").toLowerCase().includes(query));
//   }, [items, q]);

//   const activeRiders = useMemo(() => riders.filter((r) => r.isActive), [riders]);

//   function openAssign(deliveryItem) {
//     setAssignTarget(deliveryItem);
//     setAssignRiderId("");
//     setAssignEta(deliveryItem?.delivery?.etaMinutes ? String(deliveryItem.delivery.etaMinutes) : "");
//     setAssignErr("");
//     setAssignOpen(true);
//   }

//   async function doAssign() {
//     if (!assignTarget) return;
//     setAssignErr("");
//     if (!assignRiderId) {
//       setAssignErr("Please select a rider.");
//       return;
//     }
//     const etaNum = assignEta.trim() === "" ? null : Number(assignEta);
//     if (assignEta.trim() !== "" && (!Number.isFinite(etaNum) || etaNum < 0)) {
//       setAssignErr("ETA must be a non-negative number (minutes).");
//       return;
//     }
//     setAssignBusy(true);
//     try {
//       await api.assignDeliveryRider(assignTarget.orderNo, { riderId: assignRiderId, etaMinutes: etaNum });
//       setAssignOpen(false);
//       await loadDeliveries();
//     } catch (e) {
//       setAssignErr(e?.message || "Failed to assign rider");
//     } finally {
//       setAssignBusy(false);
//     }
//   }

//   async function updateStatus(orderNo, nextStatus) {
//     setStatusBusyId(orderNo);
//     try {
//       await api.updateDeliveryStatus(orderNo, { status: nextStatus });
//       await loadDeliveries();
//     } catch (e) {
//       alert(e?.message || "Failed to update delivery status");
//     } finally {
//       setStatusBusyId("");
//     }
//   }

//   async function createRider() {
//     setRiderBusy(true);
//     try {
//       const name = newRider.name.trim();
//       if (!name) {
//         setRidersError("Rider name is required.");
//         return;
//       }
//       await api.createDeliveryRider({
//         name,
//         phone: newRider.phone.trim(),
//         vehicleType: newRider.vehicleType.trim(),
//       });
//       setNewRider({ name: "", phone: "", vehicleType: "" });
//       await loadRiders();
//     } catch (e) {
//       setRidersError(e?.message || "Failed to create rider");
//     } finally {
//       setRiderBusy(false);
//     }
//   }

//   async function toggleRider(r) {
//     setRiderBusy(true);
//     try {
//       await api.updateDeliveryRider(r.id, { isActive: !r.isActive });
//       await loadRiders();
//     } catch (e) {
//       setRidersError(e?.message || "Failed to update rider");
//     } finally {
//       setRiderBusy(false);
//     }
//   }

//   async function removeRider(r) {
//     const ok = confirm(`Delete rider "${r.name}"?`);
//     if (!ok) return;
//     setRiderBusy(true);
//     try {
//       await api.deleteDeliveryRider(r.id);
//       await loadRiders();
//     } catch (e) {
//       setRidersError(e?.message || "Failed to delete rider");
//     } finally {
//       setRiderBusy(false);
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       <div className="lg:pl-64">
//         <PharmacyNavbar
//           onMenuClick={() => setSidebarOpen(true)}
//           searchValue={q}
//           onSearchChange={setQ}
//           searchPlaceholder="Search deliveries by order ID…"
//         />

//         <main className="p-6 space-y-6">
//           <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
//             <div>
//               <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Delivery Management</h1>
//               <p className="text-gray-600 mt-2">Manage orders and track delivery status</p>
//             </div>

//             <Button
//               className="bg-teal-600 hover:bg-teal-700 w-fit"
//               onClick={() => {
//                 setRidersOpen(true);
//                 loadRiders();
//               }}
//             >
//               <Users className="w-4 h-4 mr-2" />
//               Manage Riders
//             </Button>
//           </div>

//           <Card className="p-4">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Search by Order ID</label>
//                 <input
//                   value={q}
//                   onChange={(e) => setQ(e.target.value)}
//                   className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
//                   placeholder="e.g. ORD-001"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Status</label>
//                 <select
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                   className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200"
//                 >
//                   <option value="">All</option>
//                   {Object.keys(DELIVERY_LABEL).map((s) => (
//                     <option key={s} value={s}>{DELIVERY_LABEL[s]}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex items-end gap-2">
//                 <Button
//                   variant="outline"
//                   className="bg-transparent"
//                   onClick={() => {
//                     setQ("");
//                     setStatusFilter("");
//                     loadDeliveries();
//                   }}
//                 >
//                   Reset
//                 </Button>
//                 <Button className="bg-teal-600 hover:bg-teal-700" onClick={loadDeliveries}>
//                   Refresh
//                 </Button>
//               </div>
//             </div>
//           </Card>

//           {loading ? (
//             <div className="text-sm text-gray-600">Loading deliveries...</div>
//           ) : error ? (
//             <div className="text-sm text-red-600">{error}</div>
//           ) : filtered.length === 0 ? (
//             <div className="text-sm text-gray-600">No deliveries found.</div>
//           ) : (
//             <div className="space-y-4">
//               {filtered.map((it) => {
//                 const d = it.delivery || {};
//                 const deliveryStatus = d.status || "pending_rider";
//                 const riderName = d.riderName || "—";
//                 const eta = d.etaMinutes === null || typeof d.etaMinutes === "undefined" ? "—" : `${d.etaMinutes} min`;
//                 return (
//                   <Card key={it.id} className="p-6">
//                     <div className="grid lg:grid-cols-5 gap-6 items-start">
//                       <div>
//                         <p className="text-sm text-gray-600 mb-1">Order ID</p>
//                         <p className="font-semibold text-gray-900">{it.orderNo}</p>
//                         <p className="text-xs text-gray-500 mt-1">Order: {it.orderStatus}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-600 mb-1">Customer</p>
//                         <p className="font-semibold text-gray-900">{String(it.userUid || "").slice(0, 10) || "—"}</p>
//                         <p className="text-xs text-gray-500 mt-1">Phone: {it.phone || "—"}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
//                         <div className="flex items-start gap-1">
//                           <MapPin className="w-4 h-4 text-teal-600 mt-0.5" />
//                           <p className="font-semibold text-gray-900 line-clamp-2">{it.shippingAddress || "—"}</p>
//                         </div>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-600 mb-1">Assigned Rider</p>
//                         <p className="font-semibold text-gray-900">{riderName}</p>
//                         <p className="text-xs text-gray-500 mt-1">ETA: {eta}</p>
//                       </div>
//                       <div className="lg:text-right">
//                         {statusBadge(deliveryStatus)}
//                       </div>
//                     </div>

//                     <div className="mt-6 flex flex-col gap-3">
//                       <div className="flex flex-col sm:flex-row gap-2">
//                         <Link to={`/pharmacy/orders/${encodeURIComponent(it.orderNo)}`} className="flex-1">
//                           <Button size="sm" variant="outline" className="w-full bg-transparent">
//                             <Eye className="w-4 h-4 mr-2" />
//                             View Order
//                           </Button>
//                         </Link>

//                         {deliveryStatus === "pending_rider" ? (
//                           <Button
//                             size="sm"
//                             className="flex-1 bg-teal-600 hover:bg-teal-700"
//                             onClick={() => openAssign(it)}
//                           >
//                             <Truck className="w-4 h-4 mr-2" />
//                             Assign Rider
//                           </Button>
//                         ) : (
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             className="flex-1 bg-transparent"
//                             onClick={() => openAssign(it)}
//                           >
//                             <Truck className="w-4 h-4 mr-2" />
//                             Reassign Rider
//                           </Button>
//                         )}
//                       </div>

//                       <div className="flex flex-wrap gap-2">
//                         <span className="text-xs font-semibold text-gray-600 mr-2">Update status:</span>
//                         {deliveryStatus !== "delivered" && (
//                           <>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               className="bg-transparent"
//                               disabled={statusBusyId === it.orderNo || deliveryStatus === "picked_up" || deliveryStatus === "pending_rider"}
//                               onClick={() => updateStatus(it.orderNo, "picked_up")}
//                               title={deliveryStatus === "pending_rider" ? "Assign rider first" : ""}
//                             >
//                               Picked up
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               className="bg-transparent"
//                               disabled={statusBusyId === it.orderNo || deliveryStatus === "out_for_delivery" || deliveryStatus === "pending_rider"}
//                               onClick={() => updateStatus(it.orderNo, "out_for_delivery")}
//                               title={deliveryStatus === "pending_rider" ? "Assign rider first" : ""}
//                             >
//                               Out for delivery
//                             </Button>
//                             <Button
//                               size="sm"
//                               className="bg-green-600 hover:bg-green-700"
//                               disabled={statusBusyId === it.orderNo || deliveryStatus === "pending_rider"}
//                               onClick={() => updateStatus(it.orderNo, "delivered")}
//                               title={deliveryStatus === "pending_rider" ? "Assign rider first" : ""}
//                             >
//                               Delivered
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               className="bg-transparent"
//                               disabled={statusBusyId === it.orderNo}
//                               onClick={() => updateStatus(it.orderNo, "failed")}
//                             >
//                               Failed
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               className="bg-transparent"
//                               disabled={statusBusyId === it.orderNo}
//                               onClick={() => updateStatus(it.orderNo, "returned")}
//                             >
//                               Returned
//                             </Button>
//                           </>
//                         )}
//                         {statusBusyId === it.orderNo && (
//                           <span className="text-xs text-gray-500">Updating...</span>
//                         )}
//                       </div>
//                     </div>
//                   </Card>
//                 );
//               })}
//             </div>
//           )}
//         </main>
//       </div>

//       {/* Assign rider modal */}
//       <Modal
//         open={assignOpen}
//         onClose={() => (assignBusy ? null : setAssignOpen(false))}
//         title={assignTarget ? `Assign rider — ${assignTarget.orderNo}` : "Assign rider"}
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-1">Rider</label>
//             <select
//               value={assignRiderId}
//               onChange={(e) => setAssignRiderId(e.target.value)}
//               className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200"
//             >
//               <option value="">Select rider</option>
//               {activeRiders.map((r) => (
//                 <option key={r.id} value={r.id}>
//                   {r.name}{r.phone ? ` — ${r.phone}` : ""}
//                 </option>
//               ))}
//             </select>
//             <p className="text-xs text-gray-500 mt-1">
//               Tip: add riders from “Manage Riders” if this list is empty.
//             </p>
//           </div>

//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-1">ETA (minutes, optional)</label>
//             <input
//               value={assignEta}
//               onChange={(e) => setAssignEta(e.target.value)}
//               className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
//               placeholder="e.g. 45"
//             />
//           </div>

//           {assignErr && <div className="text-sm text-red-600">{assignErr}</div>}

//           <div className="flex justify-end gap-2">
//             <Button variant="outline" className="bg-transparent" onClick={() => setAssignOpen(false)} disabled={assignBusy}>
//               Cancel
//             </Button>
//             <Button className="bg-teal-600 hover:bg-teal-700" onClick={doAssign} disabled={assignBusy}>
//               <Save className="w-4 h-4 mr-2" />
//               {assignBusy ? "Saving..." : "Assign"}
//             </Button>
//           </div>
//         </div>
//       </Modal>

//       {/* Riders modal */}
//       <Modal open={ridersOpen} onClose={() => (riderBusy ? null : setRidersOpen(false))} title="Delivery Riders">
//         <div className="space-y-4">
//           <Card className="p-3">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
//               <input
//                 value={newRider.name}
//                 onChange={(e) => setNewRider((s) => ({ ...s, name: e.target.value }))}
//                 className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
//                 placeholder="Rider name"
//               />
//               <input
//                 value={newRider.phone}
//                 onChange={(e) => setNewRider((s) => ({ ...s, phone: e.target.value }))}
//                 className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
//                 placeholder="Phone (optional)"
//               />
//               <input
//                 value={newRider.vehicleType}
//                 onChange={(e) => setNewRider((s) => ({ ...s, vehicleType: e.target.value }))}
//                 className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
//                 placeholder="Vehicle (optional)"
//               />
//             </div>
//             <div className="mt-2 flex justify-end">
//               <Button className="bg-teal-600 hover:bg-teal-700" onClick={createRider} disabled={riderBusy}>
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add Rider
//               </Button>
//             </div>
//           </Card>

//           {ridersError && <div className="text-sm text-red-600">{ridersError}</div>}

//           {ridersLoading ? (
//             <div className="text-sm text-gray-600">Loading riders...</div>
//           ) : riders.length === 0 ? (
//             <div className="text-sm text-gray-600">No riders yet. Add one above.</div>
//           ) : (
//             <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
//               {riders.map((r) => (
//                 <Card key={r.id} className="p-3">
//                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                     <div>
//                       <div className="font-semibold text-gray-900">{r.name}</div>
//                       <div className="text-xs text-gray-600">
//                         {r.phone ? `Phone: ${r.phone}` : ""}
//                         {r.vehicleType ? `${r.phone ? " • " : ""}Vehicle: ${r.vehicleType}` : ""}
//                       </div>
//                     </div>
//                     <div className="flex gap-2">
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         className="bg-transparent"
//                         onClick={() => toggleRider(r)}
//                         disabled={riderBusy}
//                       >
//                         {r.isActive ? "Deactivate" : "Activate"}
//                       </Button>
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         className="bg-transparent"
//                         onClick={() => removeRider(r)}
//                         disabled={riderBusy}
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           )}

//           <div className="flex justify-end">
//             <Button variant="outline" className="bg-transparent" onClick={() => setRidersOpen(false)} disabled={riderBusy}>
//               Close
//             </Button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }



import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
import { MapPin, Truck, Eye, Users, Plus, X, Save, Trash2, RefreshCw } from "lucide-react";
import api from "@/services/api";

const DELIVERY_LABEL = {
  pending_rider: "Pending Rider",
  assigned: "Assigned",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Failed",
  returned: "Returned",
};

function StatusBadge({ status }) {
  const s = status || "pending_rider";
  if (s === "pending_rider")
    return <Badge className="border border-slate-200 bg-slate-100 text-slate-800">Pending rider</Badge>;
  if (s === "assigned")
    return <Badge className="border border-blue-200 bg-blue-100 text-blue-900">Assigned</Badge>;
  if (s === "picked_up")
    return <Badge className="border border-indigo-200 bg-indigo-100 text-indigo-900">Picked up</Badge>;
  if (s === "out_for_delivery")
    return <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-900">Out for delivery</Badge>;
  if (s === "delivered")
    return <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-900">Delivered</Badge>;
  if (s === "failed")
    return <Badge className="border border-red-200 bg-red-100 text-red-900">Failed</Badge>;
  if (s === "returned")
    return <Badge className="border border-amber-200 bg-amber-100 text-amber-900">Returned</Badge>;
  return <Badge className="border border-slate-200 bg-slate-100 text-slate-800">{s}</Badge>;
}

/** ✅ Perfect outline button (same style you liked) */
const outlineBtn =
  "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 " +
  "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

/** ✅ Solid primary button for green theme */
const primaryBtn =
  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm " +
  "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

/** ✅ Input/select styling */
const fieldBase =
  "w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-900 " +
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300";

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-white">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* ✅ Scrollable body on mobile */}
          <div className="p-4 sm:p-5 max-h-[75vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Deliveries() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");

  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [ridersError, setRidersError] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignRiderId, setAssignRiderId] = useState("");
  const [assignEta, setAssignEta] = useState("");
  const [assignErr, setAssignErr] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);

  const [ridersOpen, setRidersOpen] = useState(false);
  const [newRider, setNewRider] = useState({ name: "", phone: "", vehicleType: "" });
  const [riderBusy, setRiderBusy] = useState(false);

  const [statusBusyId, setStatusBusyId] = useState("");

  async function loadDeliveries() {
    setLoading(true);
    setError("");
    try {
      const res = await api.listPharmacyDeliveries({ status: statusFilter, q });
      setItems(res?.items || []);
    } catch (e) {
      setError(e?.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }

  async function loadRiders() {
    setRidersLoading(true);
    setRidersError("");
    try {
      const res = await api.listDeliveryRiders();
      setRiders(res?.items || []);
    } catch (e) {
      setRidersError(e?.message || "Failed to load riders");
    } finally {
      setRidersLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveries();
    loadRiders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it) => String(it.orderNo || "").toLowerCase().includes(query));
  }, [items, q]);

  const activeRiders = useMemo(() => riders.filter((r) => r.isActive), [riders]);

  function openAssign(deliveryItem) {
    setAssignTarget(deliveryItem);
    setAssignRiderId("");
    setAssignEta(deliveryItem?.delivery?.etaMinutes ? String(deliveryItem.delivery.etaMinutes) : "");
    setAssignErr("");
    setAssignOpen(true);
  }

  async function doAssign() {
    if (!assignTarget) return;
    setAssignErr("");
    if (!assignRiderId) {
      setAssignErr("Please select a rider.");
      return;
    }
    const etaNum = assignEta.trim() === "" ? null : Number(assignEta);
    if (assignEta.trim() !== "" && (!Number.isFinite(etaNum) || etaNum < 0)) {
      setAssignErr("ETA must be a non-negative number (minutes).");
      return;
    }
    setAssignBusy(true);
    try {
      await api.assignDeliveryRider(assignTarget.orderNo, { riderId: assignRiderId, etaMinutes: etaNum });
      setAssignOpen(false);
      await loadDeliveries();
    } catch (e) {
      setAssignErr(e?.message || "Failed to assign rider");
    } finally {
      setAssignBusy(false);
    }
  }

  async function updateStatus(orderNo, nextStatus) {
    setStatusBusyId(orderNo);
    try {
      await api.updateDeliveryStatus(orderNo, { status: nextStatus });
      await loadDeliveries();
    } catch (e) {
      alert(e?.message || "Failed to update delivery status");
    } finally {
      setStatusBusyId("");
    }
  }

  async function createRider() {
    setRiderBusy(true);
    try {
      const name = newRider.name.trim();
      if (!name) {
        setRidersError("Rider name is required.");
        return;
      }
      await api.createDeliveryRider({
        name,
        phone: newRider.phone.trim(),
        vehicleType: newRider.vehicleType.trim(),
      });
      setNewRider({ name: "", phone: "", vehicleType: "" });
      await loadRiders();
    } catch (e) {
      setRidersError(e?.message || "Failed to create rider");
    } finally {
      setRiderBusy(false);
    }
  }

  async function toggleRider(r) {
    setRiderBusy(true);
    try {
      await api.updateDeliveryRider(r.id, { isActive: !r.isActive });
      await loadRiders();
    } catch (e) {
      setRidersError(e?.message || "Failed to update rider");
    } finally {
      setRiderBusy(false);
    }
  }

  async function removeRider(r) {
    const ok = confirm(`Delete rider "${r.name}"?`);
    if (!ok) return;
    setRiderBusy(true);
    try {
      await api.deleteDeliveryRider(r.id);
      await loadRiders();
    } catch (e) {
      setRidersError(e?.message || "Failed to delete rider");
    } finally {
      setRiderBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <PharmacyNavbar
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search deliveries by order ID…"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                Delivery Management
              </h1>
              <p className="text-gray-700 mt-1">Manage orders and track delivery status</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className={`${outlineBtn} gap-2`}
                onClick={loadDeliveries}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                className={`${primaryBtn}`}
                onClick={() => {
                  setRidersOpen(true);
                  loadRiders();
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Riders
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-4 sm:p-5 border-gray-200 shadow-sm bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-5">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  Search by Order ID
                </label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={fieldBase}
                  placeholder="e.g. ORD-001"
                />
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  Delivery Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={fieldBase}
                >
                  <option value="">All</option>
                  {Object.keys(DELIVERY_LABEL).map((s) => (
                    <option key={s} value={s}>
                      {DELIVERY_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3 flex items-end gap-2">
                <Button
                  variant="outline"
                  className={`w-full ${outlineBtn}`}
                  onClick={() => {
                    setQ("");
                    setStatusFilter("");
                    loadDeliveries();
                  }}
                >
                  Reset
                </Button>
                <Button className={`w-full ${primaryBtn}`} onClick={loadDeliveries}>
                  Refresh
                </Button>
              </div>
            </div>
          </Card>

          {/* States */}
          {loading ? (
            <Card className="p-6 text-sm text-gray-700">Loading deliveries…</Card>
          ) : error ? (
            <Card className="p-6 text-sm text-red-800 border border-red-200 bg-red-50">{error}</Card>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-sm text-gray-700">No deliveries found.</Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((it) => {
                const d = it.delivery || {};
                const deliveryStatus = d.status || "pending_rider";
                const riderName = d.riderName || "—";
                const eta =
                  d.etaMinutes === null || typeof d.etaMinutes === "undefined" ? "—" : `${d.etaMinutes} min`;

                const requiresRider = deliveryStatus === "pending_rider";
                const busy = statusBusyId === it.orderNo;

                return (
                  <Card key={it.id || it.orderNo} className="p-4 sm:p-6 border-gray-200 shadow-sm bg-white">
                    {/* Top row */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="text-sm sm:text-base font-extrabold text-gray-900">
                            Order: {it.orderNo}
                          </div>
                          <StatusBadge status={deliveryStatus} />
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700 mt-1">
                          Order status: <span className="font-semibold text-gray-900">{it.orderStatus || "—"}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link to={`/pharmacy/orders/${encodeURIComponent(it.orderNo)}`} className="w-full sm:w-auto">
                          <Button variant="outline" className={`${outlineBtn} w-full sm:w-auto`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Order
                          </Button>
                        </Link>

                        {requiresRider ? (
                          <Button className={`${primaryBtn} w-full sm:w-auto`} onClick={() => openAssign(it)}>
                            <Truck className="w-4 h-4 mr-2" />
                            Assign Rider
                          </Button>
                        ) : (
                          <Button variant="outline" className={`${outlineBtn} w-full sm:w-auto`} onClick={() => openAssign(it)}>
                            <Truck className="w-4 h-4 mr-2" />
                            Reassign Rider
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Customer</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {String(it.userUid || "").slice(0, 10) || "—"}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">Phone: {it.phone || "—"}</p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Address</p>
                        <div className="mt-1 flex gap-2">
                          <MapPin className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{it.shippingAddress || "—"}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Rider</p>
                        <p className="mt-1 font-semibold text-gray-900">{riderName}</p>
                        <p className="text-xs text-gray-700 mt-1">ETA: {eta}</p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Delivery</p>
                        <p className="mt-1 font-semibold text-gray-900">{DELIVERY_LABEL[deliveryStatus] || "—"}</p>
                        <p className="text-xs text-gray-700 mt-1">{busy ? "Updating…" : " "}</p>
                      </div>
                    </div>

                    {/* Status actions */}
                    {deliveryStatus !== "delivered" && (
                      <div className="mt-5">
                        <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                          Update status
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={outlineBtn}
                            disabled={busy || deliveryStatus === "picked_up" || requiresRider}
                            onClick={() => updateStatus(it.orderNo, "picked_up")}
                            title={requiresRider ? "Assign rider first" : ""}
                          >
                            Picked up
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className={outlineBtn}
                            disabled={busy || deliveryStatus === "out_for_delivery" || requiresRider}
                            onClick={() => updateStatus(it.orderNo, "out_for_delivery")}
                            title={requiresRider ? "Assign rider first" : ""}
                          >
                            Out for delivery
                          </Button>

                          <Button
                            size="sm"
                            className={primaryBtn}
                            disabled={busy || requiresRider}
                            onClick={() => updateStatus(it.orderNo, "delivered")}
                            title={requiresRider ? "Assign rider first" : ""}
                          >
                            Delivered
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white text-red-700 border-red-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                            disabled={busy}
                            onClick={() => updateStatus(it.orderNo, "failed")}
                          >
                            Failed
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className={outlineBtn}
                            disabled={busy}
                            onClick={() => updateStatus(it.orderNo, "returned")}
                          >
                            Returned
                          </Button>
                        </div>

                        {requiresRider && (
                          <div className="mt-2 text-xs text-gray-700">
                            Tip: assign a rider first to enable delivery status updates.
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Assign rider modal */}
      <Modal
        open={assignOpen}
        onClose={() => (assignBusy ? null : setAssignOpen(false))}
        title={assignTarget ? `Assign rider — ${assignTarget.orderNo}` : "Assign rider"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Rider</label>
            <select
              value={assignRiderId}
              onChange={(e) => setAssignRiderId(e.target.value)}
              className={fieldBase}
            >
              <option value="">Select rider</option>
              {activeRiders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.phone ? ` — ${r.phone}` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-700 mt-1">
              If the list is empty, add riders from <span className="font-semibold text-gray-900">Manage Riders</span>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
              ETA (minutes, optional)
            </label>
            <input
              value={assignEta}
              onChange={(e) => setAssignEta(e.target.value)}
              className={fieldBase}
              placeholder="e.g. 45"
              inputMode="numeric"
            />
          </div>

          {assignErr && <div className="text-sm text-red-800 border border-red-200 bg-red-50 rounded-lg p-3">{assignErr}</div>}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" className={`${outlineBtn} w-full sm:w-auto`} onClick={() => setAssignOpen(false)} disabled={assignBusy}>
              Cancel
            </Button>
            <Button className={`${primaryBtn} w-full sm:w-auto`} onClick={doAssign} disabled={assignBusy}>
              <Save className="w-4 h-4 mr-2" />
              {assignBusy ? "Saving…" : "Assign"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Riders modal */}
      <Modal open={ridersOpen} onClose={() => (riderBusy ? null : setRidersOpen(false))} title="Delivery Riders">
        <div className="space-y-4">
          <Card className="p-4 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={newRider.name}
                onChange={(e) => setNewRider((s) => ({ ...s, name: e.target.value }))}
                className={fieldBase}
                placeholder="Rider name *"
              />
              <input
                value={newRider.phone}
                onChange={(e) => setNewRider((s) => ({ ...s, phone: e.target.value }))}
                className={fieldBase}
                placeholder="Phone (optional)"
              />
              <input
                value={newRider.vehicleType}
                onChange={(e) => setNewRider((s) => ({ ...s, vehicleType: e.target.value }))}
                className={fieldBase}
                placeholder="Vehicle (optional)"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button className={primaryBtn} onClick={createRider} disabled={riderBusy}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rider
              </Button>
            </div>
          </Card>

          {ridersError && (
            <div className="text-sm text-red-800 border border-red-200 bg-red-50 rounded-lg p-3">{ridersError}</div>
          )}

          {ridersLoading ? (
            <Card className="p-4 text-sm text-gray-700">Loading riders…</Card>
          ) : riders.length === 0 ? (
            <Card className="p-4 text-sm text-gray-700">No riders yet. Add one above.</Card>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
              {riders.map((r) => (
                <Card key={r.id} className="p-3 border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-700 mt-1">
                        {r.phone ? `Phone: ${r.phone}` : ""}
                        {r.vehicleType ? `${r.phone ? " • " : ""}Vehicle: ${r.vehicleType}` : ""}
                      </div>
                      <div className="mt-2">
                        <Badge className={r.isActive ? "bg-emerald-100 text-emerald-900 border border-emerald-200" : "bg-slate-100 text-slate-800 border border-slate-200"}>
                          {r.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`${outlineBtn} w-full sm:w-auto`}
                        onClick={() => toggleRider(r)}
                        disabled={riderBusy}
                      >
                        {r.isActive ? "Deactivate" : "Activate"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white text-red-700 border-red-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 w-full sm:w-auto"
                        onClick={() => removeRider(r)}
                        disabled={riderBusy}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" className={outlineBtn} onClick={() => setRidersOpen(false)} disabled={riderBusy}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}