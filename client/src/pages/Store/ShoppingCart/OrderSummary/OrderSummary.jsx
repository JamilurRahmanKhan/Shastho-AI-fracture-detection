/**
 * Frontend page: OrderSummary
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Crown, Zap, Shield, Truck, Receipt } from 'lucide-react';

// =============================================================================
// ORDER SUMMARY COMPONENT
// =============================================================================

/**
 * OrderSummary Component
 * 
 * A comprehensive order summary component that displays pricing breakdown,
 * calculates costs, and provides a secure checkout interface. Features
 * dynamic shipping calculations, tax computation, and promotional messaging.
 * 
 * 💰 KEY FEATURES:
 * - Real-time pricing breakdown (subtotal, shipping, tax, total)
 * - Dynamic free shipping threshold with visual feedback
 * - Secure checkout with SSL encryption assurance
 * - Sticky positioning on desktop for constant access
 * - Responsive design optimized for all screen sizes
 * - Accessibility-compliant pricing information
 * 
 * 📊 PRICING CALCULATIONS:
 * - Subtotal: Sum of all item prices × quantities
 * - Shipping: Free above $50, otherwise $5.99 flat rate
 * - Tax: 8% of subtotal (configurable rate)
 * - Final Total: Subtotal + Shipping + Tax
 * 
 * 📱 RESPONSIVE BEHAVIOR:
 * - Mobile: Compact layout with optimized spacing
 * - Tablet: Balanced typography and button sizing
 * - Desktop: Sticky positioning with comfortable spacing
 * 
 * 🎨 DESIGN PRINCIPLES:
 * - High contrast text for maximum readability
 * - Clear visual hierarchy for pricing information
 * - Intuitive color coding for discounts and totals
 * - Professional healthcare-appropriate styling
 * - Consistent spacing and alignment throughout
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {number} props.totalPrice - Calculated subtotal of all cart items before fees
 * @param {number} props.totalItems - Total quantity of items across all products in cart
 * 
 * @returns {JSX.Element} Fully rendered order summary component
 * 
 * @example
 * <OrderSummary
 *   totalPrice={89.97}
 *   totalItems={3}
 * />
 */
const OrderSummary = ({ totalPrice, totalItems, onProceedToCheckout, isCheckoutDisabled = false, pricingConfig, cartSummary }) => {
  // ===========================================================================
  // PRICING CALCULATIONS
  // ===========================================================================

  const currencySymbol = cartSummary?.currencySymbol || pricingConfig?.currencySymbol || '৳';
  const freeShippingThreshold = Number(cartSummary?.freeShippingThreshold ?? pricingConfig?.freeShippingThreshold ?? 50);
  const shippingFee = Number(cartSummary?.shippingFee ?? pricingConfig?.shippingFee ?? 5.99);
  const taxRate = Number(cartSummary?.taxRate ?? pricingConfig?.taxRate ?? 0.08);

  /**
   * Shipping cost calculation
   * Free shipping applied for orders at/above threshold
   * Flat rate shipping for orders below threshold
   * 
   * @constant {number} shippingCost - Calculated shipping cost (0 for free shipping)
   */
  const shippingCost = typeof cartSummary?.shipping === 'number' ? cartSummary.shipping : (totalPrice >= freeShippingThreshold ? 0 : shippingFee);

  /**
   * Tax calculation based on subtotal
   * Using 8% tax rate (configurable for different regions)
   * 
   * @constant {number} tax - Calculated tax amount (8% of subtotal)
   */
  const tax = typeof cartSummary?.tax === 'number' ? cartSummary.tax : (totalPrice * taxRate);

  /**
   * Final total including all fees
   * Sum of subtotal, shipping, and tax
   * 
   * @constant {number} finalTotal - Complete order total
   */
  const finalTotal = typeof cartSummary?.total === 'number' ? cartSummary.total : (totalPrice + shippingCost + tax);

  /**
   * Determines if free shipping is applied
   * Used for conditional rendering and messaging
   * 
   * @constant {boolean} hasFreeShipping - Whether order qualifies for free shipping
   */
  const hasFreeShipping = typeof cartSummary?.isFreeShipping === 'boolean' ? cartSummary.isFreeShipping : (totalPrice >= freeShippingThreshold);

  /**
   * Calculates remaining amount needed for free shipping
   * Provides helpful messaging for users near threshold
   * 
   * @constant {number} freeShippingRemaining - Amount needed to reach free shipping
   */
  const freeShippingRemaining = freeShippingThreshold - totalPrice;

  // ===========================================================================
  // RENDER FUNCTIONS
  // ===========================================================================

  /**
   * Renders the component header with crown icon and title
   * Establishes visual hierarchy and component purpose
   * 
   * @returns {JSX.Element} Order summary header
   */
  const renderHeader = () => (
    <div className="flex items-center mb-6 pb-4 border-b border-slate-200">
      <Crown className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-yellow-600 flex-shrink-0" />
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
        Order Summary
      </h2>
    </div>
  );

  /**
   * Renders the pricing breakdown section
   * Displays subtotal, shipping, and tax in clear format
   * 
   * @returns {JSX.Element} Pricing breakdown section
   */
  const renderPricingBreakdown = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* Subtotal Row */}
      <div className="flex justify-between items-center">
        <span className="text-slate-700 text-base sm:text-lg font-medium">
          Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </span>
        <span className="font-semibold text-slate-900 text-base sm:text-lg">
          {currencySymbol}{totalPrice.toFixed(2)}
        </span>
      </div>

      {/* Shipping Row with Conditional Free Shipping Message */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
          <span className="text-slate-700 text-base sm:text-lg font-medium">
            Shipping
          </span>
        </div>
        <span className="font-semibold text-base sm:text-lg">
          {hasFreeShipping ? (
            <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-sm font-bold">
              FREE
            </span>
          ) : (
            <span className="text-slate-900">{currencySymbol}{shippingCost.toFixed(2)}</span>
          )}
        </span>
      </div>

      {/* Tax Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
          <span className="text-slate-700 text-base sm:text-lg font-medium">
            Tax (8%)
          </span>
        </div>
        <span className="font-semibold text-slate-900 text-base sm:text-lg">
          {currencySymbol}{tax.toFixed(2)}
        </span>
      </div>
    </div>
  );

  /**
   * Renders the free shipping progress message
   * Encourages users to add more items to qualify for free shipping
   * Only shows when user is close to free shipping threshold
   * 
   * @returns {JSX.Element|null} Free shipping encouragement message
   */
  const renderFreeShippingMessage = () => {
    if (hasFreeShipping || freeShippingRemaining > 20) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
        <p className="text-blue-800 text-sm sm:text-base font-medium">
          {freeShippingRemaining > 0 ? (
            <>Add <span className="font-bold">${freeShippingRemaining.toFixed(2)}</span> more for free shipping!</>
          ) : (
            <>You've qualified for <span className="font-bold text-emerald-600">FREE shipping</span>!</>
          )}
        </p>
      </div>
    );
  };

  /**
   * Renders the final total section with prominent display
   * Uses gradient text for visual emphasis on the total amount
   * 
   * @returns {JSX.Element} Final total display section
   */
  const renderFinalTotal = () => (
    <div className="border-t border-slate-200 pt-4 sm:pt-5">
      <div className="flex justify-between items-center font-bold">
        <span className="text-slate-900 text-lg sm:text-xl lg:text-2xl">
          Total
        </span>
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-2xl">
          {currencySymbol}{finalTotal.toFixed(2)}
        </span>
      </div>
      <p className="text-slate-600 text-xs sm:text-sm mt-2 text-center">
        Including all taxes and fees
      </p>
    </div>
  );

  /**
   * Renders the primary checkout call-to-action
   * Large, prominent button with secure transaction messaging
   * 
   * @returns {JSX.Element} Checkout button and security notice
   */
  const renderCheckoutSection = () => (
    <div className="space-y-3 sm:space-y-4">
      {/* Free Shipping Message (if applicable) */}
      {renderFreeShippingMessage()}

      {/* Checkout Button */}
      <button
        onClick={onProceedToCheckout}
        disabled={isCheckoutDisabled}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 h-12 sm:h-14 text-base sm:text-lg font-semibold text-white rounded-xl flex items-center justify-center group disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed"
        aria-label={`Proceed to secure checkout. Total amount: ${currencySymbol}${finalTotal.toFixed(2)}`}
      >
        <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 transition-transform duration-200 group-hover:scale-110" />
        Proceed to Checkout (COD)
      </button>

      {/* Security Assurance */}
      <p className="text-slate-600 text-xs sm:text-sm text-center flex items-center justify-center">
        <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-emerald-500 flex-shrink-0" />
        Secure checkout with SSL encryption
      </p>
    </div>
  );

  // ===========================================================================
  // MAIN COMPONENT RENDER
  // ===========================================================================

  return (
    /**
     * Main order summary container
     * Sticky positioning on desktop for constant access during scroll
     * Background with slight transparency for modern aesthetic
     * Responsive padding and shadow for depth
     */
    <div 
      className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6 lg:p-7 sticky top-6 lg:top-8"
      role="complementary"
      aria-label="Order summary with pricing breakdown and checkout options"
    >
      {/* Component Header */}
      {renderHeader()}
      
      {/**
       * Main content container with consistent vertical spacing
       * Organized flow from pricing details to checkout action
       */}
      <div className="space-y-5 sm:space-y-6 lg:space-y-7">
        {/* Pricing Breakdown Section */}
        {renderPricingBreakdown()}
        
        {/* Final Total Display */}
        {renderFinalTotal()}
        
        {/* Checkout Action Section */}
        {renderCheckoutSection()}
      </div>
    </div>
  );
};

export default OrderSummary;