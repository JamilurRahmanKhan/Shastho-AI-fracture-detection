/**
 * Frontend page: ProductCard
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star, Sparkles, ArrowRight } from 'lucide-react';

/**
 * ProductCard Component
 * 
 * Individual product card for displaying medication information
 * 
 * Features:
 * - Product image with badges
 * - Pricing information
 * - Rating display
 * - Add to cart functionality
 * - Click to view product details
 * - Hover animations
 * - Responsive design
 * 
 * @param {Object} props - Component props
 * @param {Object} props.medication - Medication data
 * @param {Function} props.onAddToCart - Add to cart handler
 * 
 * @returns {JSX.Element} Product card component
 */
const ProductCard = ({ medication, onAddToCart, currencySymbol: currencySymbolProp }) => {
  const navigate = useNavigate();

  const currencyCode = String(medication?.currency || '').toUpperCase();
  const currencySymbol =
    currencySymbolProp ||
    medication?.currencySymbol ||
    (currencyCode === 'USD' ? '$' : '৳');

  const formatMoney = (n) => {
    const v = Number(n || 0);
    const maxFractionDigits = currencyCode === 'BDT' ? 0 : 2;
    try {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxFractionDigits }).format(v);
    } catch {
      return v.toFixed(maxFractionDigits);
    }
  };

  /**
   * Handle product card click to navigate to product detail page
   */
  const handleProductClick = () => {
    navigate(`/store/product/${medication.id}`);
  };

  /**
   * Handle add to cart with event propagation stop
   */
  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent navigating to product detail
    onAddToCart(medication);
  };

  return (
    <div 
      className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group rounded-2xl overflow-hidden cursor-pointer"
      onClick={handleProductClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleProductClick();
        }
      }}
      aria-label={`View details for ${medication.name}`}
    >
      {/* Product Image */}
      <div className="aspect-square bg-gradient-to-br from-slate-100 to-blue-50/30 relative overflow-hidden">
        {medication.imageUrl ? (
          <img
            src={medication.imageUrl}
            alt={medication.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <div className="text-slate-400 text-sm">Product Image</div>
          </div>
        )}
        
        {/* Discount Badge */}
        {medication.originalPrice && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold py-1 px-2 rounded-full shadow-lg">
            Save {currencySymbol}{formatMoney(medication.originalPrice - medication.price)}
          </span>
        )}
        
        {/* Prescription Badge */}
        {medication.prescription && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200 text-xs font-bold py-1 px-2 rounded-full">
            Rx Required
          </span>
        )}

        {/* View Details Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <ArrowRight className="w-5 h-5 text-slate-700" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Product Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-slate-900 line-clamp-2 text-base sm:text-lg leading-tight flex-1 mr-2 group-hover:text-blue-600 transition-colors">
            {medication.name}
          </h3>
          <div className="text-right flex-shrink-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {currencySymbol}{formatMoney(medication.price)}
            </div>
            {medication.originalPrice && (
              <div className="text-xs sm:text-sm text-slate-500 line-through">{currencySymbol}{formatMoney(medication.originalPrice)}</div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-600 mb-3 sm:mb-4 line-clamp-2 leading-relaxed text-sm sm:text-base">
          {medication.description}
        </p>

        {/* Rating and Dosage */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-sm sm:text-base">{medication.rating}</span>
            <span className="text-slate-500 text-xs sm:text-sm">({medication.reviews})</span>
          </div>
          <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-medium py-1 px-2 rounded-full">
            {medication.dosage}
          </span>
        </div>

        {/* Manufacturer */}
        <div className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4 font-medium">
          By {medication.manufacturer}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!medication.inStock}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl h-10 sm:h-12 text-sm sm:text-base text-white font-semibold flex items-center justify-center disabled:cursor-not-allowed"
        >
          {medication.inStock ? (
            <>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add to Cart
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
            </>
          ) : (
            "Out of Stock"
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;