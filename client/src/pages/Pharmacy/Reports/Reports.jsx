/**
 * Frontend page: Reports
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState } from "react";
import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, AlertTriangle, RefreshCw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "@/services/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A78BFA"];

function fmtMoney(symbol, n, currencyCode = "BDT") {
  const v = Number(n || 0);
  const maxFractionDigits = String(currencyCode).toUpperCase() === "BDT" ? 0 : 2;
  try {
    return `${symbol}${new Intl.NumberFormat(undefined, { maximumFractionDigits: maxFractionDigits }).format(v)}`;
  } catch {
    return `${symbol}${v.toFixed(maxFractionDigits)}`;
  }
}

function fmtPct(n) {
  const v = Number(n || 0);
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function TrendBadge({ value }) {
  const v = Number(value || 0);
  const up = v >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const cls = up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>
      <Icon className="w-3 h-3" />
      {fmtPct(v)}
    </span>
  );
}

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const currencyCode = String(data?.currency || "BDT").toUpperCase();
  const currencySymbol = '৳';

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getPharmacyReportsOverview({ rangeDays: 7, topDays: 30 });
      setData(res);
    } catch (e) {
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekly = useMemo(() => {
    const rows = data?.weeklySales || [];
    return rows.map((r) => ({ day: r.day, sales: Number(r.sales || 0) }));
  }, [data, query]);

  const pie = useMemo(() => {
    const base = (data?.topSellingProducts || []).map((x) => ({ name: x.name, value: Number(x.value || 0) }));
    const q = String(query || "").trim().toLowerCase();
    if (!q) return base;
    return base.filter((x) => String(x.name || "").toLowerCase().includes(q));
  }, [data, query]);

  const lowStockExpiry = useMemo(() => {
    const rows = data?.lowStockExpiry || [];
    const q = String(query || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => String(r?.name || r?.medicineName || "").toLowerCase().includes(q));
  }, [data, query]);

  const summary = data?.summary || {};
  const delta = summary?.delta || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <PharmacyNavbar
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search products in reports…"
        />

        <main className="p-6 lg:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports &amp; Analytics</h1>
                <p className="text-gray-600 mt-1">Sales performance and business insights</p>
              </div>
              <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-red-700">{error}</CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? "—" : fmtMoney(currencySymbol, summary.totalSales, currencyCode)}
                  </div>
                  {!loading && <TrendBadge value={delta.totalSales} />}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                  <ShoppingCart className="w-4 h-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{loading ? "—" : summary.totalOrders || 0}</div>
                  {!loading && <TrendBadge value={delta.totalOrders} />}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
                  <Package className="w-4 h-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? "—" : fmtMoney(currencySymbol, summary.avgOrderValue, currencyCode)}
                  </div>
                  {!loading && <TrendBadge value={delta.avgOrderValue} />}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Cancellation Rate</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{loading ? "—" : `${Number(summary.cancellationRate || 0).toFixed(1)}%`}</div>
                  {!loading && <TrendBadge value={delta.cancellationRate} />}
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weekly}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip
                          formatter={(v) => fmtMoney(currencySymbol, v, currencyCode)}
                        />
                        <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {pie.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pie.map((p, idx) => (
                      <span key={p.name} className="inline-flex items-center gap-2 text-xs text-gray-700">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                        {p.name}: {p.value}%
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Low stock & expiry */}
            <Card>
              <CardHeader>
                <CardTitle>Low Stock &amp; Expiry Report</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-gray-500">Loading…</div>
                ) : lowStockExpiry.length === 0 ? (
                  <div className="text-gray-500">No low stock or expiring items found.</div>
                ) : (
                  <div className="space-y-3">
                    {lowStockExpiry.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.stock} units
                            {item.expires ? ` • Expires ${item.expires}` : ""}
                          </div>
                        </div>
                        <Badge
                          className={
                            item.alert === "Low & Expiring"
                              ? "bg-amber-100 text-amber-800"
                              : item.alert === "Low Stock"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {item.alert}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
      </div>
    </div>
  );
}
