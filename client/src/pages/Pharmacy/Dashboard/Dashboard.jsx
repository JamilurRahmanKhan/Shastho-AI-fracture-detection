/**
 * Frontend page: Dashboard
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
// import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
// import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
// import { AlertCircle, DollarSign, Package, TrendingUp, Eye, Clock, ShoppingCart } from "lucide-react";
// import { api } from "@/services/api";

// export default function PharmacyDashboard() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const [stats, setStats] = useState([
//     { label: "Orders Today", value: "0", icon: ShoppingCart, color: "bg-blue-100 text-blue-600" },
//     { label: "Revenue Today", value: "$0", icon: DollarSign, color: "bg-green-100 text-green-600" },
//     { label: "Low Stock Items", value: "0", icon: AlertCircle, color: "bg-orange-100 text-orange-600" },
//     { label: "Expiring Soon", value: "0", icon: Package, color: "bg-red-100 text-red-600" },
//   ]);
//   const [recentOrders, setRecentOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const timeAgo = useMemo(() => {
//     return (iso) => {
//       if (!iso) return "";
//       const t = new Date(iso).getTime();
//       if (!Number.isFinite(t)) return "";
//       const diff = Date.now() - t;
//       const mins = Math.floor(diff / 60000);
//       if (mins < 1) return "just now";
//       if (mins < 60) return `${mins} min ago`;
//       const hrs = Math.floor(mins / 60);
//       if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
//       const days = Math.floor(hrs / 24);
//       return `${days} day${days === 1 ? "" : "s"} ago`;
//     };
//   }, []);

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         setLoading(true);
//         setError("");

//         // Recent orders + two inventory counts for dashboard KPIs.
//         const [ordersRes, lowRes, expRes] = await Promise.all([
//           api.listPharmacyOrders({}),
//           api.listPharmacyInventory({ status: "low", page: 1, limit: 1 }),
//           api.listPharmacyInventory({ status: "expiring", page: 1, limit: 1 }),
//         ]);

//         const orders = Array.isArray(ordersRes?.items) ? ordersRes.items : [];
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const todayMs = today.getTime();
//         const todaysOrders = orders.filter((o) => {
//           const t = new Date(o?.createdAt || o?.updatedAt || 0).getTime();
//           return Number.isFinite(t) && t >= todayMs;
//         });
//         const ordersToday = todaysOrders.length;
//         const revenueToday = todaysOrders.reduce((sum, o) => sum + Number(o?.total || 0), 0);

//         // Standardize the product to BDT across all screens.
//         const money = (n) => {
//           const v = Number(n || 0);
//           const fixed = Number.isFinite(v) ? v.toFixed(2) : "0.00";
//           return `৳${fixed}`;
//         };

//         const nextStats = [
//           { label: "Orders Today", value: String(ordersToday), icon: ShoppingCart, color: "bg-blue-100 text-blue-600" },
//           { label: "Revenue Today", value: money(revenueToday), icon: DollarSign, color: "bg-green-100 text-green-600" },
//           { label: "Low Stock Items", value: String(lowRes?.total ?? 0), icon: AlertCircle, color: "bg-orange-100 text-orange-600" },
//           { label: "Expiring Soon", value: String(expRes?.total ?? 0), icon: Package, color: "bg-red-100 text-red-600" },
//         ];

//         const mapped = orders.slice(0, 6).map((o) => ({
//           id: o?.orderNo || o?.id,
//           customer: o?.phone ? `${o.phone}` : (o?.userUid ? `User: ${String(o.userUid).slice(0, 10)}…` : "Customer"),
//           items: Array.isArray(o?.items) ? o.items.length : 0,
//           total: money(o?.total),
//           status: o?.status || "pending",
//           time: timeAgo(o?.createdAt),
//           orderNo: o?.orderNo,
//         }));

//         if (!mounted) return;
//         setStats(nextStats);
//         setRecentOrders(mapped);
//       } catch (e) {
//         if (!mounted) return;
//         setError(e?.message || "Failed to load dashboard data");
//       } finally {
//         if (!mounted) return;
//         setLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, [timeAgo]);

//   const filteredRecentOrders = useMemo(() => {
//     const q = String(searchQuery || "").trim().toLowerCase();
//     if (!q) return recentOrders;
//     return (recentOrders || []).filter((o) => {
//       const hay = [o?.id, o?.orderNo, o?.customer, o?.total, o?.status].map((x) => String(x || "").toLowerCase()).join(" ");
//       return hay.includes(q);
//     });
//   }, [recentOrders, searchQuery]);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       <div className="lg:pl-64">
//         <PharmacyNavbar
//           onMenuClick={() => setSidebarOpen(true)}
//           searchValue={searchQuery}
//           onSearchChange={setSearchQuery}
//           searchPlaceholder="Search recent orders, customers…"
//         />

//         <main className="p-6 space-y-8">
//           {/* Header */}
//           <div>
//             <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome back!</h1>
//             <p className="text-gray-600 mt-2">Here's what's happening with your pharmacy today</p>
//           </div>

//           {/* Stats */}
//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {stats.map((stat) => {
//               const Icon = stat.icon;
//               return (
//                 <Card key={stat.label} className="p-6">
//                   <div className="flex items-center justify-between mb-4">
//                     <span className="text-gray-600 text-sm font-medium">{stat.label}</span>
//                     <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
//                       <Icon className="w-5 h-5" />
//                     </div>
//                   </div>
//                   <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
//                 </Card>
//               );
//             })}
//           </div>

//           <div className="grid lg:grid-cols-3 gap-6">
//             {/* Recent Orders */}
//             <div className="lg:col-span-2">
//               <Card className="p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
//                   <Link to="/pharmacy/orders">
//                     <Button variant="outline" size="sm" className="bg-transparent">
//                       View All
//                     </Button>
//                   </Link>
//                 </div>
//                 {error && (
//                   <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
//                     {error}
//                   </div>
//                 )}
//                 <div className="space-y-3">
//                   {loading ? (
//                     <div className="text-sm text-gray-600">Loading recent orders...</div>
//                   ) : recentOrders.length === 0 ? (
//                     <div className="text-sm text-gray-600">No orders yet for this pharmacy.</div>
//                   ) : (
//                     filteredRecentOrders.map((order) => (
//                       <Link
//                         key={order.id}
//                         to={order.orderNo ? `/pharmacy/orders/${encodeURIComponent(order.orderNo)}` : "/pharmacy/orders"}
//                         className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
//                       >
//                         <div className="flex-1">
//                           <div className="font-semibold text-gray-900">{order.customer}</div>
//                           <div className="text-sm text-gray-600">
//                             {order.id} • {order.items} items
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div className="font-semibold text-gray-900">{order.total}</div>
//                           <div className="text-xs text-gray-500 mt-1">{order.time}</div>
//                         </div>
//                       </Link>
//                     ))
//                   )}
//                 </div>
//               </Card>
//             </div>

//             {/* Quick Actions */}
//             <Card className="p-6 h-fit">
//               <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
//               <div className="space-y-3">
//                 <Link to="/pharmacy/medicines">
//                   <Button className="w-full justify-start bg-teal-600 hover:bg-teal-700">
//                     <Package className="w-4 h-4 mr-2" />
//                     Manage Inventory
//                   </Button>
//                 </Link>
//                 <Link to="/pharmacy/orders">
//                   <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
//                     <Eye className="w-4 h-4 mr-2" />
//                     View Orders
//                   </Button>
//                 </Link>
//                 <Link to="/pharmacy/deliveries">
//                   <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
//                     <Clock className="w-4 h-4 mr-2" />
//                     Manage Deliveries
//                   </Button>
//                 </Link>
//                 <Link to="/pharmacy/reports">
//                   <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
//                     <TrendingUp className="w-4 h-4 mr-2" />
//                     View Reports
//                   </Button>
//                 </Link>
//               </div>
//             </Card>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
import {
  AlertCircle,
  DollarSign,
  Package,
  TrendingUp,
  Eye,
  Clock,
  ShoppingCart,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { api } from "@/services/api";

/**
 * ✅ UX + UI improvements:
 * - Consistent, calm palette (blue primary + neutral surfaces)
 * - Fully responsive: mobile-first spacing, grids collapse cleanly
 * - Better card density, typography, contrast
 * - Recent orders list: status pill, hover/focus states, truncation safe
 * - Quick actions: consistent button style + accessible focus rings
 * - Loading state skeleton blocks
 * - Avoid loud mixed colors; keep color only for accents
 */

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function moneyBDT(n) {
  const v = Number(n || 0);
  const fixed = Number.isFinite(v) ? v.toFixed(2) : "0.00";
  return `৳${fixed}`;
}

function statusMeta(statusRaw) {
  const s = String(statusRaw || "pending").toLowerCase();
  if (["paid", "completed", "delivered"].includes(s)) {
    return {
      label: "Completed",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (["processing", "confirmed", "accepted"].includes(s)) {
    return {
      label: "Processing",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }
  if (["cancelled", "canceled", "rejected", "failed"].includes(s)) {
    return {
      label: "Cancelled",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }
  if (["pending"].includes(s)) {
    return {
      label: "Pending",
      cls: "bg-amber-50 text-amber-800 border-amber-200",
    };
  }
  return {
    label: s.replace(/^\w/, (c) => c.toUpperCase()),
    cls: "bg-slate-50 text-slate-700 border-slate-200",
  };
}

function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function StatSkeleton() {
  return (
    <Card className="p-5 sm:p-6 border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="mt-4 h-8 w-20 bg-slate-200 rounded animate-pulse" />
      <div className="mt-2 h-3 w-36 bg-slate-200 rounded animate-pulse" />
    </Card>
  );
}

function RowSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-44 bg-slate-200 rounded animate-pulse" />
          <div className="mt-2 h-3 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="text-right">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-auto" />
          <div className="mt-2 h-3 w-16 bg-slate-200 rounded animate-pulse ml-auto" />
        </div>
      </div>
    </div>
  );
}

export default function PharmacyDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState(null); // null => show skeleton
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [ordersRes, lowRes, expRes] = await Promise.all([
          api.listPharmacyOrders({}),
          api.listPharmacyInventory({ status: "low", page: 1, limit: 1 }),
          api.listPharmacyInventory({ status: "expiring", page: 1, limit: 1 }),
        ]);

        const orders = Array.isArray(ordersRes?.items) ? ordersRes.items : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();

        const todaysOrders = orders.filter((o) => {
          const t = new Date(o?.createdAt || o?.updatedAt || 0).getTime();
          return Number.isFinite(t) && t >= todayMs;
        });

        const ordersToday = todaysOrders.length;
        const revenueToday = todaysOrders.reduce(
          (sum, o) => sum + Number(o?.total || 0),
          0
        );

        const nextStats = [
          {
            label: "Orders Today",
            value: String(ordersToday),
            hint: "New orders since midnight",
            icon: ShoppingCart,
            chip: "bg-blue-50 text-blue-700 border-blue-200",
            iconWrap: "bg-blue-600 text-white",
          },
          {
            label: "Revenue Today",
            value: moneyBDT(revenueToday),
            hint: "Gross sales today",
            icon: DollarSign,
            chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
            iconWrap: "bg-emerald-600 text-white",
          },
          {
            label: "Low Stock",
            value: String(lowRes?.total ?? 0),
            hint: "Needs restock soon",
            icon: AlertCircle,
            chip: "bg-amber-50 text-amber-800 border-amber-200",
            iconWrap: "bg-amber-500 text-white",
          },
          {
            label: "Expiring Soon",
            value: String(expRes?.total ?? 0),
            hint: "Check batch dates",
            icon: Package,
            chip: "bg-rose-50 text-rose-700 border-rose-200",
            iconWrap: "bg-rose-600 text-white",
          },
        ];

        const mapped = orders.slice(0, 8).map((o) => ({
          id: o?.orderNo || o?.id,
          customer: o?.phone
            ? `${o.phone}`
            : o?.userUid
            ? `User: ${String(o.userUid).slice(0, 10)}…`
            : "Customer",
          items: Array.isArray(o?.items) ? o.items.length : 0,
          total: moneyBDT(o?.total),
          status: o?.status || "pending",
          time: timeAgo(o?.createdAt || o?.updatedAt),
          orderNo: o?.orderNo,
        }));

        if (!mounted) return;
        setStats(nextStats);
        setRecentOrders(mapped);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load dashboard data");
        setStats([]); // stop skeleton if error
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRecentOrders = useMemo(() => {
    const q = String(searchQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return recentOrders;
    return (recentOrders || []).filter((o) => {
      const hay = [o?.id, o?.orderNo, o?.customer, o?.total, o?.status]
        .map((x) => String(x || "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }, [recentOrders, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PharmacySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <PharmacyNavbar
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search orders, customer phone, status…"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold w-fit">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Pharmacy overview
                </div>
                <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm sm:text-base text-slate-600">
                  Track orders, revenue, inventory health, and quick actions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/pharmacy/orders">
                  <Button
                    variant="outline"
                    className="
                      bg-white border-slate-200 text-slate-900 hover:bg-slate-50
                      focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                    "
                  >
                    View all orders
                  </Button>
                </Link>
              </div>
            </div>

            {/* Error banner */}
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            ) : null}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {stats === null ? (
                <>
                  <StatSkeleton />
                  <StatSkeleton />
                  <StatSkeleton />
                  <StatSkeleton />
                </>
              ) : (
                stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={stat.label}
                      className="
                        p-5 sm:p-6 border-slate-200 shadow-sm
                        hover:shadow-md transition-shadow
                        bg-white
                      "
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700">
                            {stat.label}
                          </p>
                          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
                            {loading ? "…" : stat.value}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {stat.hint}
                          </p>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <div
                            className={cn(
                              "w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm",
                              stat.iconWrap
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div
                            className={cn(
                              "text-[11px] px-2 py-1 rounded-full border font-semibold",
                              stat.chip
                            )}
                          >
                            Updated today
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Recent Orders */}
              <div className="lg:col-span-2">
                <Card className="p-4 sm:p-6 border-slate-200 shadow-sm bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                        Recent Orders
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        Latest orders for quick review and status checks.
                      </p>
                    </div>

                    <Link to="/pharmacy/orders">
                      <Button
                        variant="outline"
                        size="sm"
                        className="
                          bg-white border-slate-200 text-slate-900 hover:bg-slate-50
                          focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                        "
                      >
                        View all
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {loading ? (
                      <>
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                      </>
                    ) : recentOrders.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="font-semibold text-slate-900">
                          No orders yet
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Orders will appear here once customers place them.
                        </p>
                      </div>
                    ) : filteredRecentOrders.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="font-semibold text-slate-900">
                          No matches
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Try a different search term.
                        </p>
                      </div>
                    ) : (
                      filteredRecentOrders.map((order) => {
                        const st = statusMeta(order.status);
                        return (
                          <Link
                            key={order.id}
                            to={
                              order.orderNo
                                ? `/pharmacy/orders/${encodeURIComponent(
                                    order.orderNo
                                  )}`
                                : "/pharmacy/orders"
                            }
                            className="
                              group block rounded-2xl border border-slate-200 bg-white p-4
                              hover:bg-slate-50 hover:border-slate-300 transition
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                            "
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {order.customer}
                                  </p>
                                  <span
                                    className={cn(
                                      "text-[11px] px-2 py-1 rounded-full border font-semibold",
                                      st.cls
                                    )}
                                  >
                                    {st.label}
                                  </span>
                                </div>

                                <p className="mt-1 text-sm text-slate-600 truncate">
                                  <span className="font-medium text-slate-700">
                                    {order.id}
                                  </span>{" "}
                                  • {order.items} item
                                  {order.items === 1 ? "" : "s"}
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="font-extrabold text-slate-900">
                                  {order.total}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {order.time}
                                </p>

                                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 opacity-0 group-hover:opacity-100 transition">
                                  Open <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              {/* <Card className="p-4 sm:p-6 border-slate-200 shadow-sm bg-white h-fit">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Quick Actions</h2>
                <p className="text-sm text-slate-600 mt-1">Jump to common pharmacy tasks.</p>

                <div className="mt-4 space-y-3">
                  <Link to="/pharmacy/medicines">
                    <Button
                      className="
                        w-full justify-start gap-2
                        bg-blue-600 text-white hover:bg-blue-700
                        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                      "
                    >
                      <Package className="w-4 h-4" />
                      Manage Inventory
                    </Button>
                  </Link>

                  <Link to="/pharmacy/orders">
                    <Button
                      variant="outline"
                      className="
                        w-full justify-start gap-2
                        bg-white border-slate-200 text-slate-900 hover:bg-slate-50
                        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                      "
                    >
                      <Eye className="w-4 h-4 text-slate-700" />
                      View Orders
                    </Button>
                  </Link>

                  <Link to="/pharmacy/deliveries">
                    <Button
                      variant="outline"
                      className="
                        w-full justify-start gap-2
                        bg-white border-slate-200 text-slate-900 hover:bg-slate-50
                        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                      "
                    >
                      <Clock className="w-4 h-4 text-slate-700" />
                      Manage Deliveries
                    </Button>
                  </Link>

                  <Link to="/pharmacy/reports">
                    <Button
                      variant="outline"
                      className="
                        w-full justify-start gap-2
                        bg-white border-slate-200 text-slate-900 hover:bg-slate-50
                        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                      "
                    >
                      <TrendingUp className="w-4 h-4 text-slate-700" />
                      View Reports
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Tip</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Use the search bar to quickly find an order by phone, ID, or status.
                  </p>
                </div>
              </Card> */}

              {/* Quick Actions (Green theme) */}
              <Card className="p-4 sm:p-6 border-slate-200 shadow-sm bg-white h-fit">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Quick Actions
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Jump to common pharmacy tasks.
                    </p>
                  </div>

                  <Link to="/pharmacy/orders" className="hidden sm:block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="
    shrink-0 whitespace-nowrap
    h-9 px-4 rounded-xl
    bg-white border border-slate-200 text-slate-900
    shadow-sm hover:shadow
    hover:bg-slate-50 hover:border-slate-300
    active:bg-slate-100
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
    disabled:opacity-60 disabled:pointer-events-none
  "
                    >
                      View all
                    </Button>
                  </Link>
                </div>

                {/* Responsive grid */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {/* Primary action */}
                  <Link to="/pharmacy/medicines" className="block">
                    <Button
                      className="
          w-full justify-between gap-3 h-12
          bg-emerald-600 text-white hover:bg-emerald-700
          focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        "
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </span>
                        <span className="text-left leading-tight">
                          <span className="block font-semibold">Inventory</span>
                          <span className="block text-[11px] text-white/80 -mt-0.5">
                            Manage stock & batches
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 opacity-90" />
                    </Button>
                  </Link>

                  <Link to="/pharmacy/orders" className="block">
                    <Button
                      variant="outline"
                      className="
          w-full justify-between gap-3 h-12
          bg-white border-slate-200 text-slate-900 hover:bg-emerald-50
          focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        "
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Eye className="w-4 h-4 text-emerald-700" />
                        </span>
                        <span className="text-left leading-tight">
                          <span className="block font-semibold">Orders</span>
                          <span className="block text-[11px] text-slate-500 -mt-0.5">
                            Review & update status
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Button>
                  </Link>

                  <Link to="/pharmacy/deliveries" className="block">
                    <Button
                      variant="outline"
                      className="
          w-full justify-between gap-3 h-12
          bg-white border-slate-200 text-slate-900 hover:bg-emerald-50
          focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        "
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-emerald-700" />
                        </span>
                        <span className="text-left leading-tight">
                          <span className="block font-semibold">
                            Deliveries
                          </span>
                          <span className="block text-[11px] text-slate-500 -mt-0.5">
                            Track riders & ETA
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Button>
                  </Link>

                  <Link to="/pharmacy/reports" className="block">
                    <Button
                      variant="outline"
                      className="
          w-full justify-between gap-3 h-12
          bg-white border-slate-200 text-slate-900 hover:bg-emerald-50
          focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        "
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-emerald-700" />
                        </span>
                        <span className="text-left leading-tight">
                          <span className="block font-semibold">Reports</span>
                          <span className="block text-[11px] text-slate-500 -mt-0.5">
                            Revenue & trends
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Button>
                  </Link>
                </div>

                {/* Tip */}
                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Tip</p>
                  <p className="mt-1 text-sm text-emerald-900/70">
                    Use the search bar to quickly find an order by phone, ID, or
                    status.
                  </p>

                  {/* Mobile-only CTA */}
                  <div className="mt-3 sm:hidden">
                    <Link to="/pharmacy/orders">
                      <Button
                        variant="outline"
                        className="
            w-full bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-50
            focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
          "
                      >
                        View all orders
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
