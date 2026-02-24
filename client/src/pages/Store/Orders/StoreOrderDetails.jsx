/**
 * Frontend page: StoreOrderDetails
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import StoreHeader from '../StoreHeader/StoreHeader';
import { api } from '@/services/api';
import { useStore } from '../hooks/useStore';

const steps = ['placed', 'processing', 'shipped', 'delivered'];

const StatusTimeline = ({ status }) => {
  const s = (status || '').toLowerCase();
  if (s === 'cancelled') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 font-medium">
        Order cancelled
      </div>
    );
  }
  const idx = steps.indexOf(s);
  return (
    <div className="grid grid-cols-4 gap-2">
      {steps.map((st, i) => {
        const done = idx >= i;
        return (
          <div key={st} className={`rounded-lg border p-3 text-center text-sm font-semibold ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600'}`}>
            {st}
          </div>
        );
      })}
    </div>
  );
};

const StoreOrderDetails = () => {
  const { orderNo } = useParams();
  const { getTotalItems } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [rxUpload, setRxUpload] = useState({ file: null, doctorNote: '', loading: false, error: '', ok: '' });


  const handleReuploadPrescription = async () => {
    try {
      setRxUpload((s) => ({ ...s, loading: true, error: '', ok: '' }));
      if (!rxUpload.file) {
        setRxUpload((s) => ({ ...s, loading: false, error: 'Please choose a prescription file (image or PDF).' }));
        return;
      }
      const id = order?.orderNo || order?.id;
      if (!id) {
        setRxUpload((s) => ({ ...s, loading: false, error: 'Order id not found' }));
        return;
      }
      await api.reuploadStoreOrderPrescription(id, rxUpload.file, rxUpload.doctorNote.trim());
      const fresh = await api.getStoreOrder(id);
      setOrder(fresh);
      setRxUpload({ file: null, doctorNote: '', loading: false, error: '', ok: 'Prescription uploaded. Waiting for pharmacy review.' });
    } catch (e) {
      setRxUpload((s) => ({ ...s, loading: false, error: e?.message || 'Failed to upload prescription' }));
    }
  };

  const handleViewPrescription = async () => {
    try {
      const id = order?.orderNo || order?.id;
      if (!id) return;
      const { blob, filename, contentType } = await api.downloadStoreOrderPrescription(id);
      const url = URL.createObjectURL(new Blob([blob], { type: contentType || blob.type }));
      window.open(url, '_blank', 'noopener,noreferrer');
      // best-effort cleanup
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert(e?.message || 'Failed to open prescription');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const o = await api.getStoreOrder(orderNo);
        if (cancelled) return;
        setOrder(o);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load order');
        setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNo]);

  const money = useMemo(() => {
    const c = order?.currency || 'BDT';
    const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`;
    return { c, fmt };
  }, [order]);

  return (
    <div className="min-h-screen bg-[#FCFDFF]">
      <StoreHeader cartItemsCount={getTotalItems()} />
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
            <Link to="/store/orders" className="text-blue-600 hover:underline font-semibold">Back to orders</Link>
          </div>

          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : !order ? (
            <div className="text-slate-600">Order not found.</div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="text-slate-600 text-sm">Order No</div>
                    <div className="text-xl font-bold text-slate-900">{order.orderNo}</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Placed: {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                  </div>
                </div>

                <div className="mt-4">
                  <StatusTimeline status={order.status} />
                </div>

                {order?.prescription?.status && order.prescription.status !== 'not_required' && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-amber-900">Prescription</div>
                      <div className="text-xs text-amber-800">Status: <span className="font-bold">{order.prescription.status}</span></div>
                    </div>
                    <button
                      onClick={handleViewPrescription}
                      className="inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-sm font-semibold"
                    >
                      View Prescription
                    </button>

                    {String(order?.prescription?.status || '').toLowerCase() === 'rejected' && (
                      <div className="w-full sm:w-auto">
                        <div className="mt-3 sm:mt-0 grid gap-2">
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                            onChange={(e) => setRxUpload((s) => ({ ...s, file: e.target.files?.[0] || null }))}
                          />
                          <input
                            type="text"
                            placeholder="Doctor note (optional)"
                            className="input input-bordered input-sm w-full max-w-xs"
                            value={rxUpload.doctorNote}
                            onChange={(e) => setRxUpload((s) => ({ ...s, doctorNote: e.target.value }))}
                          />
                          <button
                            onClick={handleReuploadPrescription}
                            disabled={rxUpload.loading}
                            className="inline-flex items-center justify-center rounded-xl bg-amber-800 hover:bg-amber-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            {rxUpload.loading ? 'Uploading…' : 'Re-upload Prescription'}
                          </button>
                          {rxUpload.error && <div className="text-xs text-red-700">{rxUpload.error}</div>}
                          {rxUpload.ok && <div className="text-xs text-emerald-800">{rxUpload.ok}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900">Shipping Address</div>
                    <div className="mt-2 text-slate-700 whitespace-pre-wrap">{order.shippingAddress}</div>
                    <div className="mt-2 text-slate-700">Phone: {order.phone}</div>
                    {order.notes && <div className="mt-2 text-slate-600">Notes: {order.notes}</div>}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900">Payment</div>
                    <div className="mt-2 text-slate-700">Method: {order.paymentMethod}</div>
                    <div className="mt-1 text-slate-700">Status: {order.paymentStatus}</div>
                    <div className="mt-4 grid gap-1 text-slate-700">
                      <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{money.fmt(order.subtotal)}</span></div>
                      <div className="flex justify-between"><span>Shipping</span><span className="font-semibold">{money.fmt(order.shipping)}</span></div>
                      <div className="flex justify-between"><span>Tax</span><span className="font-semibold">{money.fmt(order.tax)}</span></div>
                      <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold">{money.fmt(order.total)}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="font-semibold text-slate-900 mb-4">Items</div>
                <div className="space-y-3">
                  {(order.items || []).map((it, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <div>
                        <div className="font-semibold text-slate-900">{it.name}</div>
                        <div className="text-sm text-slate-600">{it.dosage} · {it.form}</div>
                        <div className="text-sm text-slate-600">Qty: {it.quantity}</div>
                      </div>
                      <div className="font-semibold text-slate-900">{money.fmt(it.lineTotal ?? (it.unitPrice || 0) * (it.quantity || 0))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreOrderDetails;
