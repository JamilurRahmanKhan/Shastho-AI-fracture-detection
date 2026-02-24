/**
 * Frontend page: Orders
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/services/api";

function fmtMoney(symbol, amount) {
  const n = Number(amount || 0);
  return `${symbol || ""}${n.toFixed(2)}`;
}

function statusBadge(s) {
  const v = String(s || "").toLowerCase();
  if (v === "cancelled") return <Badge className="bg-red-600 text-white">Cancelled</Badge>;
  if (v === "delivered") return <Badge className="bg-green-600 text-white">Delivered</Badge>;
  if (v === "shipped") return <Badge className="bg-blue-600 text-white">Shipped</Badge>;
  if (v === "processing" || v === "accepted") return <Badge className="bg-amber-600 text-white">Processing</Badge>;
  if (v === "placed" || v === "pending") return <Badge className="bg-gray-900 text-white">Placed</Badge>;
  return <Badge className="bg-gray-600 text-white">{s || ""}</Badge>;
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.adminListStoreOrders({
        status: status === "all" ? "" : status,
        q: q.trim(),
        limit: 100,
      });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((o) => {
      if (status !== "all" && String(o.status || "") !== status) return false;
      if (!qq) return true;
      return String(o.orderNo || "").toLowerCase().includes(qq) || String(o.userUid || "").toLowerCase().includes(qq);
    });
  }, [items, q, status]);

  const openDetails = async (order) => {
    setSelected(order);
    setDetails(null);
    setOpen(true);
    try {
      const res = await api.adminGetStoreOrder(order.orderNo || order.id);
      setDetails(res);
    } catch (e) {
      setDetails({ error: e?.message || "Failed to load order details" });
    }
  };

  const cancelOrder = async (orderNo) => {
    const reason = window.prompt("Cancel reason (will be shown to user)", "Cancelled by admin");
    if (!reason) return;
    try {
      setActionBusy(true);
      await api.adminCancelStoreOrder(orderNo, { reason });
      await load();
      if (selected?.orderNo === orderNo) {
        const res = await api.adminGetStoreOrder(orderNo);
        setDetails(res);
      }
    } catch (e) {
      alert(e?.message || "Failed to cancel order");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Orders</h1>
          <p className="text-gray-600">Admin view for medical store orders (global)</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">{error}</div>}

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600">Search (order no / user uid)</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SO-YYYYMMDD-..." />
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={load} disabled={loading}>
              Apply
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-semibold text-gray-900">{o.orderNo}</td>
                    <td className="py-3 pr-4 text-gray-700">{o.userUid}</td>
                    <td className="py-3 pr-4 text-gray-900">{fmtMoney(o.currencySymbol, o.total)}</td>
                    <td className="py-3 pr-4">{statusBadge(o.status)}</td>
                    <td className="py-3 pr-4 text-gray-600">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</td>
                    <td className="py-3 pr-4">
                      <Button size="sm" variant="outline" onClick={() => openDetails(o)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-600">No orders found.</div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {!details ? (
            <div className="text-gray-600">Loading...</div>
          ) : details?.error ? (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{details.error}</div>
          ) : (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{details.order.orderNo}</div>
                    <div className="text-sm text-gray-600">User: {details.order.userUid}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(details.order.status)}
                    <div className="font-semibold text-gray-900">{fmtMoney(details.order.currencySymbol, details.order.total)}</div>
                    {String(details.order.status || "").toLowerCase() !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={actionBusy}
                        onClick={() => cancelOrder(details.order.orderNo)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="font-semibold text-gray-900 mb-2">Items</div>
                <div className="space-y-2">
                  {(details.order.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="text-gray-900">
                        {it.name} <span className="text-gray-500">× {it.quantity}</span>
                      </div>
                      <div className="text-gray-900">{fmtMoney(details.order.currencySymbol, it.lineTotal)}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="font-semibold text-gray-900 mb-2">Pharmacy Orders</div>
                {(details.pharmacyOrders || []).length ? (
                  <div className="space-y-2">
                    {details.pharmacyOrders.map((po) => (
                      <div key={po.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded border">
                        <div>
                          <div className="font-semibold text-gray-900">{po.orderNo}</div>
                          <div className="text-xs text-gray-600">Pharmacy UID: {po.pharmacyUid}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {statusBadge(po.status)}
                          <div className="text-sm text-gray-900">{fmtMoney(po.currencySymbol, po.total)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No pharmacy orders linked.</div>
                )}
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
