/**
 * Frontend page: Analytics
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Users,
  ClipboardList,
  Stethoscope,
  ShoppingCart,
  RefreshCcw,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function compact(n) {
  const x = Number(n || 0);
  if (Number.isNaN(x)) return '0';
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(x);
}

function niceDateLabel(iso) {
  // iso: YYYY-MM-DD
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function StatCard({ icon: Icon, title, value, sub }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
            {sub ? <div className="mt-1 text-sm text-gray-600">{sub}</div> : null}
          </div>
          <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
            <Icon className="h-5 w-5 text-gray-700" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function AdminAnalytics() {
  const [rangeDays, setRangeDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.adminAnalyticsSummary({ rangeDays });
      setData(res);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Failed to load analytics.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const kpis = useMemo(() => {
    const fs = data?.firestore || {};
    const mongo = data?.mongo || {};

    const usersTotal = fs?.users?.total || 0;
    const rrPending = fs?.roleRequests?.pending || 0;
    const rrUnseen = fs?.roleRequests?.pendingUnseen || 0;

    const mongoCounts = mongo?.counts || {};
    const xrayTotal = mongoCounts?.xrays?.total || 0;
    const xrayInRange = mongoCounts?.xrays?.inRange || 0;
    const apptTotal = mongoCounts?.appointments?.total || 0;
    const apptInRange = mongoCounts?.appointments?.inRange || 0;
    const ordersTotal = mongoCounts?.storeOrders?.total || 0;
    const ordersInRange = mongoCounts?.storeOrders?.inRange || 0;

    return {
      usersTotal,
      rrPending,
      rrUnseen,
      xrayTotal,
      xrayInRange,
      apptTotal,
      apptInRange,
      ordersTotal,
      ordersInRange,
      mongoAvailable: !!mongo?.available,
    };
  }, [data]);

  const series = useMemo(() => {
    const fsSeries = Array.isArray(data?.firestore?.roleRequests?.series) ? data.firestore.roleRequests.series : [];
    const mongoSeries = data?.mongo?.series || {};
    const xraySeries = Array.isArray(mongoSeries?.xrays) ? mongoSeries.xrays : [];
    const apptSeries = Array.isArray(mongoSeries?.appointments) ? mongoSeries.appointments : [];
    const orderSeries = Array.isArray(mongoSeries?.storeOrders) ? mongoSeries.storeOrders : [];

    // Merge by date
    const map = new Map();
    const add = (arr, key) => {
      arr.forEach((r) => {
        if (!r?.date) return;
        const cur = map.get(r.date) || { date: r.date };
        cur[key] = Number(r.count || 0);
        map.set(r.date, cur);
      });
    };
    add(fsSeries, 'roleRequests');
    add(xraySeries, 'xrays');
    add(apptSeries, 'appointments');
    add(orderSeries, 'storeOrders');

    const out = [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return out;
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Operational overview for ShasthoAI (role requests, X-ray cases, appointments, and orders).</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="select select-bordered bg-white"
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {!kpis.mongoAvailable ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900">MongoDB is not connected</div>
            <div className="text-sm text-amber-800 mt-1">
              Analytics will still show Firestore-based metrics (users and role requests), but X-ray / appointments / orders metrics are unavailable
              until MongoDB is running.
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Total users" value={compact(kpis.usersTotal)} sub="All roles (Firestore)" />
        <StatCard
          icon={ClipboardList}
          title="Pending role requests"
          value={compact(kpis.rrPending)}
          sub={`${compact(kpis.rrUnseen)} unseen`}
        />
        <StatCard
          icon={Activity}
          title={`X-ray cases (${rangeDays}d)`}
          value={compact(kpis.xrayInRange)}
          sub={`${compact(kpis.xrayTotal)} total`}
        />
        <StatCard
          icon={Stethoscope}
          title={`Appointments (${rangeDays}d)`}
          value={compact(kpis.apptInRange)}
          sub={`${compact(kpis.apptTotal)} total`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Activity (daily)</CardTitle>
            <CardDescription>Combined operational activity across core modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-600">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={niceDateLabel} minTickGap={18} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => niceDateLabel(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="roleRequests" name="Role requests" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="xrays" name="X-ray cases" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="appointments" name="Appointments" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="storeOrders" name="Store orders" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store snapshot</CardTitle>
            <CardDescription>Orders volume and basic operational signal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Orders in range</div>
                <div className="text-lg font-semibold text-gray-900">{compact(kpis.ordersInRange)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Total orders</div>
                <div className="text-lg font-semibold text-gray-900">{compact(kpis.ordersTotal)}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <ShoppingCart className="h-4 w-4" />
                  Admin checklist
                </div>
                <ul className="mt-2 text-sm text-gray-700 space-y-1 list-disc pl-5">
                  <li>Review unseen role requests daily.</li>
                  <li>Monitor unusual spikes in X-ray uploads.</li>
                  <li>Check pending orders and appointments.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
