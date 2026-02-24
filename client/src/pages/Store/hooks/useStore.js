/**
 * Frontend page: useStore
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '@/firebase/firebase';
import { api } from '@/services/api';

const LOCAL_CART_KEY = 'shastho_cart';

function readLocalCart() {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items) {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

/**
 * Store hook
 * - Products are fetched from backend (/api/store/products)
 * - Cart is persisted:
 *   - guest: localStorage
 *   - authenticated user: MongoDB via /api/store/cart
 */
export const useStore = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [pricingConfig, setPricingConfig] = useState({
    currencyCode: 'BDT',
    currencySymbol: '৳',
    taxRate: 0.08,
    shippingFee: 5.99,
    freeShippingThreshold: 50,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');
  const [cartNotice, setCartNotice] = useState('');

  const isMounted = useRef(true);

  const isLoggedIn = Boolean(auth.currentUser);

  const loadPricingConfig = async () => {
    try {
      const cfg = await api.getStorePricingConfig();
      if (cfg && typeof cfg === 'object') setPricingConfig(cfg);
    } catch (e) {
      console.warn('Failed to load pricing config', e);
    }
  };

  // ---------------------------
  // Products
  // ---------------------------
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    loadPricingConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);

        // Map UI sort -> API sort
        let sort = 'name';
        let order = 'asc';
        if (sortBy === 'price-low') {
          sort = 'price';
          order = 'asc';
        } else if (sortBy === 'price-high') {
          sort = 'price';
          order = 'desc';
        } else if (sortBy === 'rating') {
          // backend uses placeholder rating; keep name sort
          sort = 'name';
          order = 'asc';
        } else {
          sort = 'name';
          order = 'asc';
        }

        const data = await api.listStoreProducts({
          search: searchTerm,
          category: selectedCategory,
          sort,
          order,
        });

        if (cancelled) return;
        setAllProducts(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        if (cancelled) return;
        console.error('Failed to load store products', e);
        setAllProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, selectedCategory, sortBy]);

  // ---------------------------
  // Cart
  // ---------------------------

  const loadCart = async () => {
    setCartError('');
    setCartNotice('');
    setCartLoading(true);
    try {
      if (!auth.currentUser) {
        const local = readLocalCart();
        setCart(local);
        return;
      }

      const local = readLocalCart();
      if (local.length) {
        // Merge guest cart into server cart once after login
        await api.syncCart(local.map((it) => ({ productId: it.id || it.productId, quantity: it.quantity || 1 })));
        writeLocalCart([]);
      }

      const data = await api.getCart();
      const items = Array.isArray(data?.items) ? data.items : [];
      setCart(items);
      setCartSummary({
        subtotal: data?.subtotal ?? 0,
        tax: data?.tax ?? 0,
        shipping: data?.shipping ?? 0,
        total: data?.total ?? 0,
        currencyCode: data?.currencyCode || pricingConfig.currencyCode,
        currencySymbol: data?.currencySymbol || pricingConfig.currencySymbol,
        taxRate: data?.taxRate ?? pricingConfig.taxRate,
        shippingFee: data?.shippingFee ?? pricingConfig.shippingFee,
        freeShippingThreshold: data?.freeShippingThreshold ?? pricingConfig.freeShippingThreshold,
        isFreeShipping: Boolean(data?.isFreeShipping),
      });

      // Non-blocking warnings (e.g., price updates)
      const priceChanges = Array.isArray(data?.priceChanges) ? data.priceChanges : [];
      if (priceChanges.length) {
        setCartNotice(`Prices were updated for ${priceChanges.length} item(s) in your cart. Please review before checkout.`);
      }
    } catch (e) {
      console.error('Failed to load cart', e);
      setCartError(e?.message || 'Failed to load cart');
      // fallback to local cart
      setCart(readLocalCart());
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    // Load initial cart
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const addToCart = async (product, qty = 1) => {
    setCartError('');
    setCartNotice('');
    const quantity = Math.max(1, Number(qty) || 1);
    try {
      if (!auth.currentUser) {
        const current = readLocalCart();
        const idx = current.findIndex((x) => String(x.id) === String(product.id));
        if (idx >= 0) current[idx].quantity = (current[idx].quantity || 0) + quantity;
        else current.push({ ...product, quantity });
        writeLocalCart(current);
        setCart(current);
        return;
      }
      const data = await api.addCartItem(product.id, quantity);
      setCart(Array.isArray(data?.items) ? data.items : []);
      setCartSummary({
        subtotal: data?.subtotal ?? 0,
        tax: data?.tax ?? 0,
        shipping: data?.shipping ?? 0,
        total: data?.total ?? 0,
        currencyCode: data?.currencyCode || pricingConfig.currencyCode,
        currencySymbol: data?.currencySymbol || pricingConfig.currencySymbol,
        taxRate: data?.taxRate ?? pricingConfig.taxRate,
        shippingFee: data?.shippingFee ?? pricingConfig.shippingFee,
        freeShippingThreshold: data?.freeShippingThreshold ?? pricingConfig.freeShippingThreshold,
        isFreeShipping: Boolean(data?.isFreeShipping),
      });

      const priceChanges = Array.isArray(data?.priceChanges) ? data.priceChanges : [];
      if (priceChanges.length) {
        setCartNotice(`Prices were updated for ${priceChanges.length} item(s) in your cart. Please review before checkout.`);
      }
    } catch (e) {
      console.error('Failed to add to cart', e);
      setCartError(e?.message || 'Failed to add to cart');
    }
  };

  const updateQuantity = async (productId, delta) => {
    setCartError('');
    setCartNotice('');
    const d = Number(delta) || 0;
    try {
      if (!auth.currentUser) {
        const current = readLocalCart();
        const next = current
          .map((it) => {
            if (String(it.id) !== String(productId)) return it;
            const q = Math.max(0, (it.quantity || 0) + d);
            if (q <= 0) return null;
            return { ...it, quantity: q };
          })
          .filter(Boolean);
        writeLocalCart(next);
        setCart(next);
        return;
      }

      const existing = cart.find((it) => String(it.id || it.productId) === String(productId));
      if (!existing) return;
      const nextQty = Math.max(0, (existing.quantity || 0) + d);
      if (nextQty <= 0) {
        const data = await api.removeCartItem(productId);
        setCart(Array.isArray(data?.items) ? data.items : []);
        setCartSummary({
          subtotal: data?.subtotal ?? 0,
          tax: data?.tax ?? 0,
          shipping: data?.shipping ?? 0,
          total: data?.total ?? 0,
          currencyCode: data?.currencyCode || pricingConfig.currencyCode,
          currencySymbol: data?.currencySymbol || pricingConfig.currencySymbol,
          taxRate: data?.taxRate ?? pricingConfig.taxRate,
          shippingFee: data?.shippingFee ?? pricingConfig.shippingFee,
          freeShippingThreshold: data?.freeShippingThreshold ?? pricingConfig.freeShippingThreshold,
          isFreeShipping: Boolean(data?.isFreeShipping),
        });

        const priceChanges = Array.isArray(data?.priceChanges) ? data.priceChanges : [];
        if (priceChanges.length) {
          setCartNotice(`Prices were updated for ${priceChanges.length} item(s) in your cart. Please review before checkout.`);
        }
      } else {
        const data = await api.setCartItemQty(productId, nextQty);
        setCart(Array.isArray(data?.items) ? data.items : []);
        setCartSummary({
          subtotal: data?.subtotal ?? 0,
          tax: data?.tax ?? 0,
          shipping: data?.shipping ?? 0,
          total: data?.total ?? 0,
          currencyCode: data?.currencyCode || pricingConfig.currencyCode,
          currencySymbol: data?.currencySymbol || pricingConfig.currencySymbol,
          taxRate: data?.taxRate ?? pricingConfig.taxRate,
          shippingFee: data?.shippingFee ?? pricingConfig.shippingFee,
          freeShippingThreshold: data?.freeShippingThreshold ?? pricingConfig.freeShippingThreshold,
          isFreeShipping: Boolean(data?.isFreeShipping),
        });

        const priceChanges = Array.isArray(data?.priceChanges) ? data.priceChanges : [];
        if (priceChanges.length) {
          setCartNotice(`Prices were updated for ${priceChanges.length} item(s) in your cart. Please review before checkout.`);
        }
      }
    } catch (e) {
      console.error('Failed to update cart quantity', e);
      setCartError(e?.message || 'Failed to update cart');
    }
  };

  const clearCart = async () => {
    setCartError('');
    setCartNotice('');
    try {
      if (!auth.currentUser) {
        writeLocalCart([]);
        setCart([]);
        return;
      }
      const data = await api.clearCart();
      setCart(Array.isArray(data?.items) ? data.items : []);
      setCartSummary({ subtotal: data?.subtotal ?? 0, tax: data?.tax ?? 0, shipping: data?.shipping ?? 0, total: data?.total ?? 0, currencyCode: data?.currencyCode || pricingConfig.currencyCode, currencySymbol: data?.currencySymbol || pricingConfig.currencySymbol, taxRate: data?.taxRate ?? pricingConfig.taxRate, shippingFee: data?.shippingFee ?? pricingConfig.shippingFee, freeShippingThreshold: data?.freeShippingThreshold ?? pricingConfig.freeShippingThreshold, isFreeShipping: Boolean(data?.isFreeShipping) });
    } catch (e) {
      console.error('Failed to clear cart', e);
      setCartError(e?.message || 'Failed to clear cart');
    }
  };

  // ---------------------------
  // Derived data
  // ---------------------------

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of allProducts) {
      if (p.category) set.add(p.category);
    }
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [{ value: 'all', label: 'All Categories' }, ...list.map((c) => ({ value: c, label: c }))];
  }, [allProducts]);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  };

  return {
    // Products
    medications: allProducts,
    allProducts,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    isLoading,
    categories,

    // Cart
    cart,
    cartSummary,
    pricingConfig,
    cartLoading,
    cartError,
    cartNotice,
    loadCart,
    addToCart,
    updateQuantity,
    clearCart,

    // Utils
    getTotalPrice,
    getTotalItems,
  };
};
