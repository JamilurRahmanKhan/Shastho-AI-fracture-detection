/**
 * Frontend page: AIRecommendations
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
// import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { RefreshCw, Download, ShoppingCart, AlertTriangle, Package, Flame, CheckCircle2 } from "lucide-react";
// import api from "@/services/api";

// const LS_REORDER = "shastho_pharmacy_reorder_list_v1";
// const LS_PRIORITY = "shastho_pharmacy_priority_sale_v1";

// function toNum(x, fallback = 0) {
//   const n = Number(x);
//   return Number.isFinite(n) ? n : fallback;
// }

// function daysUntil(iso) {
//   if (!iso) return null;
//   const t = new Date(iso).getTime();
//   if (Number.isNaN(t)) return null;
//   const diff = t - Date.now();
//   return Math.ceil(diff / (1000 * 60 * 60 * 24));
// }

// function csvEscape(v) {
//   const s = String(v ?? "");
//   if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
//   return s;
// }

// function downloadText(filename, text, type = "text/plain;charset=utf-8") {
//   const blob = new Blob([text], { type });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   setTimeout(() => URL.revokeObjectURL(url), 500);
// }

// function PriorityBadge({ level }) {
//   const cls =
//     level === "high"
//       ? "bg-red-100 text-red-700"
//       : level === "medium"
//         ? "bg-orange-100 text-orange-700"
//         : "bg-gray-100 text-gray-700";
//   const label = level === "high" ? "High" : level === "medium" ? "Medium" : "Low";
//   return <Badge className={cls}>{label}</Badge>;
// }

// export default function AIRecommendations() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const [activeTab, setActiveTab] = useState("Restock");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [inventory, setInventory] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [deliveries, setDeliveries] = useState([]);
//   const [reports, setReports] = useState(null);
//   const [reorderList, setReorderList] = useState(() => {
//     try {
//       const raw = localStorage.getItem(LS_REORDER);
//       const parsed = raw ? JSON.parse(raw) : [];
//       return Array.isArray(parsed) ? parsed : [];
//     } catch {
//       return [];
//     }
//   });

//   const [prioritySale, setPrioritySale] = useState(() => {
//     try {
//       const raw = localStorage.getItem(LS_PRIORITY);
//       const parsed = raw ? JSON.parse(raw) : [];
//       return Array.isArray(parsed) ? parsed : [];
//     } catch {
//       return [];
//     }
//   });

//   const [toast, setToast] = useState(null);

//   useEffect(() => {
//     try {
//       localStorage.setItem(LS_REORDER, JSON.stringify(reorderList));
//     } catch {
//       // ignore
//     }
//   }, [reorderList]);

//   useEffect(() => {
//     try {
//       localStorage.setItem(LS_PRIORITY, JSON.stringify(prioritySale));
//     } catch {
//       // ignore
//     }
//   }, [prioritySale]);

//   useEffect(() => {
//     if (!toast) return;
//     const t = setTimeout(() => setToast(null), 2500);
//     return () => clearTimeout(t);
//   }, [toast]);

//   const load = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const [invRes, orderRes, delivRes, repRes] = await Promise.all([
//         api.listPharmacyInventory({ limit: 200 }),
//         api.listPharmacyOrders({ limit: 200 }),
//         api.listPharmacyDeliveries({ limit: 200 }),
//         api.getPharmacyReportsOverview({ rangeDays: 7, topDays: 30 }).catch(() => null),
//       ]);

//       setInventory(Array.isArray(invRes?.items) ? invRes.items : Array.isArray(invRes) ? invRes : []);
//       setOrders(Array.isArray(orderRes?.items) ? orderRes.items : Array.isArray(orderRes) ? orderRes : []);
//       setDeliveries(Array.isArray(delivRes?.items) ? delivRes.items : Array.isArray(delivRes) ? delivRes : []);
//       setReports(repRes);
//     } catch (e) {
//       setError(e?.message || "Failed to load AI recommendations");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const qLower = String(query || "").trim().toLowerCase();

//   const topSelling = useMemo(() => {
//     const rows = (reports?.topSellingProducts || []).map((x) => ({
//       name: x.name,
//       value: toNum(x.value, 0),
//     }));
//     const map = new Map();
//     rows.forEach((r) => map.set(String(r.name || "").toLowerCase(), r.value));
//     return { rows, map };
//   }, [reports]);

//   const lowStock = useMemo(() => {
//     const rows = (inventory || []).map((m) => {
//       const stock = toNum(m.stock, 0);
//       const reorderLevel = toNum(m.reorderLevel, 0);
//       const topScore = topSelling.map.get(String(m.name || "").toLowerCase()) || 0;
//       const priority = stock <= 0 || (stock <= reorderLevel && topScore > 0) ? "high" : stock <= reorderLevel ? "medium" : "low";
//       const suggested = Math.max(reorderLevel * 2, reorderLevel + 5);
//       return {
//         ...m,
//         stock,
//         reorderLevel,
//         topScore,
//         priority,
//         suggestedQty: Math.max(0, suggested - stock),
//       };
//     });
//     const filtered = rows.filter((r) => r.stock <= r.reorderLevel);
//     const q = qLower;
//     const qFiltered = !q
//       ? filtered
//       : filtered.filter((r) => {
//           const hay = [r.name, r.category, r.manufacturer, r.status].map((x) => String(x || "").toLowerCase()).join(" ");
//           return hay.includes(q);
//         });
//     return qFiltered.sort((a, b) => (a.priority === b.priority ? b.topScore - a.topScore : a.priority === "high" ? -1 : a.priority === "medium" && b.priority === "low" ? -1 : 1));
//   }, [inventory, topSelling.map, qLower]);

//   const expiringSoon = useMemo(() => {
//     const rows = (inventory || [])
//       .map((m) => {
//         const d = daysUntil(m.expiryDate);
//         return { ...m, daysLeft: d };
//       })
//       .filter((m) => typeof m.daysLeft === "number" && m.daysLeft <= 60);
//     const q = qLower;
//     const filtered = !q
//       ? rows
//       : rows.filter((r) => {
//           const hay = [r.name, r.category, r.manufacturer].map((x) => String(x || "").toLowerCase()).join(" ");
//           return hay.includes(q);
//         });
//     return filtered.sort((a, b) => a.daysLeft - b.daysLeft);
//   }, [inventory, qLower]);

//   const fulfillmentAlerts = useMemo(() => {
//     const pendingOrders = (orders || []).filter((o) => String(o.status || "").toLowerCase() === "pending");
//     const pendingDeliveries = (deliveries || []).filter((d) => {
//       const status = String(d.status || "").toLowerCase();
//       return status === "pending" || status === "pending rider" || status === "pending_rider";
//     });

//     const q = qLower;
//     const filterByQ = (arr, pick) => {
//       if (!q) return arr;
//       return arr.filter((x) => pick(x).toLowerCase().includes(q));
//     };

//     return {
//       pendingOrders: filterByQ(pendingOrders, (o) => [o.orderNo, o.phone, o.address].map((x) => String(x || "")).join(" ")),
//       pendingDeliveries: filterByQ(pendingDeliveries, (d) => [d.orderNo, d.customerName, d.customerPhone].map((x) => String(x || "")).join(" ")),
//     };
//   }, [orders, deliveries, qLower]);

//   const reorderCount = reorderList.length;
//   const lowStockCount = lowStock.length;
//   const expiringCount = expiringSoon.length;
//   const pendingOrderCount = (orders || []).filter((o) => String(o.status || "").toLowerCase() === "pending").length;

//   const tabs = [
//     { key: "Restock", icon: Package },
//     { key: "Expiry", icon: AlertTriangle },
//     { key: "Fulfillment", icon: ShoppingCart },
//     { key: "Insights", icon: Flame },
//   ];

//   const addToReorder = (item) => {
//     const id = item?._id || item?.id || item?.name;
//     setReorderList((prev) => {
//       if (prev.some((x) => (x._id || x.id || x.name) === id)) return prev;
//       return [...prev, { id: item._id || item.id || null, name: item.name, suggestedQty: item.suggestedQty || 0, category: item.category || "" }];
//     });
//   };

//   const removeFromReorder = (idOrName) => {
//     setReorderList((prev) => prev.filter((x) => (x.id || x.name) !== idOrName));
//   };

//   const togglePrioritySale = (idOrName) => {
//     setPrioritySale((prev) => {
//       const exists = prev.includes(idOrName);
//       const next = exists ? prev.filter((x) => x !== idOrName) : [...prev, idOrName];
//       setToast({
//         type: "success",
//         message: exists ? "Removed from priority sale" : "Marked for priority sale",
//       });
//       return next;
//     });
//   };

//   const exportReorderCSV = () => {
//     const rows = [
//       ["Medicine", "Category", "SuggestedQty"],
//       ...reorderList.map((r) => [r.name, r.category || "", r.suggestedQty || 0]),
//     ];
//     const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
//     downloadText(`reorder-list-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       <div className="lg:pl-64">
//         <PharmacyNavbar
//           onMenuClick={() => setSidebarOpen(true)}
//           searchValue={query}
//           onSearchChange={setQuery}
//           searchPlaceholder="Search medicines, orders, deliveries…"
//         />

//         <main className="p-6 lg:p-8 space-y-6">
//           <div className="flex items-start justify-between gap-4">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">AI Recommendations</h1>
//               <p className="text-gray-600 mt-1">
//                 Smart suggestions for restocking, expiry risk, and order fulfillment. (Decision support — verify before action.)
//               </p>
//             </div>
//             <div className="flex items-center gap-2">
//               <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
//                 <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//                 Refresh
//               </Button>
//               <Button variant="outline" onClick={exportReorderCSV} disabled={!reorderList.length} className="gap-2">
//                 <Download className="w-4 h-4" />
//                 Export Reorder
//               </Button>
//             </div>
//           </div>

//           {toast && (
//             <Card className={toast.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
//               <CardContent className={`p-4 ${toast.type === "success" ? "text-green-700" : "text-red-700"}`}>{toast.message}</CardContent>
//             </Card>
//           )}

//           {error && (
//             <Card className="border-red-200 bg-red-50">
//               <CardContent className="p-4 text-red-700">{error}</CardContent>
//             </Card>
//           )}

//           {/* Summary */}
//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm text-gray-600">Low Stock</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{loading ? "—" : lowStockCount}</div>
//                 <p className="text-xs text-gray-600 mt-1">Items at / below reorder level</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm text-gray-600">Expiring Soon</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{loading ? "—" : expiringCount}</div>
//                 <p className="text-xs text-gray-600 mt-1">Expiry within 60 days</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm text-gray-600">Pending Orders</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{loading ? "—" : pendingOrderCount}</div>
//                 <p className="text-xs text-gray-600 mt-1">Needs processing</p>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm text-gray-600">Reorder List</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{reorderCount}</div>
//                 <p className="text-xs text-gray-600 mt-1">Saved locally for export</p>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Tabs */}
//           <div className="flex flex-wrap gap-2">
//             {tabs.map((t) => {
//               const Icon = t.icon;
//               const isActive = activeTab === t.key;
//               return (
//                 <Button
//                   key={t.key}
//                   variant={isActive ? "default" : "outline"}
//                   className={isActive ? "bg-teal-600 hover:bg-teal-700 gap-2" : "bg-transparent gap-2"}
//                   onClick={() => setActiveTab(t.key)}
//                 >
//                   <Icon className="w-4 h-4" />
//                   {t.key}
//                 </Button>
//               );
//             })}
//           </div>

//           {/* Content */}
//           {loading ? (
//             <Card>
//               <CardContent className="p-6 text-gray-600">Loading recommendations…</CardContent>
//             </Card>
//           ) : activeTab === "Restock" ? (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Restock Recommendations</CardTitle>
//                 <p className="text-sm text-gray-600">Based on reorder levels and recent demand signals.</p>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 {lowStock.length === 0 ? (
//                   <div className="text-gray-600">No low-stock items found.</div>
//                 ) : (
//                   lowStock.map((m) => {
//                     const id = m._id || m.id || m.name;
//                     const inList = reorderList.some((x) => (x.id || x.name) === (m._id || m.id || m.name));
//                     return (
//                       <div key={id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border bg-white">
//                         <div className="min-w-0">
//                           <div className="flex items-center gap-2 flex-wrap">
//                             <div className="font-semibold text-gray-900 truncate">{m.name}</div>
//                             <PriorityBadge level={m.priority} />
//                             {m.topScore > 0 ? <Badge className="bg-blue-100 text-blue-700">Top seller</Badge> : null}
//                           </div>
//                           <div className="text-sm text-gray-600 mt-1">
//                             Stock: <span className="font-semibold text-gray-900">{m.stock}</span> • Reorder level: {m.reorderLevel} • Suggested reorder: {m.suggestedQty}
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Button
//                             variant="outline"
//                             className="bg-transparent"
//                             onClick={() => addToReorder(m)}
//                             disabled={inList}
//                           >
//                             {inList ? (
//                               <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Added</span>
//                             ) : (
//                               <span className="inline-flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Add to reorder</span>
//                             )}
//                           </Button>
//                           <Link to="/pharmacy/inventory">
//                             <Button className="bg-teal-600 hover:bg-teal-700">Open inventory</Button>
//                           </Link>
//                         </div>
//                       </div>
//                     );
//                   })
//                 )}

//                 {reorderList.length ? (
//                   <div className="pt-4 border-t">
//                     <div className="flex items-center justify-between gap-3">
//                       <div>
//                         <div className="font-semibold text-gray-900">Saved reorder list</div>
//                         <div className="text-sm text-gray-600">Export it to share with suppliers.</div>
//                       </div>
//                       <Button variant="outline" onClick={exportReorderCSV} className="gap-2">
//                         <Download className="w-4 h-4" /> Export CSV
//                       </Button>
//                     </div>
//                     <div className="mt-3 grid gap-2">
//                       {reorderList.map((r) => (
//                         <div key={r.id || r.name} className="flex items-center justify-between p-3 rounded-lg border bg-white">
//                           <div className="text-sm text-gray-900 font-medium">{r.name}</div>
//                           <div className="flex items-center gap-3">
//                             <div className="text-sm text-gray-600">Qty: <span className="font-semibold text-gray-900">{r.suggestedQty}</span></div>
//                             <Button variant="outline" className="bg-transparent" onClick={() => removeFromReorder(r.id || r.name)}>Remove</Button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ) : null}
//               </CardContent>
//             </Card>
//           ) : activeTab === "Expiry" ? (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Expiry Risk</CardTitle>
//                 <p className="text-sm text-gray-600">Items expiring within 60 days — consider discounts or priority sale.</p>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 {expiringSoon.length === 0 ? (
//                   <div className="text-gray-600">No items expiring within the next 60 days.</div>
//                 ) : (
//                   expiringSoon.map((m) => {
//                     const id = m._id || m.id || m.name;
//                     const daysLeft = m.daysLeft;
//                     const isCritical = typeof daysLeft === "number" && daysLeft <= 14;
//                     const marked = prioritySale.includes(id);
//                     return (
//                       <div key={id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border bg-white">
//                         <div className="min-w-0">
//                           <div className="flex items-center gap-2 flex-wrap">
//                             <div className="font-semibold text-gray-900 truncate">{m.name}</div>
//                             <Badge className={isCritical ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}>
//                               {daysLeft} days left
//                             </Badge>
//                             {marked ? <Badge className="bg-teal-100 text-teal-700">Priority sale</Badge> : null}
//                           </div>
//                           <div className="text-sm text-gray-600 mt-1">
//                             Expiry: <span className="font-semibold text-gray-900">{String(m.expiryDate || "").slice(0, 10)}</span> • Stock: {toNum(m.stock, 0)}
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Link to="/pharmacy/inventory">
//                             <Button variant="outline" className="bg-transparent">Review</Button>
//                           </Link>
//                           <Button
//                             className={marked ? "bg-gray-900 hover:bg-black" : "bg-teal-600 hover:bg-teal-700"}
//                             onClick={() => togglePrioritySale(id)}
//                           >
//                             {marked ? "Unmark" : "Mark for priority sale"}
//                           </Button>
//                         </div>
//                       </div>
//                     );
//                   })
//                 )}
//               </CardContent>
//             </Card>
//           ) : activeTab === "Fulfillment" ? (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Fulfillment Alerts</CardTitle>
//                 <p className="text-sm text-gray-600">Orders & deliveries that likely need immediate attention.</p>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div className="space-y-3">
//                   <div className="font-semibold text-gray-900">Pending Orders ({fulfillmentAlerts.pendingOrders.length})</div>
//                   {fulfillmentAlerts.pendingOrders.length === 0 ? (
//                     <div className="text-gray-600">No pending orders.</div>
//                   ) : (
//                     fulfillmentAlerts.pendingOrders.slice(0, 10).map((o) => (
//                       <div key={o.id || o.orderNo} className="flex items-center justify-between p-4 rounded-xl border bg-white">
//                         <div className="min-w-0">
//                           <div className="font-semibold text-gray-900">{o.orderNo}</div>
//                           <div className="text-sm text-gray-600">Phone: {o.phone || "—"}</div>
//                         </div>
//                         <Link to="/pharmacy/orders">
//                           <Button className="bg-teal-600 hover:bg-teal-700">Open orders</Button>
//                         </Link>
//                       </div>
//                     ))
//                   )}
//                 </div>

//                 <div className="space-y-3">
//                   <div className="font-semibold text-gray-900">Deliveries waiting for rider ({fulfillmentAlerts.pendingDeliveries.length})</div>
//                   {fulfillmentAlerts.pendingDeliveries.length === 0 ? (
//                     <div className="text-gray-600">No deliveries are waiting for rider assignment.</div>
//                   ) : (
//                     fulfillmentAlerts.pendingDeliveries.slice(0, 10).map((d) => (
//                       <div key={d.id || d.orderNo} className="flex items-center justify-between p-4 rounded-xl border bg-white">
//                         <div className="min-w-0">
//                           <div className="font-semibold text-gray-900">{d.orderNo}</div>
//                           <div className="text-sm text-gray-600">Customer: {d.customerName || "—"}</div>
//                         </div>
//                         <Link to="/pharmacy/deliveries">
//                           <Button variant="outline" className="bg-transparent">Open deliveries</Button>
//                         </Link>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           ) : (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Demand Insights</CardTitle>
//                 <p className="text-sm text-gray-600">Quick view of top sellers (from reports) to guide stocking decisions.</p>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 {topSelling.rows.length === 0 ? (
//                   <div className="text-gray-600">No sales insights available yet.</div>
//                 ) : (
//                   topSelling.rows
//                     .filter((r) => (!qLower ? true : String(r.name || "").toLowerCase().includes(qLower)))
//                     .slice(0, 12)
//                     .map((r) => (
//                       <div key={r.name} className="flex items-center justify-between p-4 rounded-xl border bg-white">
//                         <div className="min-w-0">
//                           <div className="font-semibold text-gray-900">{r.name}</div>
//                           <div className="text-sm text-gray-600">Units sold (approx): {r.value}</div>
//                         </div>
//                         <Link to="/pharmacy/reports">
//                           <Button variant="outline" className="bg-transparent">Open reports</Button>
//                         </Link>
//                       </div>
//                     ))
//                 )}
//               </CardContent>
//             </Card>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }




import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Download,
  ShoppingCart,
  AlertTriangle,
  Package,
  Flame,
  CheckCircle2,
  X,
  Bell,
} from "lucide-react";
import api from "@/services/api";

const LS_REORDER = "shastho_pharmacy_reorder_list_v1";
const LS_PRIORITY = "shastho_pharmacy_priority_sale_v1";

function toNum(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function daysUntil(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diff = t - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
  return s;
}

function downloadText(filename, text, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function PriorityBadge({ level }) {
  const cls =
    level === "high"
      ? "bg-red-50 text-red-700 border-red-100"
      : level === "medium"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : "bg-slate-50 text-slate-700 border-slate-200";
  const label = level === "high" ? "High" : level === "medium" ? "Medium" : "Low";
  return (
    <Badge className={`border ${cls} font-medium`}>
      {label} priority
    </Badge>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "default" }) {
  const toneCls =
    tone === "danger"
      ? "bg-red-50/70 border-red-100"
      : tone === "warn"
        ? "bg-amber-50/70 border-amber-100"
        : tone === "success"
          ? "bg-emerald-50/70 border-emerald-100"
          : "bg-white border-slate-200";
  const iconCls =
    tone === "danger"
      ? "text-red-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "success"
          ? "text-emerald-600"
          : "text-teal-600";

  return (
    <Card className={`rounded-2xl border shadow-sm ${toneCls}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-200 ${iconCls}`}>
            <Icon className="w-4 h-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
        <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function TabPill({ active, icon: Icon, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
        "border focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 focus:ring-offset-slate-50",
        active
          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
      type="button"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {typeof count === "number" ? (
        <span
          className={[
            "ml-1 inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full text-xs",
            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700",
          ].join(" ")}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";
  const cls = isSuccess
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : isError
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-slate-200 bg-white text-slate-800";

  const Icon = isSuccess ? CheckCircle2 : isError ? AlertTriangle : Bell;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
      <div className={`flex items-start gap-3 rounded-2xl border shadow-lg p-4 ${cls}`}>
        <div className="mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-5">{toast.title || (isSuccess ? "Done" : isError ? "Something went wrong" : "Notice")}</div>
          <div className="text-sm opacity-90 mt-0.5 break-words">{toast.message}</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          type="button"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AIRecommendations() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Restock");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [reports, setReports] = useState(null);

  const [reorderList, setReorderList] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_REORDER);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [prioritySale, setPrioritySale] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PRIORITY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(LS_REORDER, JSON.stringify(reorderList));
    } catch {
      // ignore
    }
  }, [reorderList]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_PRIORITY, JSON.stringify(prioritySale));
    } catch {
      // ignore
    }
  }, [prioritySale]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [invRes, orderRes, delivRes, repRes] = await Promise.all([
        api.listPharmacyInventory({ limit: 200 }),
        api.listPharmacyOrders({ limit: 200 }),
        api.listPharmacyDeliveries({ limit: 200 }),
        api.getPharmacyReportsOverview({ rangeDays: 7, topDays: 30 }).catch(() => null),
      ]);

      setInventory(Array.isArray(invRes?.items) ? invRes.items : Array.isArray(invRes) ? invRes : []);
      setOrders(Array.isArray(orderRes?.items) ? orderRes.items : Array.isArray(orderRes) ? orderRes : []);
      setDeliveries(Array.isArray(delivRes?.items) ? delivRes.items : Array.isArray(delivRes) ? delivRes : []);
      setReports(repRes);
    } catch (e) {
      setError(e?.message || "Failed to load AI recommendations");
      setToast({ type: "error", title: "Load failed", message: e?.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qLower = String(query || "").trim().toLowerCase();

  const topSelling = useMemo(() => {
    const rows = (reports?.topSellingProducts || []).map((x) => ({
      name: x.name,
      value: toNum(x.value, 0),
    }));
    const map = new Map();
    rows.forEach((r) => map.set(String(r.name || "").toLowerCase(), r.value));
    return { rows, map };
  }, [reports]);

  const lowStock = useMemo(() => {
    const rows = (inventory || []).map((m) => {
      const stock = toNum(m.stock, 0);
      const reorderLevel = toNum(m.reorderLevel, 0);
      const topScore = topSelling.map.get(String(m.name || "").toLowerCase()) || 0;

      const priority =
        stock <= 0 || (stock <= reorderLevel && topScore > 0)
          ? "high"
          : stock <= reorderLevel
            ? "medium"
            : "low";

      const suggested = Math.max(reorderLevel * 2, reorderLevel + 5);

      return {
        ...m,
        stock,
        reorderLevel,
        topScore,
        priority,
        suggestedQty: Math.max(0, suggested - stock),
      };
    });

    const filtered = rows.filter((r) => r.stock <= r.reorderLevel);
    const q = qLower;

    const qFiltered = !q
      ? filtered
      : filtered.filter((r) => {
          const hay = [r.name, r.category, r.manufacturer, r.status]
            .map((x) => String(x || "").toLowerCase())
            .join(" ");
          return hay.includes(q);
        });

    return qFiltered.sort((a, b) => {
      if (a.priority === b.priority) return b.topScore - a.topScore;
      if (a.priority === "high") return -1;
      if (a.priority === "medium" && b.priority === "low") return -1;
      return 1;
    });
  }, [inventory, topSelling.map, qLower]);

  const expiringSoon = useMemo(() => {
    const rows = (inventory || [])
      .map((m) => ({ ...m, daysLeft: daysUntil(m.expiryDate) }))
      .filter((m) => typeof m.daysLeft === "number" && m.daysLeft <= 60);

    const q = qLower;

    const filtered = !q
      ? rows
      : rows.filter((r) => {
          const hay = [r.name, r.category, r.manufacturer]
            .map((x) => String(x || "").toLowerCase())
            .join(" ");
          return hay.includes(q);
        });

    return filtered.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [inventory, qLower]);

  const fulfillmentAlerts = useMemo(() => {
    const pendingOrders = (orders || []).filter((o) => String(o.status || "").toLowerCase() === "pending");

    const pendingDeliveries = (deliveries || []).filter((d) => {
      const status = String(d.status || "").toLowerCase();
      return status === "pending" || status === "pending rider" || status === "pending_rider";
    });

    const q = qLower;
    const filterByQ = (arr, pick) => {
      if (!q) return arr;
      return arr.filter((x) => pick(x).toLowerCase().includes(q));
    };

    return {
      pendingOrders: filterByQ(pendingOrders, (o) =>
        [o.orderNo, o.phone, o.address].map((x) => String(x || "")).join(" ")
      ),
      pendingDeliveries: filterByQ(pendingDeliveries, (d) =>
        [d.orderNo, d.customerName, d.customerPhone].map((x) => String(x || "")).join(" ")
      ),
    };
  }, [orders, deliveries, qLower]);

  const reorderCount = reorderList.length;
  const lowStockCount = lowStock.length;
  const expiringCount = expiringSoon.length;
  const pendingOrderCount = (orders || []).filter((o) => String(o.status || "").toLowerCase() === "pending").length;

  const addToReorder = (item) => {
    const id = item?._id || item?.id || item?.name;
    setReorderList((prev) => {
      if (prev.some((x) => (x._id || x.id || x.name) === id)) return prev;
      setToast({ type: "success", title: "Added", message: "Added to reorder list." });
      return [
        ...prev,
        {
          id: item._id || item.id || null,
          name: item.name,
          suggestedQty: item.suggestedQty || 0,
          category: item.category || "",
        },
      ];
    });
  };

  const removeFromReorder = (idOrName) => {
    setReorderList((prev) => prev.filter((x) => (x.id || x.name) !== idOrName));
    setToast({ type: "success", title: "Removed", message: "Removed from reorder list." });
  };

  const togglePrioritySale = (idOrName) => {
    setPrioritySale((prev) => {
      const exists = prev.includes(idOrName);
      const next = exists ? prev.filter((x) => x !== idOrName) : [...prev, idOrName];
      setToast({
        type: "success",
        title: exists ? "Unmarked" : "Marked",
        message: exists ? "Removed from priority sale." : "Marked for priority sale.",
      });
      return next;
    });
  };

  const exportReorderCSV = () => {
    const rows = [
      ["Medicine", "Category", "SuggestedQty"],
      ...reorderList.map((r) => [r.name, r.category || "", r.suggestedQty || 0]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadText(`reorder-list-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
    setToast({ type: "success", title: "Exported", message: "CSV download started." });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <PharmacyNavbar
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search medicines, orders, deliveries…"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Hero */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                  AI Recommendations
                </h1>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">
                  Smart suggestions for restocking, expiry risk, and fulfillment.{" "}
                  <span className="text-slate-500">(Decision support — verify before action.)</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Button
                  variant="outline"
                  onClick={load}
                  disabled={loading}
                  className="gap-2 rounded-xl bg-white"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={exportReorderCSV}
                  disabled={!reorderList.length}
                  className="gap-2 rounded-xl bg-white"
                >
                  <Download className="w-4 h-4" />
                  Export Reorder
                </Button>
              </div>
            </div>

            {/* Error */}
            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
                {error}
              </div>
            ) : null}

            {/* Summary */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Low Stock"
                value={loading ? "—" : lowStockCount}
                subtitle="Items at / below reorder level"
                icon={Package}
                tone={lowStockCount ? "warn" : "default"}
              />
              <StatCard
                title="Expiring Soon"
                value={loading ? "—" : expiringCount}
                subtitle="Expiry within 60 days"
                icon={AlertTriangle}
                tone={expiringCount ? "danger" : "default"}
              />
              <StatCard
                title="Pending Orders"
                value={loading ? "—" : pendingOrderCount}
                subtitle="Needs processing"
                icon={ShoppingCart}
                tone={pendingOrderCount ? "warn" : "default"}
              />
              <StatCard
                title="Reorder List"
                value={reorderCount}
                subtitle="Saved locally for export"
                icon={Download}
                tone={reorderCount ? "success" : "default"}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabPill
                active={activeTab === "Restock"}
                icon={Package}
                label="Restock"
                count={lowStockCount}
                onClick={() => setActiveTab("Restock")}
              />
              <TabPill
                active={activeTab === "Expiry"}
                icon={AlertTriangle}
                label="Expiry"
                count={expiringCount}
                onClick={() => setActiveTab("Expiry")}
              />
              <TabPill
                active={activeTab === "Fulfillment"}
                icon={ShoppingCart}
                label="Fulfillment"
                count={fulfillmentAlerts.pendingOrders.length + fulfillmentAlerts.pendingDeliveries.length}
                onClick={() => setActiveTab("Fulfillment")}
              />
              <TabPill
                active={activeTab === "Insights"}
                icon={Flame}
                label="Insights"
                count={topSelling.rows.length}
                onClick={() => setActiveTab("Insights")}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mt-4">
            {loading ? (
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="p-6 text-slate-600">Loading recommendations…</CardContent>
              </Card>
            ) : activeTab === "Restock" ? (
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Restock Recommendations</CardTitle>
                  <p className="text-sm text-slate-600">
                    Based on reorder levels and recent demand signals.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lowStock.length === 0 ? (
                    <div className="text-slate-600">
                      No low-stock items found.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {lowStock.map((m) => {
                        const id = m._id || m.id || m.name;
                        const inList = reorderList.some(
                          (x) => (x.id || x.name) === (m._id || m.id || m.name)
                        );

                        return (
                          <div
                            key={id}
                            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-semibold text-slate-900 truncate max-w-[72vw] sm:max-w-none">
                                    {m.name}
                                  </div>
                                  <PriorityBadge level={m.priority} />
                                  {m.topScore > 0 ? (
                                    <Badge className="bg-sky-50 text-sky-700 border border-sky-100">
                                      Top seller
                                    </Badge>
                                  ) : null}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-700">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                                    Stock: <span className="font-semibold">{m.stock}</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                                    Reorder: <span className="font-semibold">{m.reorderLevel}</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-100 px-3 py-1 text-teal-800">
                                    Suggested: <span className="font-semibold">{m.suggestedQty}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <Button
                                  variant="outline"
                                  className="rounded-xl bg-white"
                                  onClick={() => addToReorder(m)}
                                  disabled={inList}
                                >
                                  {inList ? (
                                    <span className="inline-flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4" /> Added
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-2">
                                      <ShoppingCart className="w-4 h-4" /> Add to reorder
                                    </span>
                                  )}
                                </Button>

                                <Link to="/pharmacy/inventory" className="w-full sm:w-auto">
                                  <Button className="w-full sm:w-auto rounded-xl bg-teal-600 hover:bg-teal-700">
                                    Open inventory
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Saved list */}
                  {reorderList.length ? (
                    <div className="pt-5 mt-5 border-t border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">Saved reorder list</div>
                          <div className="text-sm text-slate-600">
                            Export it to share with suppliers.
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={exportReorderCSV}
                          className="gap-2 rounded-xl bg-white"
                        >
                          <Download className="w-4 h-4" /> Export CSV
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-2">
                        {reorderList.map((r) => (
                          <div
                            key={r.id || r.name}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {r.name}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                {r.category || "—"} • Qty{" "}
                                <span className="font-semibold text-slate-900">{r.suggestedQty}</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              className="rounded-xl bg-white"
                              onClick={() => removeFromReorder(r.id || r.name)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : activeTab === "Expiry" ? (
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Expiry Risk</CardTitle>
                  <p className="text-sm text-slate-600">
                    Items expiring within 60 days — consider discounts or priority sale.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {expiringSoon.length === 0 ? (
                    <div className="text-slate-600">No items expiring within the next 60 days.</div>
                  ) : (
                    <div className="grid gap-3">
                      {expiringSoon.map((m) => {
                        const id = m._id || m.id || m.name;
                        const daysLeft = m.daysLeft;
                        const isCritical = typeof daysLeft === "number" && daysLeft <= 14;
                        const marked = prioritySale.includes(id);

                        return (
                          <div
                            key={id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-semibold text-slate-900 truncate max-w-[72vw] sm:max-w-none">
                                    {m.name}
                                  </div>
                                  <Badge
                                    className={[
                                      "border font-medium",
                                      isCritical
                                        ? "bg-red-50 text-red-700 border-red-100"
                                        : "bg-amber-50 text-amber-700 border-amber-100",
                                    ].join(" ")}
                                  >
                                    {daysLeft} days left
                                  </Badge>
                                  {marked ? (
                                    <Badge className="bg-teal-50 text-teal-800 border border-teal-100">
                                      Priority sale
                                    </Badge>
                                  ) : null}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-700">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                                    Expiry:{" "}
                                    <span className="font-semibold">
                                      {String(m.expiryDate || "").slice(0, 10) || "—"}
                                    </span>
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1">
                                    Stock: <span className="font-semibold">{toNum(m.stock, 0)}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <Link to="/pharmacy/inventory" className="w-full sm:w-auto">
                                  <Button variant="outline" className="w-full sm:w-auto rounded-xl bg-white">
                                    Review
                                  </Button>
                                </Link>
                                <Button
                                  className={[
                                    "rounded-xl",
                                    marked
                                      ? "bg-slate-900 hover:bg-slate-950"
                                      : "bg-teal-600 hover:bg-teal-700",
                                  ].join(" ")}
                                  onClick={() => togglePrioritySale(id)}
                                >
                                  {marked ? "Unmark" : "Mark for priority sale"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : activeTab === "Fulfillment" ? (
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Fulfillment Alerts</CardTitle>
                  <p className="text-sm text-slate-600">
                    Orders & deliveries that likely need immediate attention.
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900">
                        Pending Orders
                      </div>
                      <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
                        {fulfillmentAlerts.pendingOrders.length}
                      </Badge>
                    </div>

                    {fulfillmentAlerts.pendingOrders.length === 0 ? (
                      <div className="text-slate-600">No pending orders.</div>
                    ) : (
                      <div className="grid gap-3">
                        {fulfillmentAlerts.pendingOrders.slice(0, 10).map((o) => (
                          <div
                            key={o.id || o.orderNo}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900">{o.orderNo}</div>
                                <div className="text-sm text-slate-600 mt-1">
                                  Phone: <span className="text-slate-800">{o.phone || "—"}</span>
                                </div>
                              </div>
                              <Link to="/pharmacy/orders" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto rounded-xl bg-teal-600 hover:bg-teal-700">
                                  Open orders
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900">
                        Deliveries waiting for rider
                      </div>
                      <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
                        {fulfillmentAlerts.pendingDeliveries.length}
                      </Badge>
                    </div>

                    {fulfillmentAlerts.pendingDeliveries.length === 0 ? (
                      <div className="text-slate-600">No deliveries are waiting for rider assignment.</div>
                    ) : (
                      <div className="grid gap-3">
                        {fulfillmentAlerts.pendingDeliveries.slice(0, 10).map((d) => (
                          <div
                            key={d.id || d.orderNo}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900">{d.orderNo}</div>
                                <div className="text-sm text-slate-600 mt-1">
                                  Customer: <span className="text-slate-800">{d.customerName || "—"}</span>
                                </div>
                              </div>
                              <Link to="/pharmacy/deliveries" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full sm:w-auto rounded-xl bg-white">
                                  Open deliveries
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Demand Insights</CardTitle>
                  <p className="text-sm text-slate-600">
                    Top sellers from reports to guide stocking decisions.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topSelling.rows.length === 0 ? (
                    <div className="text-slate-600">No sales insights available yet.</div>
                  ) : (
                    <div className="grid gap-3">
                      {topSelling.rows
                        .filter((r) => (!qLower ? true : String(r.name || "").toLowerCase().includes(qLower)))
                        .slice(0, 12)
                        .map((r) => (
                          <div
                            key={r.name}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate">
                                  {r.name}
                                </div>
                                <div className="text-sm text-slate-600 mt-1">
                                  Units sold (approx): <span className="text-slate-800 font-semibold">{r.value}</span>
                                </div>
                              </div>
                              <Link to="/pharmacy/reports" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full sm:w-auto rounded-xl bg-white">
                                  Open reports
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}