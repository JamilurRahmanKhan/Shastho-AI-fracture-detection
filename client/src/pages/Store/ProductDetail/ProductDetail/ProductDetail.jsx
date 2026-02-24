/**
 * Frontend page: ProductDetail
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// =============================================================================
// COMPONENT IMPORTS
// =============================================================================
import StoreHeader from '../../StoreHeader/StoreHeader';
import LoadingSpinner from '../../../Dashboard/LoadingSpinner/LoadingSpinner';
import ProductImageGallery from '../ProductImageGallery/ProductImageGallery';
import ProductInfo from '../ProductInfo/ProductInfo';
import ProductDescription from '../ProductDescription/ProductDescription';
import ProductReviews from '../ProductReviews/ProductReviews';
import RelatedProducts from '../RelatedProducts/RelatedProducts';
import { useStore } from '../../hooks/useStore';
import { api } from '@/services/api';

// =============================================================================
// MAIN PRODUCT DETAIL PAGE COMPONENT
// =============================================================================

/**
 * ProductDetailPage Component
 * 
 * Comprehensive product detail page showing complete medication information,
 * images, pricing, and purchase options. Uses data from useStore hook.
 */
const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { medications, addToCart, cart, pricingConfig } = useStore();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setProductLoading(true);
        setProductError('');
        const p = await api.getStoreProduct(productId);
        if (cancelled) return;
        setProduct(p);
      } catch (e) {
        if (cancelled) return;
        setProduct(null);
        setProductError(e?.message || 'Failed to load product');
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Navigate back to store
   */
  const handleBackClick = () => {
    navigate('/store');
  };

  /**
   * Handle quantity change for product
   */
  const handleQuantityChange = (newQuantity) => {
    setSelectedQuantity(Math.max(1, newQuantity));
  };

  /**
   * Handle adding product to cart
   */
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, selectedQuantity);
      // Show success message or notification
      console.log(`Added ${selectedQuantity} of ${product.name} to cart`);
    }
  };

  /**
   * Buy now = add to cart then jump to cart view and open checkout.
   */
  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, selectedQuantity);
    navigate('/store?tab=cart&checkout=1');
  };

  // Get related products (same category, excluding current product)
  const relatedProducts = medications
    .filter(med => med.category === product?.category && med.id !== product?.id)
    .slice(0, 3);

  // ===========================================================================
  // LOADING AND ERROR STATES
  // ===========================================================================

  const cartItemsCount = cart.reduce((s, it) => s + (it.quantity || 0), 0);

  if (productLoading) {
    return (
      <div className="min-h-screen bg-[#FCFDFF]">
        <StoreHeader cartItemsCount={cartItemsCount} />
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FCFDFF]">
        <StoreHeader cartItemsCount={cartItemsCount} />
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Product Not Found
            </h1>
            <p className="text-slate-600 mb-8">
              {productError || "The product you're looking for doesn't exist or has been removed."}
            </p>
            <button
              onClick={handleBackClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Return to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MAIN COMPONENT RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-[#FCFDFF]">
      {/* Store Header */}
      <StoreHeader cartItemsCount={cart.reduce((s, it) => s + (it.quantity || 0), 0)} />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Back Navigation */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={handleBackClick}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Store
          </button>
        </div>

        {/* Product Detail Grid */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
          
          {/* Product Images */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductImageGallery product={product} />
          </div>

          {/* Product Information */}
          <div className="space-y-6 sm:space-y-8">
            <ProductInfo 
              product={product}
              currencySymbol={pricingConfig?.currencySymbol || '৳'}
              selectedQuantity={selectedQuantity}
              onQuantityChange={handleQuantityChange}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          </div>
        </div>

        {/* Additional Product Sections */}
        <div className="space-y-12 sm:space-y-16">
          
          {/* Product Description & Details */}
          <ProductDescription product={product} />
          
          {/* Customer Reviews */}
          <ProductReviews product={product} />
          
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <RelatedProducts 
              products={relatedProducts}
              currentProductId={product.id}
              currencySymbol={pricingConfig?.currencySymbol || '৳'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;