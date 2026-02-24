/**
 * Frontend page: ProductInfo
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Star, Truck, Shield, Package, CheckCircle } from 'lucide-react';

/**
 * ProductInfo Component
 * 
 * Displays core product information, pricing, and purchase controls
 * Uses product data from useStore
 */
const ProductInfo = ({ product, currencySymbol = '৳', selectedQuantity, onQuantityChange, onAddToCart, onBuyNow }) => {
  const isOnSale = !!(product.originalPrice && product.originalPrice > product.price);

  // Prefer pharmacy-provided keyBenefits from DB, otherwise fall back to a small derived list.
  const features = Array.isArray(product.keyBenefits) && product.keyBenefits.length
    ? product.keyBenefits
    : [
        product.dosage ? `${product.dosage} formulation` : 'Quality formulation',
        product.category ? `${product.category} support` : 'Doctor recommended',
        product.requiresPrescription ? 'Prescription controlled' : 'Trusted brand',
      ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Product Header */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            {product.manufacturer}
          </span>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded-full">
            {product.category}
          </span>
          {(product.requiresPrescription || product.prescription) && (
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full">
              Rx Required
            </span>
          )}
        </div>
        
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
          {product.name}
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < Math.floor(product.rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-slate-300'
              }`}
            />
          ))}
          <span className="text-slate-900 font-semibold ml-1">{product.rating}</span>
        </div>
        <span className="text-slate-600">({product.reviews} reviews)</span>
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <span className="text-3xl sm:text-4xl font-bold text-slate-900">
            {currencySymbol}{Number(product.price || 0).toFixed(2)}
          </span>
          {isOnSale && (
            <span className="text-xl text-slate-500 line-through">
              {currencySymbol}{Number(product.originalPrice || 0).toFixed(2)}
            </span>
          )}
        </div>
        {isOnSale && (
          <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
            Save {currencySymbol}{(Number(product.originalPrice || 0) - Number(product.price || 0)).toFixed(2)}
          </span>
        )}
      </div>

      {/* Product Features */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 text-lg">Key Benefits:</h3>
        <div className="grid gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-slate-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quantity and Add to Cart */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-900">Quantity:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onQuantityChange(selectedQuantity - 1)}
                className="w-8 h-8 rounded-full border border-slate-300 hover:border-red-300 hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-bold text-slate-900">
                {selectedQuantity}
              </span>
              <button
                onClick={() => onQuantityChange(selectedQuantity + 1)}
                className="w-8 h-8 rounded-full border border-slate-300 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>
          
          <div className={`text-sm font-medium px-3 py-1 rounded-full ${
            product.inStock 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onAddToCart}
            disabled={!product.inStock}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 shadow-lg hover:shadow-xl text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 disabled:translate-y-0 flex items-center justify-center text-lg"
          >
            <Package className="w-5 h-5 mr-3" />
            Add to Cart
          </button>
          
          <button
            onClick={onBuyNow}
            className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-4 px-8 rounded-xl transition-colors text-lg"
            disabled={!product.inStock}
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
        <div className="flex items-center space-x-3 text-slate-700">
          <Truck className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">Free Shipping Over $50</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-700">
          <Shield className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium">Secure Payment</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-700">
          <Package className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium">Easy Returns</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;