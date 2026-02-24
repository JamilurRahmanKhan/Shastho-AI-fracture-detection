/**
 * Frontend page: RelatedProducts
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Package } from 'lucide-react';
import { useStore } from '../../hooks/useStore';

/**
 * RelatedProducts Component
 * 
 * Displays related products using data from useStore
 */
const RelatedProducts = ({ products, currentProductId, currencySymbol = '৳' }) => {
  const { addToCart } = useStore();

  /**
   * Handle add to cart for related products
   */
  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
        Related Products
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/store/product/${product.id}`}
            className="group border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-lg"
          >
            {/* Product Image */}
            <div className="bg-slate-100 rounded-xl mb-4 overflow-hidden">
              <div className="w-full h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <div className="text-slate-400 text-sm">Product Image</div>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                {product.name}
              </h3>
              <p className="text-slate-600 text-sm">{product.dosage}</p>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-semibold text-slate-900">{product.rating}</span>
                </div>
                <span className="text-slate-500 text-sm">({product.reviews})</span>
              </div>

              {/* Pricing */}
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-slate-900">
                  {currencySymbol}{Number(product.price || 0).toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-slate-500 text-sm line-through">
                    {currencySymbol}{Number(product.originalPrice || 0).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={(e) => handleAddToCart(e, product)}
                className="w-full bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 group-hover:scale-105"
              >
                <Package className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;