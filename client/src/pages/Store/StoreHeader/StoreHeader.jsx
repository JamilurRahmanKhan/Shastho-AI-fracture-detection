/**
 * Frontend page: StoreHeader
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";

const StoreHeader = ({ cartItemsCount = 0 }) => {
  const { authUser } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const Drawer = () => (
    <div className="fixed inset-0 z-[9999] md:hidden">
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={() => setOpen(false)}
        aria-label="Close menu overlay"
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-[88vw] max-w-[360px] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <div className="text-base font-bold text-slate-900">Menu</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-slate-900" />
          </button>
        </div>

        {/* Links */}
        <div className="p-4 space-y-3">
          <Link
            to="/dashboard"
            className="block w-full rounded-xl px-4 py-3 border border-slate-200 bg-white text-slate-800 font-semibold hover:bg-slate-50 transition"
          >
            Dashboard
          </Link>

          <Link
            to="/store/orders"
            className="block w-full rounded-xl px-4 py-3 border border-slate-200 bg-white text-slate-800 font-semibold hover:bg-slate-50 transition"
            title={authUser ? "View your order history" : "Login to view your order history"}
          >
            My Orders
          </Link>

          <Link
            to="/store/addresses"
            className="block w-full rounded-xl px-4 py-3 border border-slate-200 bg-white text-slate-800 font-semibold hover:bg-slate-50 transition"
            title={authUser ? "Manage your shipping addresses" : "Login to manage your addresses"}
          >
            Addresses
          </Link>

          <Link
            to="/store?tab=cart"
            className="flex items-center justify-between w-full rounded-xl px-4 py-3 border border-emerald-200 bg-emerald-50 text-slate-900 font-bold hover:bg-emerald-100 transition"
            aria-label={`Open cart (${cartItemsCount} items)`}
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart
            </span>

            {cartItemsCount > 0 ? (
              <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                {cartItemsCount}
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-semibold">Empty</span>
            )}
          </Link>
        </div>

        {/* Bottom spacing for safe area */}
        <div className="mt-auto p-4 pt-0">
          <div className="h-[calc(env(safe-area-inset-bottom)+8px)]" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 min-w-0">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white" />
              </div>

              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
                  ShasthoAI Store
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 tracking-wide">
                  MEDICAL STORE
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
              <Link
                to="/dashboard"
                className="whitespace-nowrap text-slate-600 hover:text-slate-900 text-sm lg:text-base font-medium py-2 px-3 rounded-lg transition-colors hover:bg-slate-50"
              >
                Dashboard
              </Link>

              <Link
                to="/store/orders"
                className="whitespace-nowrap text-slate-600 hover:text-slate-900 text-sm lg:text-base font-medium py-2 px-3 rounded-lg transition-colors hover:bg-slate-50"
                title={authUser ? "View your order history" : "Login to view your order history"}
              >
                My Orders
              </Link>

              <Link
                to="/store/addresses"
                className="whitespace-nowrap text-slate-600 hover:text-slate-900 text-sm lg:text-base font-medium py-2 px-3 rounded-lg transition-colors hover:bg-slate-50"
                title={authUser ? "Manage your shipping addresses" : "Login to manage your addresses"}
              >
                Addresses
              </Link>

              {/* Cart (badge NEXT TO icon/text, not far right) */}
              <Link
                to="/store?tab=cart"
                className="inline-flex items-center gap-2 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-sm lg:text-base font-medium py-2 px-3 rounded-lg transition-colors text-slate-900"
                aria-label={`Open cart (${cartItemsCount} items)`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="whitespace-nowrap">Cart</span>
                {cartItemsCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* Mobile actions */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              <Link
                to="/store?tab=cart"
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition"
                aria-label={`Open cart (${cartItemsCount} items)`}
              >
                <ShoppingCart className="w-5 h-5 text-slate-900" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-2 border-white">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-slate-900" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Portal drawer to BODY so it never overlaps weirdly */}
      {open && typeof document !== "undefined" ? createPortal(<Drawer />, document.body) : null}
    </>
  );
};

export default StoreHeader;
