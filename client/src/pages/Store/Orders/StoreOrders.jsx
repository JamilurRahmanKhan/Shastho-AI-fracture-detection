/**
 * Frontend page: StoreOrders
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreHeader from '../StoreHeader/StoreHeader';
import { api } from '@/services/api';
import { useStore } from '../hooks/useStore';

const formatMoney = (n) => {
  const num = Number(n || 0);
  return `৳${num.toFixed(2)}`;
};

const StoreOrders = () => {
  const { getTotalItems } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getStoreOrders();
        if (cancelled) return;
        setOrders(Array.isArray(res?.items) ? res.items : []);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFDFF]">
      <StoreHeader cartItemsCount={getTotalItems()} />
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Your Orders</h1>
          <Link to="/store" className="text-blue-600 hover:text-blue-700 font-semibold">Back to Store</Link>
        </div>

        {loading ? (
          <div className="text-slate-600">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-700">
            You have no orders yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Link
                key={o.id || o.orderNo}
                to={`/store/orders/${o.orderNo}`}
                className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">Order #{o.orderNo}</div>
                    <div className="text-sm text-slate-600">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-slate-900">{formatMoney(o.total, o.currency)}</div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-800 capitalize">
                      {o.status || 'pending'}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      COD
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreOrders;
