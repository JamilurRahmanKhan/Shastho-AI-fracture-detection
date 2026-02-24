/**
 * Frontend page: Orders
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
// import api from "@/services/api";
// import { Eye, Check, Truck, PackageCheck, X } from "lucide-react";

// function relTime(iso) {
//   if (!iso) return "";
//   const t = new Date(iso).getTime();
//   if (Number.isNaN(t)) return "";
//   const diff = Date.now() - t;
//   const s = Math.floor(diff / 1000);
//   if (s < 60) return `${s}s ago`;
//   const m = Math.floor(s / 60);
//   if (m < 60) return `${m}m ago`;
//   const h = Math.floor(m / 60);
//   if (h < 24) return `${h}h ago`;
//   const d = Math.floor(h / 24);
//   return `${d}d ago`;
// }

// function StatusBadge({ status }) {
//   const s = (status || "").toLowerCase();
//   if (s === "pending") return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
//   if (s === "accepted") return <Badge className="bg-purple-100 text-purple-800">Accepted</Badge>;
//   if (s === "shipped") return <Badge className="bg-yellow-100 text-yellow-800">Shipped</Badge>;
//   if (s === "delivered") return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
//   if (s === "cancelled") return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
//   return <Badge className="bg-slate-100 text-slate-700">{status || "Unknown"}</Badge>;
// }

// export default function Orders() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState("All");
//   const [query, setQuery] = useState("");

//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState({ type: "", message: "" });

//   const statusTabs = [
//     "All",
//     "Pending",
//     "Accepted",
//     "Shipped",
//     "Delivered",
//     "Cancelled",
//   ];

//   const fetchOrders = async () => {
//     setLoading(true);
//     setToast({ type: "", message: "" });
//     try {
//       const status = activeTab === "All" ? "" : activeTab.toLowerCase();
//       const res = await api.listPharmacyOrders({ status });
//       setItems(res?.items || []);
//     } catch (e) {
//       setToast({ type: "error", message: e?.message || "Failed to load orders" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeTab]);

//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return items;
//     return (items || []).filter((o) => {
//       const orderNo = String(o.orderNo || "").toLowerCase();
//       const phone = String(o.phone || "").toLowerCase();
//       const address = String(o.shippingAddress || "").toLowerCase();
//       return orderNo.includes(q) || phone.includes(q) || address.includes(q);
//     });
//   }, [items, query]);

//   const doUpdateStatus = async (orderId, nextStatus) => {
//     try {
//       setToast({ type: "", message: "" });
//       let payload = { status: nextStatus };
//       if (nextStatus === "cancelled") {
//         const reason = window.prompt("Cancel reason (optional):", "Out of stock");
//         if (reason !== null && String(reason).trim()) payload.cancelReason = String(reason).trim();
//       }
//       await api.updatePharmacyOrder(orderId, payload);
//       setToast({ type: "success", message: `Order updated to ${nextStatus}` });
//       await fetchOrders();
//     } catch (e) {
//       setToast({ type: "error", message: e?.message || "Failed to update order" });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       <div className="lg:pl-64">
//         <PharmacyNavbar
//           onMenuClick={() => setSidebarOpen(true)}
//           searchValue={query}
//           onSearchChange={setQuery}
//           searchPlaceholder="Search orders by order no, phone, or address…"
//         />

//         <main className="p-6 space-y-8">
//           <div>
//             <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Order Management</h1>
//             <p className="text-gray-600 mt-2">Process and track all customer orders</p>
//           </div>

//           {!!toast.message && (
//             <div
//               className={`rounded-md border p-3 text-sm ${
//                 toast.type === "success"
//                   ? "bg-green-50 border-green-200 text-green-700"
//                   : "bg-red-50 border-red-200 text-red-700"
//               }`}
//             >
//               {toast.message}
//             </div>
//           )}

//           {/* Status Tabs */}
//           <div className="flex flex-wrap gap-2">
//             {statusTabs.map((tab) => (
//               <Button
//                 key={tab}
//                 variant={tab === activeTab ? "default" : "outline"}
//                 className={tab === activeTab ? "bg-teal-600 hover:bg-teal-700" : "bg-transparent"}
//                 onClick={() => setActiveTab(tab)}
//               >
//                 {tab}
//               </Button>
//             ))}
//             <Button variant="outline" className="bg-transparent ml-auto" onClick={fetchOrders}>
//               Refresh
//             </Button>
//           </div>

//           {/* Search (navbar) */}

//           {/* Orders Table */}
//           <Card className="overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order No</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Items</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Time</th>
//                     <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y">
//                   {filtered.map((order) => {
//                     const itemCount = (order.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);
//                     return (
//                       <tr key={order.id || order.orderNo} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 text-sm font-semibold text-gray-900">{order.orderNo}</td>
//                         <td className="px-6 py-4 text-sm">
//                           <div className="text-gray-900 font-medium">User: {String(order.userUid || "").slice(0, 8)}…</div>
//                           <div className="text-gray-600 text-xs">{order.phone || ""}</div>
//                         </td>
//                         <td className="px-6 py-4 text-sm text-gray-600">{itemCount} items</td>
//                         <td className="px-6 py-4 text-sm font-semibold text-gray-900">৳{Number(order.total || 0).toFixed(2)}</td>
//                         <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
//                         <td className="px-6 py-4 text-sm text-gray-600">{relTime(order.createdAt)}</td>
//                         <td className="px-6 py-4 text-right space-x-2">
//                           <Link to={`/pharmacy/orders/${encodeURIComponent(order.id || order.orderNo)}`}>
//                             <Button size="sm" variant="outline" className="bg-transparent" title="View details">
//                               <Eye className="w-4 h-4" />
//                             </Button>
//                           </Link>

//                           {order.status === "pending" && (
//                             <>
//                               <Button
//                                 size="sm"
//                                 className="bg-green-600 hover:bg-green-700"
//                                 title="Accept order"
//                                 onClick={() => doUpdateStatus(order.id || order.orderNo, "accepted")}
//                               >
//                                 <Check className="w-4 h-4" />
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 className="text-red-600 bg-transparent"
//                                 title="Cancel order"
//                                 onClick={() => doUpdateStatus(order.id || order.orderNo, "cancelled")}
//                               >
//                                 <X className="w-4 h-4" />
//                               </Button>
//                             </>
//                           )}

//                           {order.status === "accepted" && (
//                             <Button
//                               size="sm"
//                               className="bg-teal-600 hover:bg-teal-700"
//                               title="Mark shipped"
//                               onClick={() => doUpdateStatus(order.id || order.orderNo, "shipped")}
//                             >
//                               <Truck className="w-4 h-4" />
//                             </Button>
//                           )}

//                           {order.status === "shipped" && (
//                             <Button
//                               size="sm"
//                               className="bg-emerald-600 hover:bg-emerald-700"
//                               title="Mark delivered"
//                               onClick={() => doUpdateStatus(order.id || order.orderNo, "delivered")}
//                             >
//                               <PackageCheck className="w-4 h-4" />
//                             </Button>
//                           )}
//                         </td>
//                       </tr>
//                     );
//                   })}

//                   {filtered.length === 0 && (
//                     <tr>
//                       <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
//                         {loading ? "Loading orders…" : "No orders found."}
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </main>
//       </div>
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
import api from "@/services/api";
import { Eye, Check, Truck, PackageCheck, X, RefreshCw } from "lucide-react";

function relTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return <Badge className="bg-amber-100 text-amber-900 border border-amber-200">Pending</Badge>;
  if (s === "accepted") return <Badge className="bg-blue-100 text-blue-900 border border-blue-200">Accepted</Badge>;
  if (s === "shipped") return <Badge className="bg-purple-100 text-purple-900 border border-purple-200">Shipped</Badge>;
  if (s === "delivered") return <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200">Delivered</Badge>;
  if (s === "cancelled") return <Badge className="bg-red-100 text-red-900 border border-red-200">Cancelled</Badge>;
  return <Badge className="bg-slate-100 text-slate-800 border border-slate-200">{status || "Unknown"}</Badge>;
}

export default function Orders() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  const statusTabs = ["All", "Pending", "Accepted", "Shipped", "Delivered", "Cancelled"];

  const fetchOrders = async () => {
    setLoading(true);
    setToast({ type: "", message: "" });
    try {
      const status = activeTab === "All" ? "" : activeTab.toLowerCase();
      const res = await api.listPharmacyOrders({ status });
      setItems(res?.items || []);
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Failed to load orders" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return (items || []).filter((o) => {
      const orderNo = String(o.orderNo || "").toLowerCase();
      const phone = String(o.phone || "").toLowerCase();
      const address = String(o.shippingAddress || "").toLowerCase();
      return orderNo.includes(q) || phone.includes(q) || address.includes(q);
    });
  }, [items, query]);

  const doUpdateStatus = async (orderId, nextStatus) => {
    try {
      setToast({ type: "", message: "" });
      let payload = { status: nextStatus };
      if (nextStatus === "cancelled") {
        const reason = window.prompt("Cancel reason (optional):", "Out of stock");
        if (reason !== null && String(reason).trim()) payload.cancelReason = String(reason).trim();
      }
      await api.updatePharmacyOrder(orderId, payload);
      setToast({ type: "success", message: `Order updated to ${nextStatus}` });
      await fetchOrders();
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Failed to update order" });
    }
  };

  // ✅ consistent outline button like your “View all”
  const outlineBtn =
    "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 " +
    "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

  // ✅ tabs (active vs inactive) — readable and green-theme
  const tabActive =
    "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm " +
    "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";
  const tabInactive =
    "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 " +
    "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

  return (
    <div className="min-h-screen bg-gray-50">
      <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <PharmacyNavbar
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search orders by order no, phone, or address…"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                Order Management
              </h1>
              <p className="text-gray-700 mt-1">Process and track all customer orders</p>
            </div>

            <Button variant="outline" className={`${outlineBtn} gap-2`} onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {!!toast.message && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {toast.message}
            </div>
          )}

          {/* ✅ Status Tabs (scrollable on mobile) */}
          <Card className="p-3">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
              {statusTabs.map((tab) => (
                <Button
                  key={tab}
                  variant={tab === activeTab ? "default" : "outline"}
                  className={tab === activeTab ? tabActive : tabInactive}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ))}
              <div className="ml-auto hidden lg:block text-sm text-gray-700 pr-2">
                Showing: <span className="font-semibold text-gray-900">{activeTab}</span>
              </div>
            </div>
          </Card>

          {/* ✅ Desktop Table */}
          <Card className="overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Time</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filtered.map((order) => {
                    const itemCount = (order.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);
                    const id = order.id || order.orderNo;

                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{order.orderNo}</td>

                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900 font-semibold">
                            User: {String(order.userUid || "").slice(0, 8)}…
                          </div>
                          <div className="text-gray-700 text-xs">{order.phone || ""}</div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">{itemCount} items</td>

                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          ৳{Number(order.total || 0).toFixed(2)}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                          {relTime(order.createdAt)}
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          <Link to={`/pharmacy/orders/${encodeURIComponent(id)}`}>
                            <Button size="sm" variant="outline" className={outlineBtn} title="View details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>

                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                                title="Accept order"
                                onClick={() => doUpdateStatus(id, "accepted")}
                              >
                                <Check className="w-4 h-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white text-red-700 border-red-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                                title="Cancel order"
                                onClick={() => doUpdateStatus(id, "cancelled")}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {order.status === "accepted" && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                              title="Mark shipped"
                              onClick={() => doUpdateStatus(id, "shipped")}
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          )}

                          {order.status === "shipped" && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                              title="Mark delivered"
                              onClick={() => doUpdateStatus(id, "delivered")}
                            >
                              <PackageCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-700">
                        {loading ? "Loading orders…" : "No orders found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ✅ Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filtered.length === 0 ? (
              <Card className="p-6 text-center text-gray-700">
                {loading ? "Loading orders…" : "No orders found."}
              </Card>
            ) : (
              filtered.map((order) => {
                const itemCount = (order.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);
                const id = order.id || order.orderNo;

                return (
                  <Card key={id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-gray-900">
                          #{order.orderNo}
                        </div>
                        <div className="text-xs text-gray-700 mt-1">
                          User: {String(order.userUid || "").slice(0, 8)}… • {order.phone || ""}
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-700 font-semibold">Items</div>
                        <div className="text-gray-900 font-bold">{itemCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-700 font-semibold">Total</div>
                        <div className="text-gray-900 font-bold">৳{Number(order.total || 0).toFixed(2)}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-700 font-semibold">Time</div>
                        <div className="text-gray-900 font-bold">{relTime(order.createdAt)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link to={`/pharmacy/orders/${encodeURIComponent(id)}`} className="flex-1">
                        <Button variant="outline" className={`w-full ${outlineBtn}`}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </Link>

                      {order.status === "pending" && (
                        <>
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => doUpdateStatus(id, "accepted")}
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-white text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => doUpdateStatus(id, "cancelled")}
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {order.status === "accepted" && (
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => doUpdateStatus(id, "shipped")}
                          title="Ship"
                        >
                          <Truck className="w-4 h-4" />
                        </Button>
                      )}

                      {order.status === "shipped" && (
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => doUpdateStatus(id, "delivered")}
                          title="Deliver"
                        >
                          <PackageCheck className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}