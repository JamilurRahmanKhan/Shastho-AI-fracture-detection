/**
 * Frontend page: StoreOrderSuccess
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

const StoreOrderSuccess = () => {
  const { orderNo } = useParams();
  const { getTotalItems } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

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
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <div className="text-xl font-bold">Order placed successfully!</div>
            <div className="mt-1 text-sm">Cash on Delivery (COD). Your order number is <span className="font-mono font-semibold">{orderNo}</span>.</div>
          </div>

          {loading ? (
            <div className="text-slate-600">Loading order summary...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-600">Total</div>
                  <div className="text-2xl font-bold text-slate-900">{money.fmt(order?.total)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">Status</div>
                  <div className="text-sm font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-800 inline-block capitalize">{order?.status || 'pending'}</div>
                </div>
              </div>

              <div className="mt-4 text-slate-700">
                <div className="font-semibold">Next steps</div>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                  <li>The pharmacy will confirm your order.</li>
                  <li>You will pay the delivery person upon receipt.</li>
                  <li>If your cart included Rx-required items, the pharmacy may contact you for prescription verification.</li>
                </ul>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to={`/store/orders/${orderNo}`} className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl">View order details</Link>
                <Link to="/store/orders" className="flex-1 text-center border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-xl">Go to order history</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreOrderSuccess;
