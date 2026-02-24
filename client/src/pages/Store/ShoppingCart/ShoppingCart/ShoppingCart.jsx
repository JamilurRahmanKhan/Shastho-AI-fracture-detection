/**
 * Frontend page: ShoppingCart
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Sparkles, ArrowLeft, Save } from 'lucide-react';
import CartItem from '../CartItem/CartItem';
import OrderSummary from '../OrderSummary/OrderSummary';

// =============================================================================
// SHOPPING CART COMPONENT
// =============================================================================

/**
 * ShoppingCart Component
 * 
 * A comprehensive shopping cart interface that displays cart items, manages quantities,
 * and provides order summary with responsive design for all screen sizes.
 * 
 * 🛒 KEY FEATURES:
 * - Empty cart state with clear call-to-action
 * - Dynamic cart items list with quantity controls
 * - Order summary with pricing breakdown
 * - Responsive grid layout (stacked on mobile, side-by-side on desktop)
 * - Multiple navigation options to continue shopping
 * - Visual feedback for all interactive elements
 * 
 * 📱 RESPONSIVE BEHAVIOR:
 * - Mobile: Single column, full-width components
 * - Tablet: Stacked layout with optimized spacing
 * - Desktop: 2/3 - 1/3 split (items on left, summary on right)
 * 
 * 🎨 DESIGN PRINCIPLES:
 * - High contrast text for readability
 * - Consistent color scheme throughout
 * - Clear visual hierarchy
 * - Accessible color combinations
 * - Smooth transitions and hover effects
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {Array} props.cart - Array of cart item objects containing product details
 * @param {Function} props.onUpdateQuantity - Callback function to update item quantity (receives itemId and newQuantity)
 * @param {number} props.totalPrice - Calculated total price of all items in cart
 * @param {number} props.totalItems - Total number of items across all products in cart
 * @param {Function} props.onContinueShopping - Callback function to navigate back to product browsing
 * 
 * @returns {JSX.Element} Fully rendered shopping cart interface
 * 
 * @example
 * <ShoppingCart
 *   cart={cartItems}
 *   onUpdateQuantity={handleQuantityUpdate}
 *   totalPrice={129.99}
 *   totalItems={5}
 *   onContinueShopping={handleContinueShopping}
 * />
 */
const ShoppingCart = ({ 
  cart, 
  onUpdateQuantity, 
  totalPrice, 
  totalItems,
  onContinueShopping 
}) => {
  // ===========================================================================
  // RENDER FUNCTIONS
  // ===========================================================================

  /**
   * Renders the empty cart state with encouraging messaging and clear call-to-action
   * Used when the cart array is empty to guide users back to shopping
   * 
   * @returns {JSX.Element} Empty cart state component
   */
  const renderEmptyCart = () => (
    <div className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 text-center">
      {/* Empty Cart Icon - Large, centered with subtle color */}
      <ShoppingCart className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-slate-500 mx-auto mb-4 sm:mb-6 lg:mb-8" />
      
      {/* Empty State Heading - Clear, prominent text */}
      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 lg:mb-6">
        Your cart is empty
      </h3>
      
      {/* Descriptive Text - Explains what to do next */}
      <p className="text-slate-700 mb-6 sm:mb-8 lg:mb-10 text-lg sm:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed">
        Add some medications to get started with your healthcare needs
      </p>
      
      {/* Primary Action Button - Clear call-to-action with visual emphasis */}
      <button
        onClick={onContinueShopping}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center mx-auto text-base sm:text-lg lg:text-xl min-w-[200px]"
        aria-label="Browse healthcare products to add to your cart"
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-3 flex-shrink-0" />
        Browse Products
      </button>
    </div>
  );

  /**
   * Renders the cart header with item count and navigation options
   * Provides context and quick access to continue shopping
   * 
   * @returns {JSX.Element} Cart header component
   */
  const renderCartHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
      {/* Cart Title with Item Count */}
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
        Shopping Cart 
        <span className="text-slate-600 font-semibold ml-2">
          ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </span>
      </h2>
      
      {/* Quick Navigation Back to Shopping */}
      <button
        onClick={onContinueShopping}
        className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-base sm:text-lg transition-colors duration-200 group self-start sm:self-auto"
        aria-label="Continue shopping for more products"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
        Continue Shopping
      </button>
    </div>
  );

  /**
   * Renders the cart items list with individual item components
   * Maps through cart array and creates CartItem components for each product
   * 
   * @returns {JSX.Element} Cart items list component
   */
  const renderCartItems = () => (
    <div className="space-y-4 sm:space-y-6">
      {cart.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
        />
      ))}
    </div>
  );

  /**
   * Renders the cart action buttons at the bottom of items list
   * Provides multiple navigation and utility options for users
   * 
   * @returns {JSX.Element} Cart actions component
   */
  const renderCartActions = () => (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-slate-200">
      {/* Continue Shopping Button - Secondary action */}
      <button
        onClick={onContinueShopping}
        className="flex-1 border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 hover:text-slate-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:bg-slate-50 text-center flex items-center justify-center"
        aria-label="Continue browsing products"
      >
        Continue Shopping
      </button>
      
      {/* Save for Later Button - Utility action */}
      <button 
        className="flex-1 border-2 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-center flex items-center justify-center"
        aria-label="Save current cart items for later"
      >
        <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Save for Later
      </button>
    </div>
  );

  /**
   * Renders the full cart interface when items are present
   * Combines header, items list, actions, and order summary in responsive layout
   * 
   * @returns {JSX.Element} Full cart interface component
   */
  const renderCartWithItems = () => (
    <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
      {/* Main Cart Content - Left side on desktop, full width on mobile */}
      <div className="lg:col-span-2 space-y-6 sm:space-y-8">
        {/* Cart Header */}
        {renderCartHeader()}
        
        {/* Cart Items List */}
        {renderCartItems()}
        
        {/* Cart Actions */}
        {renderCartActions()}
      </div>

      {/* Order Summary Sidebar - Right side on desktop, full width on mobile */}
      <div className="lg:col-span-1">
        <OrderSummary
          totalPrice={totalPrice}
          totalItems={totalItems}
        />
      </div>
    </div>
  );

  // ===========================================================================
  // MAIN COMPONENT RENDER
  // ===========================================================================

  return (
    /**
     * Main container with responsive spacing
     * Uses consistent vertical spacing that scales with screen size
     * Ensures proper padding and margin throughout the component
     */
    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
      {/**
       * Conditional rendering based on cart content
       * Shows empty state when cart is empty, full cart interface when items exist
       * Provides appropriate user experience for both states
       */}
      {cart.length === 0 ? renderEmptyCart() : renderCartWithItems()}
    </div>
  );
};

export default ShoppingCart;