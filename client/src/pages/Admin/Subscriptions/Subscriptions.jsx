/**
 * Frontend page: Subscriptions
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Calendar, CreditCard, PlusCircle, RefreshCw, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/services/api";

// Firestore: used only to pick users by email/name (admin-friendly).
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase/firebase";

function compact(n) {
  try {
    return new Intl.NumberFormat(undefined, { notation: "compact" }).format(
      Number(n) || 0
    );
  } catch {
    return String(Number(n) || 0);
  }
}

function niceDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleString();
}

function planLabel(code) {
  const m = {
    FREE_ThreeDays: "FREE_ThreeDays (Trial)",
    ACCIDENT_PASS_7D: "Accident Pass — 7 Days",
    RECOVERY_PLAN_6W: "Recovery Plan — 6 Weeks",
    RECOVERY_PLUS_12W: "Recovery Plus — 12 Weeks",
  };
  return m[code] || code;
}

const pieColors = [
  "#4f46e5",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
];

export default function AdminSubscriptions() {
  const [rangeDays, setRangeDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [plans, setPlans] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 30,
  });
  const [trials, setTrials] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 30,
  });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("plans");
  const [q, setQ] = useState("");

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({
    userUid: "",
    episodeId: "",
    episodeMode: "most_recent_open", // most_recent_open | create_new | specific
    planCode: "ACCIDENT_PASS_7D",
    amount: "",
  });
  const [grantError, setGrantError] = useState("");

  const [userRows, setUserRows] = useState([]);
  const [userRowsLoading, setUserRowsLoading] = useState(false);

  const [grantUserQuery, setGrantUserQuery] = useState("");
  const [grantSelectedUser, setGrantSelectedUser] = useState(null);
  const [grantEpisodes, setGrantEpisodes] = useState([]);
  const [grantEpisodesLoading, setGrantEpisodesLoading] = useState(false);

  const [packOpen, setPackOpen] = useState(false);
  const [packForm, setPackForm] = useState({
    userUid: "",
    packType: "SCAN_PACK",
    credits: "",
  });
  const [packError, setPackError] = useState("");

  const [packUserQuery, setPackUserQuery] = useState("");
  const [packSelectedUser, setPackSelectedUser] = useState(null);

  const revenueSeries = summary?.revenueSeries || [];
  const distribution = summary?.planDistribution || [];

  const distributionData = useMemo(() => {
    return distribution
      .filter((d) => d?.code)
      .map((d) => ({
        name: planLabel(d.code),
        value: Number(d.count || 0),
        code: d.code,
      }));
  }, [distribution]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sum, plansRes, trialsRes, act] = await Promise.all([
        api.adminSubscriptionsSummary({ rangeDays }),
        api.adminListPlans({ page: 1, limit: 30, q, enrich: 1 }),
        api.adminListTrials({ page: 1, limit: 30, q }),
        api.adminSubscriptionActivity({ limit: 15, q }),
      ]);
      setSummary(sum);
      setPlans(plansRes);
      setTrials(trialsRes);
      setActivity(act.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const onSearch = async (e) => {
    e?.preventDefault?.();
    await fetchAll();
  };

  const doGrantPlan = async () => {
    setGrantError("");
    try {
      const payload = {
        userUid: grantForm.userUid.trim(),
        planCode: grantForm.planCode,
        episodeMode: grantForm.episodeMode,
        episodeId:
          grantForm.episodeMode === "specific"
            ? grantForm.episodeId.trim() || undefined
            : undefined,
        amount: grantForm.amount ? Number(grantForm.amount) : 0,
        currency: "BDT",
        provider: "admin",
      };
      if (!payload.userUid) {
        setGrantError("User is required");
        return;
      }
      await api.adminGrantPlan(payload);
      setGrantOpen(false);
      setGrantForm({
        userUid: "",
        episodeId: "",
        episodeMode: "most_recent_open",
        planCode: "ACCIDENT_PASS_7D",
        amount: "",
      });
      setGrantUserQuery("");
      setGrantSelectedUser(null);
      setGrantEpisodes([]);
      await fetchAll();
    } catch (e) {
      setGrantError(e?.data?.error || e?.message || "Failed to grant plan");
    }
  };

  const doGrantPack = async () => {
    setPackError("");
    try {
      const payload = {
        userUid: packForm.userUid.trim(),
        packType: packForm.packType,
        credits: Number(packForm.credits || 0),
        currency: "BDT",
        provider: "admin",
      };
      if (!payload.userUid) {
        setPackError("User is required");
        return;
      }
      if (!payload.credits || payload.credits <= 0) {
        setPackError("Credits must be greater than 0");
        return;
      }
      await api.adminGrantPack(payload);
      setPackOpen(false);
      setPackForm({ userUid: "", packType: "SCAN_PACK", credits: "" });
      setPackUserQuery("");
      setPackSelectedUser(null);
      await fetchAll();
    } catch (e) {
      setPackError(e?.data?.error || e?.message || "Failed to grant pack");
    }
  };

  const loadUserRows = async () => {
    if (userRowsLoading) return;
    setUserRowsLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(500)
      );
      const snap = await getDocs(q);
      setUserRows(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      // Keep UI usable even if Firestore rules are missing.
      setUserRows([]);
    } finally {
      setUserRowsLoading(false);
    }
  };

  useEffect(() => {
    if ((grantOpen || packOpen) && userRows.length === 0) {
      loadUserRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantOpen, packOpen]);

  const pickGrantUser = async (u) => {
    setGrantSelectedUser(u);
    setGrantUserQuery(u?.email || u?.name || "");
    setGrantForm((s) => ({ ...s, userUid: u?.uid || "" }));

    // Load episodes for this user so admin can pick a friendly label instead of ObjectId.
    if (!u?.uid) {
      setGrantEpisodes([]);
      return;
    }
    setGrantEpisodesLoading(true);
    try {
      const resp = await api.adminListUserEpisodes(u.uid);
      setGrantEpisodes(resp?.items || []);
    } catch (e) {
      console.error(e);
      setGrantEpisodes([]);
    } finally {
      setGrantEpisodesLoading(false);
    }
  };

  const pickPackUser = (u) => {
    setPackSelectedUser(u);
    setPackUserQuery(u?.email || u?.name || "");
    setPackForm((s) => ({ ...s, userUid: u?.uid || "" }));
  };

  const filteredUsers = (text) => {
    const s = String(text || "")
      .trim()
      .toLowerCase();
    if (!s) return [];
    const items = userRows
      .filter((u) => {
        const hay = `${u.name || ""} ${u.email || ""} ${u.uid}`.toLowerCase();
        return hay.includes(s);
      })
      .slice(0, 8);
    return items;
  };

  const grantEpisodeSelectValue = useMemo(() => {
    if (grantForm.episodeMode === "create_new") return "__create__";
    if (grantForm.episodeMode === "specific") return grantForm.episodeId || "";
    return "__auto__";
  }, [grantForm.episodeId, grantForm.episodeMode]);

  const cancelPlan = async (planId) => {
    const ok = window.confirm(
      "Cancel this plan now? This will end it immediately."
    );
    if (!ok) return;
    try {
      await api.adminCancelPlan(planId, { reason: "Cancelled by admin" });
      await fetchAll();
    } catch (e) {
      window.alert(e?.data?.error || e?.message || "Failed to cancel plan");
    }
  };

  const kpis = summary?.kpis || {
    totalSubscribers: 0,
    activePlans: 0,
    activeTrials: 0,
    revenue: 0,
    growthRate: 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Subscription Management
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor and manage episode plans, trials, and credit packs.
            </p>
          </div>
        </div>

        {/* Controls Section - Redesigned for better UX */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Search Plans or Users
              </label>
              <form onSubmit={onSearch} className="flex gap-2">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Enter UID, email, or episode ID..."
                  className="flex-1 border-slate-300"
                />
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Search
                </Button>
              </form>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Time Range
              </label>
              <div className="flex gap-2">
                <Select
                  value={String(rangeDays)}
                  onValueChange={(v) => setRangeDays(Number(v) || 30)}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={fetchAll}
                  disabled={loading}
                  className="border-slate-300 bg-transparent"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={() => setGrantOpen(true)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Grant Plan
            </Button>
            <Button
              onClick={() => setPackOpen(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Grant Credit Pack
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards - Enhanced design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">
              {compact(kpis.totalSubscribers)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Active users with plans
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {compact(kpis.activePlans)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Currently in effect</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Active Trials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {compact(kpis.activeTrials)}
            </div>
            <p className="text-xs text-slate-500 mt-2">3-day trials running</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600">
              ৳{compact(kpis.revenue)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Growth: {kpis.growthRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-slate-500">
              Daily revenue and plan activations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {revenueSeries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  <div className="text-center">
                    <div className="text-slate-400 mb-2">No data available</div>
                    <div className="text-xs text-slate-400">
                      Data will appear after transactions
                    </div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueSeries}
                    margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelStyle={{
                        color: "#0f172a", // slate-900 (dark, readable on white tooltip)
                        fontWeight: 600,
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="Revenue"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="plans"
                      name="Plans Created"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Plan Distribution
            </CardTitle>
            <CardDescription className="text-slate-500">
              Breakdown by plan type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {distributionData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  <div className="text-center">
                    <div className="text-slate-400">No active plans</div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {distributionData.map((entry, idx) => (
                        <Cell
                          key={entry.code}
                          fill={pieColors[idx % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <Card className="xl:col-span-3 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-slate-900">
                  {tab === "plans" ? "Episode Plans" : "Trials"}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {tab === "plans"
                    ? "All active and past plans"
                    : "Trial usage and eligibility"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={tab === "plans" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTab("plans")}
                  className={
                    tab === "plans"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "border-slate-300"
                  }
                >
                  Plans
                </Button>
                <Button
                  variant={tab === "trials" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTab("trials")}
                  className={
                    tab === "trials"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "border-slate-300"
                  }
                >
                  Trials
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tab === "plans" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-700 border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Plan</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Period</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.items.map((p, idx) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">
                            {p.user?.name || p.userUid}
                          </div>
                          <div className="text-xs text-slate-500">
                            {p.user?.email || p.userUid}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          {planLabel(p.planCode)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              p.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs text-slate-600 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {niceDate(p.startAt).split(",")[0]} to{" "}
                            {niceDate(p.endAt).split(",")[0]}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-900">
                          {p.billing?.amount ? `৳${p.billing.amount}` : "—"}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {p.status === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelPlan(p.id)}
                              className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {plans.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-500"
                        >
                          No plans found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-700 border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Trial Period</th>
                      <th className="py-3 px-4 font-semibold">Next Eligible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trials.items.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">
                            {t.user?.name || t.userUid}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t.user?.email || t.userUid}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              t.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600">
                          {niceDate(t.trialStartAt).split(",")[0]} to{" "}
                          {niceDate(t.trialEndAt).split(",")[0]}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600">
                          {t.nextEligibleAt
                            ? niceDate(t.nextEligibleAt).split(",")[0]
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                    {trials.items.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-slate-500"
                        >
                          No trials found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Recent Activity
            </CardTitle>
            <CardDescription className="text-slate-500">
              Latest subscription changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activity.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">
                  No recent activity
                </div>
              ) : (
                activity.map((a, i) => (
                  <div
                    key={i}
                    className="text-sm border-l-2 border-indigo-300 pl-3 py-1"
                  >
                    <div className="font-medium text-slate-900">
                      {a.action || "Activity"}
                    </div>
                    <div className="text-xs text-slate-600">
                      {a.user?.name || "User"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {niceDate(a.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grant Plan Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Grant a Subscription Plan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select User
              </label>
              <div className="relative">
                <Input
                  placeholder="Search user by name, email, or UID..."
                  value={grantUserQuery}
                  onChange={(e) => setGrantUserQuery(e.target.value)}
                  className="mb-2 border-slate-300"
                />
                {grantUserQuery && !grantSelectedUser && (
                  <div className="absolute top-10 left-0 right-0 border border-slate-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredUsers(grantUserQuery).map((u) => (
                      <div
                        key={u.uid}
                        onClick={() => pickGrantUser(u)}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-900">
                          {u.name}
                        </div>
                        <div className="text-sm text-slate-600">{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
                {grantSelectedUser && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {grantSelectedUser.name}
                      </div>
                      <div className="text-sm text-slate-600">
                        {grantSelectedUser.email}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setGrantSelectedUser(null);
                        setGrantUserQuery("");
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Plan
              </label>
              <Select
                value={grantForm.planCode}
                onValueChange={(v) =>
                  setGrantForm((s) => ({ ...s, planCode: v }))
                }
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCIDENT_PASS_7D">
                    Accident Pass — 7 Days
                  </SelectItem>
                  <SelectItem value="RECOVERY_PLAN_6W">
                    Recovery Plan — 6 Weeks
                  </SelectItem>
                  <SelectItem value="RECOVERY_PLUS_12W">
                    Recovery Plus — 12 Weeks
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Episode Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Apply to Episode
              </label>
              <Select
                value={grantForm.episodeMode}
                onValueChange={(v) =>
                  setGrantForm((s) => ({ ...s, episodeMode: v }))
                }
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most_recent_open">
                    Most recent open episode
                  </SelectItem>
                  <SelectItem value="create_new">Create new episode</SelectItem>
                  <SelectItem value="specific">Specific episode</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {grantForm.episodeMode === "specific" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Episode ID
                </label>
                <Input
                  placeholder="Enter episode ID"
                  value={grantForm.episodeId}
                  onChange={(e) =>
                    setGrantForm((s) => ({ ...s, episodeId: e.target.value }))
                  }
                  className="border-slate-300"
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Billing Amount (BDT)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={grantForm.amount}
                onChange={(e) =>
                  setGrantForm((s) => ({ ...s, amount: e.target.value }))
                }
                className="border-slate-300"
              />
            </div>

            {grantError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {grantError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantOpen(false)}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={doGrantPlan}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Grant Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Pack Dialog */}
      <Dialog open={packOpen} onOpenChange={setPackOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Grant Credit Pack
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select User
              </label>
              <div className="relative">
                <Input
                  placeholder="Search user by name, email, or UID..."
                  value={packUserQuery}
                  onChange={(e) => setPackUserQuery(e.target.value)}
                  className="mb-2 border-slate-300"
                />
                {packUserQuery && !packSelectedUser && (
                  <div className="absolute top-10 left-0 right-0 border border-slate-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredUsers(packUserQuery).map((u) => (
                      <div
                        key={u.uid}
                        onClick={() => pickPackUser(u)}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-900">
                          {u.name}
                        </div>
                        <div className="text-sm text-slate-600">{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
                {packSelectedUser && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {packSelectedUser.name}
                      </div>
                      <div className="text-sm text-slate-600">
                        {packSelectedUser.email}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPackSelectedUser(null);
                        setPackUserQuery("");
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pack Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Pack Type
              </label>
              <Select
                value={packForm.packType}
                onValueChange={(v) =>
                  setPackForm((s) => ({ ...s, packType: v }))
                }
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCAN_PACK">Scan Pack</SelectItem>
                  <SelectItem value="CONSULTATION_PACK">
                    Consultation Pack
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Credits */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Credits
              </label>
              <Input
                type="number"
                placeholder="Number of credits"
                value={packForm.credits}
                onChange={(e) =>
                  setPackForm((s) => ({ ...s, credits: e.target.value }))
                }
                className="border-slate-300"
              />
            </div>

            {packError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {packError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPackOpen(false)}
              className="border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={doGrantPack}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Grant Pack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
