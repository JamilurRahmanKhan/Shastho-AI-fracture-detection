/**
 * Frontend page: CartItem
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { resolveApiUrl } from "@/lib/resolveApiUrl";

// =============================================================================
// CART ITEM COMPONENT
// =============================================================================

/**
 * CartItem Component
 *
 * Displays an individual product in the shopping cart with full product details,
 * quantity controls, and price calculations. Provides intuitive controls for
 * managing item quantities with visual feedback.
 *
 * 🛒 KEY FEATURES:
 * - Product information display (name, dosage, price)
 * - Interactive quantity controls with increment/decrement buttons
 * - Real-time price calculation (unit price × quantity)
 * - Visual feedback for all interactive elements
 * - Responsive design for all screen sizes
 * - Accessibility-compliant controls
 *
 * 📱 RESPONSIVE BEHAVIOR:
 * - Mobile: Compact layout with smaller touch targets
 * - Tablet: Balanced spacing and typography
 * - Desktop: Comfortable spacing with larger interactive elements
 *
 * 🎨 DESIGN PRINCIPLES:
 * - High contrast text for optimal readability
 * - Clear visual hierarchy for product information
 * - Intuitive color coding for actions (green/red)
 * - Consistent spacing and alignment
 * - Smooth transitions for interactive elements
 *
 * @component
 * @param {Object} props - Component properties
 * @param {Object} props.item - Cart item object containing product details
 * @param {string} props.item.id - Unique identifier for the product
 * @param {string} props.item.name - Product name/title
 * @param {string} props.item.dosage - Product dosage or strength information
 * @param {number} props.item.price - Unit price of the product
 * @param {number} props.item.quantity - Current quantity in cart
 * @param {Function} props.onUpdateQuantity - Callback function to update item quantity
 * @param {string} props.onUpdateQuantity.itemId - ID of the item to update
 * @param {number} props.onUpdateQuantity.delta - Change in quantity (+1 or -1)
 *
 * @returns {JSX.Element} Fully rendered cart item component
 *
 * @example
 * <CartItem
 *   item={{
 *     id: "med-123",
 *     name: "Aspirin",
 *     dosage: "500mg Tablets",
 *     price: 12.99,
 *     quantity: 2
 *   }}
 *   onUpdateQuantity={(itemId, delta) => updateCart(itemId, delta)}
 * />
 */
const CartItem = ({ item, onUpdateQuantity }) => {
  // ===========================================================================
  // CALCULATED VALUES
  // ===========================================================================

  /**
   * Calculates the total price for this cart item
   * Multiplies unit price by current quantity
   *
   * @constant {number} totalPrice - Total price for this item (price × quantity)
   */
  const totalPrice = item.price * item.quantity;

  /**
   * Determines if the decrease quantity button should be disabled
   * Prevents quantity from going below 1 (minimum purchase quantity)
   *
   * @constant {boolean} isDecreaseDisabled - Whether decrease button is disabled
   */
  const isDecreaseDisabled = item.quantity <= 1;

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Handles increasing the item quantity by 1
   * Calls the parent component's update function with positive delta
   *
   * @handler
   * @usage Called when user clicks the plus button
   */
  const handleIncrease = () => {
    onUpdateQuantity(item.id, 1);
  };

  /**
   * Handles decreasing the item quantity by 1
   * Only executes if current quantity is greater than 1
   * Calls the parent component's update function with negative delta
   *
   * @handler
   * @usage Called when user clicks the minus button
   */
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, -1);
    }
  };

  /**
   * Handles removing the item completely from cart
   * Sets quantity to zero by decreasing until removal
   *
   * @handler
   * @usage Called when user clicks the remove/trash button
   */
  const handleRemove = () => {
    onUpdateQuantity(item.id, -item.quantity);
  };

  // ===========================================================================
  // RENDER FUNCTIONS
  // ===========================================================================

  /**
   * Renders the product image section with placeholder
   * In a real application, this would display actual product images
   *
   * @returns {JSX.Element} Product image container
   */
  const renderProductImage = () => (
    <div
      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border-2 border-blue-100 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm"
      aria-label="Product image"
    >
      {resolveApiUrl(item.imageUrl) ? (
        <img
          src={resolveApiUrl(item.imageUrl)}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="text-blue-600 text-xs font-medium text-center px-1">Medicine</div>
      )}
    </div>
  );

  /**
   * Renders the product details section
   * Displays name, dosage, and unit price in clear typography
   *
   * @returns {JSX.Element} Product details container
   */
  const renderProductDetails = () => (
    <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
      {/* Product Name - Primary information */}
      <h3 className="font-bold text-slate-900 text-base sm:text-lg lg:text-xl line-clamp-2 leading-tight">
        {item.name}
      </h3>

      {/* Product Dosage - Secondary information */}
      <p className="text-slate-700 text-sm sm:text-base lg:text-lg font-medium">
        {item.dosage}
      </p>

      {/* Unit Price - Tertiary information */}
      {item.priceChanged ? (
        <div className="text-sm sm:text-base">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-slate-400 line-through font-semibold">
              ${(Number(item.priceSnapshot ?? item.price) || 0).toFixed(2)}
            </span>
            <span className="text-amber-700 font-bold">
              ${item.price.toFixed(2)} each
            </span>
          </div>
          <div className="text-amber-700 text-xs sm:text-sm font-semibold">
            Price updated — please review before checkout
          </div>
        </div>
      ) : (
        <p className="text-slate-600 text-sm sm:text-base font-semibold">
          ৳{item.price.toFixed(2)} each
        </p>
      )}
    </div>
  );

  /**
   * Renders the quantity control section
   * Provides increment/decrement buttons with visual feedback
   *
   * @returns {JSX.Element} Quantity controls container
   */
  const renderQuantityControls = () => (
    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
      {/* Decrease Quantity Button */}
      <button
        onClick={handleDecrease}
        disabled={isDecreaseDisabled}
        className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isDecreaseDisabled
            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
            : "border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:bg-red-100 active:scale-95"
        }`}
        aria-label={`Decrease quantity of ${item.name}. Current quantity: ${item.quantity}`}
      >
        <Minus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
      </button>

      {/* Quantity Display */}
      <span
        className="w-8 sm:w-10 lg:w-12 text-center font-bold text-slate-900 text-base sm:text-lg lg:text-xl"
        aria-live="polite"
        aria-atomic="true"
      >
        {item.quantity}
      </span>

      {/* Increase Quantity Button */}
      <button
        onClick={handleIncrease}
        className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-emerald-200 bg-white text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 active:scale-95 transition-all duration-200 flex items-center justify-center"
        aria-label={`Increase quantity of ${item.name}. Current quantity: ${item.quantity}`}
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
      </button>
    </div>
  );

  /**
   * Renders the price and remove section
   * Displays total price and provides remove item functionality
   *
   * @returns {JSX.Element} Price and actions container
   */
  const renderPriceAndActions = () => (
    <div className="flex flex-col items-end space-y-3 sm:space-y-4 flex-shrink-0">
      {/* Total Price Display */}
      <p className="font-bold text-slate-900 text-lg sm:text-xl lg:text-2xl">
        ৳{totalPrice.toFixed(2)}
      </p>

      {/* Remove Item Button */}
      <button
        onClick={handleRemove}
        className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base flex items-center space-x-1 transition-colors duration-200 group"
        aria-label={`Remove ${item.name} from cart`}
      >
        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 transition-transform duration-200 group-hover:scale-110" />
        <span>Remove</span>
      </button>
    </div>
  );

  // ===========================================================================
  // MAIN COMPONENT RENDER
  // ===========================================================================

  return (
    /**
     * Main cart item container
     * Uses card-like design with shadow and rounded corners
     * Background with slight transparency for modern look
     * Responsive padding that scales with screen size
     */
    <div
      className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 transition-all duration-300 hover:shadow-xl"
      role="listitem"
      aria-label={`Cart item: ${item.name}, Quantity: ${
        item.quantity
      }, Total: ৳${totalPrice.toFixed(2)}`}
    >
      {/**
       * Flex container for all item content
       * Responsive spacing between elements
       * Aligns all content properly across different screen sizes
       */}
      <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
        {/* Product Image Section */}
        {renderProductImage()}

        {/* Product Details Section */}
        {renderProductDetails()}

        {/* Quantity Controls Section */}
        {renderQuantityControls()}

        {/* Price and Actions Section */}
        {renderPriceAndActions()}
      </div>
    </div>
  );
};

export default CartItem;
