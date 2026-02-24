/**
 * Frontend page: Store
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  X,
  MapPin,
  Phone,
  StickyNote,
  Truck,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  UploadCloud,
  FileText,
} from "lucide-react";

// =============================================================================
// COMPONENT IMPORTS
// =============================================================================

// Layout and UI Components
import StoreHeader from "../StoreHeader/StoreHeader"; // Store header with logo and cart
import StoreHero from "../StoreHero/StoreHero"; // Hero section with store branding
import LoadingSpinner from "../../Dashboard/LoadingSpinner/LoadingSpinner"; // Loading animation

// Product Browsing Components
import SearchFilters from "../ProductGrid/SearchFilters/SearchFilters"; // Search and filter controls
import ProductCard from "../ProductGrid/ProductCard/ProductCard"; // Individual product display

// Shopping Cart Components
import CartItem from "../ShoppingCart/CartItem/CartItem"; // Single cart item with controls
import OrderSummary from "../ShoppingCart/OrderSummary/OrderSummary"; // Cart total and checkout

// Navigation Components
import TabNavigation from "../TabNavigation/TabNavigation"; // Products vs Cart tabs

// Data Management
import { useStore } from "../hooks/useStore"; // Custom hook for store state
import { api } from "@/services/api";
import { auth } from "@/firebase/firebase";

// =============================================================================
// MAIN STORE COMPONENT
// =============================================================================

/**
 * Store Page Component
 *
 * Main medical store interface providing comprehensive product browsing and
 * shopping cart functionality. Features a dual-tab interface for seamless
 * switching between product discovery and cart management.
 *
 * 🏪 KEY FEATURES:
 * - Advanced product search and filtering system
 * - Real-time shopping cart with persistent storage
 * - Responsive grid layout for optimal viewing on all devices
 * - Professional healthcare-focused UI/UX design
 * - Empty state handling for both products and cart
 * - Smooth tab-based navigation between browsing and cart
 *
 * 🎯 USER FLOW:
 * 1. Users land on Products tab with search/filter capabilities
 * 2. Browse medications using search, category filters, and sorting
 * 3. Add items to cart which persists across sessions
 * 4. Switch to Cart tab to review, modify, and checkout
 * 5. Return to Products tab to continue shopping
 *
 * 📱 RESPONSIVE BEHAVIOR:
 * - Mobile: Stacked layout, full-width components
 * - Tablet: 2-column product grid, optimized filters
 * - Desktop: 3-column product grid, side-by-side cart layout
 *
 * @component
 * @example
 * <Store />
 *
 * @returns {JSX.Element} Fully rendered medical store interface
 */
const Store = () => {
  // ===========================================================================
  // STATE MANAGEMENT & DATA HOOKS
  // ===========================================================================

  /**
   * Custom hook providing complete store state management
   * Manages products, cart, filters, and all store operations
   */
  const {
    // Product Data & Filtering
    medications, // Array of filtered medication products
    searchTerm, // Current search query string
    setSearchTerm, // Update search term function
    selectedCategory, // Currently selected category filter
    setSelectedCategory, // Update category filter function
    sortBy, // Current sorting criteria
    setSortBy, // Update sorting criteria function

    // Shopping Cart
    cart, // Array of items in shopping cart
    addToCart, // Function to add product to cart
    updateQuantity, // Function to update cart item quantity

    // UI State & Data
    isLoading, // Loading state for initial data fetch
    categories, // Available product categories for filtering

    // Utility Functions
    getTotalPrice, // Calculate total cart price
    getTotalItems, // Calculate total items in cart
    cartLoading,
    cartError,
    cartNotice,
    loadCart,
    clearCart,

    // Pricing (Phase 7+)
    pricingConfig,
  } = useStore();

  const [checkoutState, setCheckoutState] = useState({
    open: false,
    addressId: "",
    addresses: [],
    addressesLoading: false,
    shippingAddress: "",
    phone: "",
    notes: "",
    prescriptionFile: null,
    doctorNote: "",
    loading: false,
    error: "",
    successOrderNo: "",
  });

  const rxRequired = useMemo(
    () => (cart || []).some((it) => Boolean(it.requiresPrescription)),
    [cart]
  );

  /**
   * Active tab state management
   * Controls which main view is displayed: Products or Shopping Cart
   * @state {string} activeTab - Current active tab ('products' | 'cart')
   */
  const location = useLocation();
  const nav = useNavigate();
  const initialTab = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get("tab");
    return t === "cart" ? "cart" : "products";
  }, [location.search]);

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Deep-link support: /store?tab=cart&checkout=1 (used by Buy Now)
  useEffect(() => {
    const sp = new URLSearchParams(location.search || "");
    const checkout = sp.get("checkout");
    if (checkout === "1") {
      setActiveTab("cart");
      setCheckoutState((s) => ({ ...s, open: true }));
    }
  }, [location.search]);

  const handleSetTab = (tab) => {
    setActiveTab(tab);
    const sp = new URLSearchParams(location.search);
    sp.set("tab", tab);
    nav({ pathname: "/store", search: `?${sp.toString()}` }, { replace: true });
  };

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Reset all search and filter criteria to default values
   * Clears search term, resets category to 'all', and sets default sorting
   *
   * @handler
   * @usage Called when user clicks "Clear Filters" in empty state
   */
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSortBy("name");
  };

  /**
   * Navigate user from Cart tab back to Products tab
   * Provides seamless continuation of shopping experience
   *
   * @handler
   * @usage Called when user clicks "Browse Products" in empty cart state
   */
  const handleContinueShopping = () => {
    handleSetTab("products");
  };

  const handleStartCheckout = () => {
    setCheckoutState((s) => ({
      ...s,
      open: true,
      error: "",
      successOrderNo: "",
      prescriptionFile: null,
      doctorNote: "",
    }));
  };

  // Load saved addresses when the checkout panel is opened.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!checkoutState.open) return;
      if (!auth.currentUser) return;

      setCheckoutState((s) => ({ ...s, addressesLoading: true }));
      try {
        const res = await api.listStoreAddresses();
        const list = Array.isArray(res?.items) ? res.items : [];
        const defaultAddr = list.find((a) => a.isDefault) || list[0] || null;

        if (cancelled) return;
        setCheckoutState((s) => {
          const keepManualAddress = String(s.shippingAddress || "").trim();
          const keepManualPhone = String(s.phone || "").trim();
          return {
            ...s,
            addresses: list,
            addressesLoading: false,
            addressId: s.addressId || (defaultAddr ? defaultAddr.id : ""),
            shippingAddress:
              keepManualAddress ||
              (defaultAddr ? defaultAddr.formatted || "" : ""),
            phone:
              keepManualPhone || (defaultAddr ? defaultAddr.phone || "" : ""),
          };
        });
      } catch {
        if (cancelled) return;
        setCheckoutState((s) => ({
          ...s,
          addressesLoading: false,
          addresses: [],
        }));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [checkoutState.open]);

  const handleCheckout = async () => {
    if (!auth.currentUser) {
      nav("/login", { state: { from: "/store?tab=cart" } });
      return;
    }

    const shippingAddress = checkoutState.shippingAddress.trim();
    const phone = checkoutState.phone.trim();
    if (!shippingAddress || !phone) {
      setCheckoutState((s) => ({
        ...s,
        error: "Shipping address and phone are required.",
      }));
      return;
    }

    setCheckoutState((s) => ({
      ...s,
      loading: true,
      error: "",
      successOrderNo: "",
    }));
    try {
      let prescriptionFileId = "";
      if (rxRequired) {
        if (!checkoutState.prescriptionFile) {
          setCheckoutState((s) => ({
            ...s,
            loading: false,
            error: "This order requires a prescription file.",
          }));
          return;
        }
        const up = await api.uploadStorePrescription(
          checkoutState.prescriptionFile,
          checkoutState.doctorNote.trim()
        );
        prescriptionFileId = up?.fileId || "";
      }

      const res = await api.checkoutCOD({
        ...(checkoutState.addressId
          ? { addressId: checkoutState.addressId }
          : {}),
        shippingAddress,
        phone,
        notes: checkoutState.notes.trim(),
        ...(rxRequired
          ? { prescriptionFileId, doctorNote: checkoutState.doctorNote.trim() }
          : {}),
      });
      const orderNo = res?.order?.orderNo || "";
      setCheckoutState((s) => ({
        ...s,
        loading: false,
        successOrderNo: orderNo,
        open: false,
      }));
      // Refresh cart UI
      await loadCart();
      if (orderNo) {
        nav(`/store/order-success/${orderNo}`);
      }
    } catch (e) {
      setCheckoutState((s) => ({
        ...s,
        loading: false,
        error: e?.message || "Checkout failed",
      }));
    }
  };

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  /**
   * Display loading spinner while store data is being initialized
   * Prevents rendering incomplete UI during data fetch
   */
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // ===========================================================================
  // MAIN COMPONENT RENDER
  // ===========================================================================

  return (
    /**
     * Main container with gradient background for visual appeal
     * Uses healthcare-appropriate colors (blue/indigo) for brand consistency
     */
    <div className="min-h-screen bg-[#FCFDFF] from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Store Header */}
      <StoreHeader cartItemsCount={getTotalItems()} />

      {/* Main Content Container */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Hero Section */}
        <StoreHero
          currencySymbol={pricingConfig?.currencySymbol || "৳"}
          freeShippingThreshold={pricingConfig?.freeShippingThreshold ?? 0}
        />

        {/* Main Content Area - Tabs & Content */}
        <div className="space-y-6 sm:space-y-8">
          {/* Tab Navigation Component */}
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={handleSetTab}
            cartItemsCount={getTotalItems()}
          />

          {/* Products Tab Content */}
          {activeTab === "products" && (
            <div className="space-y-6 sm:space-y-8">
              {/* Search and Filters Component */}
              <SearchFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
                categories={categories}
              />

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {medications.map((medication) => (
                  <ProductCard
                    key={medication.id}
                    medication={medication}
                    onAddToCart={addToCart}
                    currencySymbol={
                      medication.currencySymbol ||
                      pricingConfig?.currencySymbol ||
                      "৳"
                    }
                  />
                ))}
              </div>

              {/* Empty Products State */}
              {medications.length === 0 && (
                <div className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 text-center">
                  {/* Empty state icon */}
                  <Search className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4 sm:mb-6" />

                  {/* Empty state heading */}
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
                    No products found
                  </h3>

                  {/* Helpful guidance text */}
                  <p className="text-slate-600 text-base sm:text-lg mb-6 sm:mb-8">
                    Try adjusting your search or filter criteria
                  </p>

                  {/* Clear filters action button */}
                  <button
                    onClick={handleClearFilters}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center mx-auto"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cart Tab Content */}
          {activeTab === "cart" && (
            <div className="space-y-6 sm:space-y-8">
              {cartError && (
                <div className="border border-red-200 bg-red-50 text-red-800 rounded-xl p-4">
                  {cartError}
                </div>
              )}

              {cartNotice && !cartError && (
                <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-xl p-4">
                  {cartNotice}
                </div>
              )}

              {cartLoading && (
                <div className="border-0 shadow bg-white/80 rounded-2xl p-6 text-center text-slate-600">
                  Loading cart...
                </div>
              )}

              {/* Empty Cart State */}
              {cart.length === 0 ? (
                <div className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 text-center">
                  {/* Empty cart icon */}
                  <ShoppingCart className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400 mx-auto mb-6 sm:mb-8" />

                  {/* Empty cart heading */}
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
                    Your cart is empty
                  </h3>

                  {/* Encouraging text */}
                  <p className="text-slate-600 mb-6 sm:mb-8 text-lg sm:text-xl">
                    Add some medications to get started
                  </p>

                  {/* Continue shopping action button */}
                  <button
                    onClick={handleContinueShopping}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center mx-auto text-base sm:text-lg"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Browse Products
                  </button>
                </div>
              ) : (
                /* Cart With Items */
                <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Cart Items List - 2/3 width on desktop */}
                  <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {cart.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                      />
                    ))}
                  </div>

                  {/* Order Summary - 1/3 width on desktop, full on mobile */}
                  <div className="space-y-4">
                    <OrderSummary
                      totalPrice={getTotalPrice()}
                      totalItems={getTotalItems()}
                      onProceedToCheckout={handleStartCheckout}
                      isCheckoutDisabled={cartLoading || checkoutState.loading}
                    />
                    {checkoutState.open && (
                      <div className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-5">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                              <Truck className="w-5 h-5 text-emerald-700" />
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                Checkout{" "}
                                <span className="text-slate-500 font-semibold">
                                  (Cash on Delivery)
                                </span>
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                Confirm your delivery details to place the
                                order.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setCheckoutState((s) => ({
                                ...s,
                                open: false,
                                error: "",
                              }))
                            }
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                          >
                            <X className="w-4 h-4" />
                            Close
                          </button>
                        </div>

                        {/* Success / Error */}
                        {checkoutState.successOrderNo && (
                          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-semibold">
                                Order placed successfully.
                              </div>
                              <div className="mt-1">
                                Order No:{" "}
                                <span className="font-bold">
                                  {checkoutState.successOrderNo}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {checkoutState.error && (
                          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
                            <div className="text-sm font-semibold">
                              {checkoutState.error}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          {/* Saved Addresses */}
                          {auth.currentUser && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                  <div className="text-sm font-bold text-slate-900">
                                    Saved Addresses
                                  </div>
                                  <div className="text-xs text-slate-600">
                                    Pick an address or enter manually.
                                  </div>
                                </div>
                                <Link
                                  to="/store/addresses"
                                  className="text-xs font-bold text-blue-600 hover:underline"
                                >
                                  Manage
                                </Link>
                              </div>

                              {checkoutState.addressesLoading ? (
                                <div className="text-sm text-slate-600">
                                  Loading saved addresses...
                                </div>
                              ) : checkoutState.addresses.length === 0 ? (
                                <div className="text-sm text-slate-600">
                                  No saved addresses yet. Add one from{" "}
                                  <Link
                                    to="/store/addresses"
                                    className="font-bold text-blue-600 hover:underline"
                                  >
                                    Addresses
                                  </Link>
                                  .
                                </div>
                              ) : (
                                <div className="relative">
                                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                                  <select
                                    value={checkoutState.addressId}
                                    onChange={(e) => {
                                      const id = e.target.value;
                                      const addr = checkoutState.addresses.find(
                                        (a) => a.id === id
                                      );
                                      setCheckoutState((s) => ({
                                        ...s,
                                        addressId: id,
                                        shippingAddress: addr
                                          ? addr.formatted || ""
                                          : s.shippingAddress,
                                        phone: addr
                                          ? addr.phone || s.phone
                                          : s.phone,
                                      }));
                                    }}
                                    className="w-full appearance-none pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                  >
                                    <option value="">
                                      Enter address manually
                                    </option>
                                    {checkoutState.addresses.map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {(a.label || "Address") +
                                          (a.isDefault ? " (Default)" : "") +
                                          " — " +
                                          (a.line1 || "")}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Shipping Address */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                              Shipping Address
                            </label>

                            <div className="relative">
                              <MapPin className="pointer-events-none absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                              <textarea
                                rows={3}
                                value={checkoutState.shippingAddress}
                                onChange={(e) =>
                                  setCheckoutState((s) => ({
                                    ...s,
                                    shippingAddress: e.target.value,
                                    addressId: s.addressId ? "" : s.addressId,
                                  }))
                                }
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                       disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed resize-none"
                                placeholder="House, road, area, city"
                                disabled={Boolean(checkoutState.addressId)}
                              />
                            </div>

                            {checkoutState.addressId ? (
                              <p className="text-xs text-slate-500 mt-2">
                                Loaded from saved address. Select{" "}
                                <span className="font-semibold">
                                  “Enter address manually”
                                </span>{" "}
                                to edit.
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 mt-2">
                                Be specific so the rider can find you quickly.
                              </p>
                            )}
                          </div>

                          {/* Phone + Notes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <label className="block text-sm font-bold text-slate-900 mb-2">
                                Phone
                              </label>
                              <div className="relative">
                                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  value={checkoutState.phone}
                                  onChange={(e) =>
                                    setCheckoutState((s) => ({
                                      ...s,
                                      phone: e.target.value,
                                    }))
                                  }
                                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                  placeholder="01XXXXXXXXX"
                                  inputMode="tel"
                                />
                              </div>
                              <p className="text-xs text-slate-500 mt-2">
                                We may call if delivery needs confirmation.
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <label className="block text-sm font-bold text-slate-900 mb-2">
                                Notes{" "}
                                <span className="text-slate-400 font-semibold">
                                  (optional)
                                </span>
                              </label>
                              <div className="relative">
                                <StickyNote className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  value={checkoutState.notes}
                                  onChange={(e) =>
                                    setCheckoutState((s) => ({
                                      ...s,
                                      notes: e.target.value,
                                    }))
                                  }
                                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                  placeholder="Delivery instructions (gate, landmark, etc.)"
                                />
                              </div>
                              <p className="text-xs text-slate-500 mt-2">
                                Example: “Call before arriving.”
                              </p>
                            </div>
                          </div>

                          {/* Prescription required */}
                          {rxRequired && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 border border-amber-200">
                                  <FileText className="w-4.5 h-4.5 text-amber-800" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-amber-900">
                                    Prescription required
                                  </p>
                                  <p className="text-xs text-amber-800 mt-1">
                                    One or more items in your cart require a
                                    prescription. Upload an image or PDF.
                                  </p>

                                  <label className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-sm font-semibold text-amber-900 cursor-pointer hover:bg-white transition">
                                    <UploadCloud className="w-4 h-4" />
                                    {checkoutState.prescriptionFile
                                      ? "Change file"
                                      : "Upload prescription"}
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      onChange={(e) =>
                                        setCheckoutState((s) => ({
                                          ...s,
                                          prescriptionFile:
                                            e.target.files?.[0] || null,
                                        }))
                                      }
                                      className="hidden"
                                    />
                                  </label>

                                  {checkoutState.prescriptionFile && (
                                    <p className="mt-2 text-xs text-amber-900">
                                      Selected:{" "}
                                      <span className="font-semibold">
                                        {checkoutState.prescriptionFile.name}
                                      </span>
                                    </p>
                                  )}

                                  <div className="mt-4">
                                    <label className="block text-xs font-bold text-amber-900 mb-2">
                                      Doctor Note{" "}
                                      <span className="text-amber-700 font-semibold">
                                        (optional)
                                      </span>
                                    </label>
                                    <input
                                      value={checkoutState.doctorNote}
                                      onChange={(e) =>
                                        setCheckoutState((s) => ({
                                          ...s,
                                          doctorNote: e.target.value,
                                        }))
                                      }
                                      className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm bg-white/70 text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-colors"
                                      placeholder="e.g. Doctor name / brief note"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Place Order */}
                          <button
                            onClick={handleCheckout}
                            disabled={
                              checkoutState.loading || !auth.currentUser
                            }
                            className="w-full h-12 rounded-xl text-base font-bold text-white
                   bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700
                   disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed
                   shadow-lg hover:shadow-xl transition-all duration-300
                   focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
                          >
                            {checkoutState.loading
                              ? "Placing order..."
                              : "Place Order (COD)"}
                          </button>

                          {!auth.currentUser && (
                            <p className="text-xs text-slate-600 text-center">
                              You need to log in to checkout.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Store;
