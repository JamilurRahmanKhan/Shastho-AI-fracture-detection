/**
 * Frontend page: OrderDetails
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PharmacySidebar from "@/components/pharmacy/pharmacy-sidebar";
import PharmacyNavbar from "@/components/pharmacy/pharmacy-navbar";
import api from "@/services/api";

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "pending") return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
  if (s === "accepted") return <Badge className="bg-purple-100 text-purple-800">Accepted</Badge>;
  if (s === "shipped") return <Badge className="bg-yellow-100 text-yellow-800">Shipped</Badge>;
  if (s === "delivered") return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
  if (s === "cancelled") return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
  return <Badge className="bg-slate-100 text-slate-700">{status || "Unknown"}</Badge>;
}

export default function OrderDetails() {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("pending");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState("pending");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  const fetchOrder = async () => {
    setLoading(true);
    setToast({ type: "", message: "" });
    try {
      const res = await api.getPharmacyOrder(id);
      setOrder(res);
      setStatus(res?.status || "pending");
      setPaymentStatusDraft(res?.paymentStatus || "pending");
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Failed to load order" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const itemsCount = useMemo(() => (order?.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0), [order]);

  const hasRx = useMemo(() => (order?.items || []).some((it) => Boolean(it.requiresPrescription)), [order]);
  const [rxBusy, setRxBusy] = useState(false);

  const handleViewPrescription = async () => {
    try {
      const { blob, contentType } = await api.downloadPharmacyOrderPrescription(order?.id || order?.orderNo || id);
      const url = URL.createObjectURL(new Blob([blob], { type: contentType || blob.type }));
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setToast({ type: 'error', message: e?.message || 'Failed to open prescription' });
    }
  };

  const handlePrescriptionDecision = async (decision) => {
    if (!order) return;
    try {
      setRxBusy(true);
      setToast({ type: '', message: '' });
      const payload = { status: decision };
      if (decision === 'rejected') {
        const reason = window.prompt('Rejection reason:', order?.prescription?.rejectionReason || 'Invalid / unreadable prescription');
        if (reason !== null && String(reason).trim()) payload.rejectionReason = String(reason).trim();
      }
      const updated = await api.updatePharmacyOrderPrescription(order.id || order.orderNo, payload);
      setOrder(updated);
      setPaymentStatusDraft(updated?.paymentStatus || paymentStatusDraft);
      setToast({ type: 'success', message: `Prescription ${decision}` });
      // Refetch to ensure the UI reflects server-derived fields (e.g. store-level status sync)
      await fetchOrder();
    } catch (e) {
      setToast({ type: 'error', message: e?.message || 'Failed to update prescription' });
    } finally {
      setRxBusy(false);
    }
  };

  const updateStatus = async () => {
    if (!order) return;
    try {
      setToast({ type: "", message: "" });
      const payload = { status };
      if (status === "cancelled") {
        const reason = window.prompt("Cancel reason (optional):", order?.cancelReason || "Out of stock");
        if (reason !== null && String(reason).trim()) payload.cancelReason = String(reason).trim();
      }
      const updated = await api.updatePharmacyOrder(order.id || order.orderNo, payload);
      setOrder(updated);
      setStatus(updated?.status || status);
      setToast({ type: "success", message: `Order updated to ${payload.status}` });
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Failed to update status" });
    }
  };

  const updatePaymentStatus = async () => {
    if (!order) return;
    try {
      setPaymentBusy(true);
      setToast({ type: "", message: "" });
      const updated = await api.updatePharmacyOrderPaymentStatus(order.id || order.orderNo, {
        paymentStatus: paymentStatusDraft,
      });
      setOrder(updated);
      setPaymentStatusDraft(updated?.paymentStatus || paymentStatusDraft);
      setToast({ type: "success", message: `Payment status updated to ${paymentStatusDraft}` });
    } catch (e) {
      setToast({ type: "error", message: e?.message || "Failed to update payment status" });
    } finally {
      setPaymentBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PharmacySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <PharmacyNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6">
          <div className="mb-6">
            <Link to="/pharmacy/orders">
              <Button variant="outline" className="mb-4 bg-transparent">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Orders
              </Button>
            </Link>

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
                <p className="text-gray-600">
                  {order ? (
                    <>Order <span className="font-semibold">{order.orderNo}</span> • {itemsCount} items</>
                  ) : (
                    "Loading order…"
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {order && <StatusBadge status={order.status} />}
                <Button variant="outline" className="bg-transparent" onClick={fetchOrder}>
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {!!toast.message && (
            <div
              className={`mb-6 rounded-md border p-3 text-sm ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {toast.message}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Fulfillment Status</h2>
                  {order && <StatusBadge status={order.status} />}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={updateStatus} disabled={!order || loading}>
                    Update Status
                  </Button>

                  {order?.status === "cancelled" && order?.cancelReason && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                      <span className="font-semibold">Cancel reason:</span> {order.cancelReason}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
                <div className="space-y-4">
                  {(order?.items || []).map((it, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{it.name}</p>
                        <p className="text-sm text-gray-600">
                          {Number(it.unitPrice || 0).toFixed(2)} × {it.quantity}
                          {it.requiresPrescription ? " • Rx Required" : ""}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ৳{Number(it.lineTotal || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  {!order && (
                    <div className="text-gray-500">{loading ? "Loading…" : "Order not found"}</div>
                  )}
                </div>

                {order && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{Number(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{Number(order.shipping || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{Number(order.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                      <span>Total</span>
                      <span>
                        ৳{Number(order.total || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Payment: COD • Status: {order.paymentStatus || "pending"}</div>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Customer / Delivery</h3>
                {order ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">User UID</p>
                      <p className="font-semibold text-gray-900">{order.userUid}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Phone</p>
                      <p className="text-gray-900">{order.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Address</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{order.shippingAddress}</p>
                    </div>
                    {order.notes ? (
                      <div>
                        <p className="text-gray-600 mb-1">Notes</p>
                        <p className="text-gray-900 whitespace-pre-wrap">{order.notes}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{loading ? "Loading…" : "Not found"}</p>
                )}
              </Card>

              {order && hasRx && (
                <Card className="p-6 border border-amber-200 bg-amber-50/40">
                  <h3 className="font-semibold text-gray-900 mb-4">Prescription</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-gray-600 mb-1">Status</p>
                        <p className="font-semibold text-gray-900">{order?.prescription?.status || 'pending'}</p>
                      </div>
                      <Button variant="outline" className="bg-transparent" onClick={handleViewPrescription}>
                        View Prescription
                      </Button>
                    </div>

                    {(order?.prescription?.status === 'pending' || !order?.prescription?.status) && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          disabled={rxBusy}
                          onClick={() => handlePrescriptionDecision('approved')}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                        <Button
                          disabled={rxBusy}
                          onClick={() => handlePrescriptionDecision('rejected')}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {order?.prescription?.status === 'rejected' && order?.prescription?.rejectionReason ? (
                      <p className="text-xs text-amber-900">Reason: {order.prescription.rejectionReason}</p>
                    ) : null}
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Payment</h3>
                {order ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method</span>
                      <span className="font-semibold text-gray-900">{order.paymentMethod || "COD"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge className="bg-teal-100 text-teal-700">{order.paymentStatus || "pending"}</Badge>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Update payment status</div>
                      <div className="space-y-2">
                        <Select value={paymentStatusDraft} onValueChange={setPaymentStatusDraft}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">pending</SelectItem>
                            <SelectItem value="paid">paid</SelectItem>
                            <SelectItem value="failed">failed</SelectItem>
                            <SelectItem value="refunded">refunded</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={updatePaymentStatus}
                          disabled={paymentBusy || (paymentStatusDraft === (order.paymentStatus || 'pending'))}
                          className="w-full"
                        >
                          {paymentBusy ? 'Updating…' : 'Update Payment'}
                        </Button>
                        <p className="text-xs text-gray-500">
                          For COD orders, mark <span className="font-semibold">paid</span> after delivery is confirmed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
