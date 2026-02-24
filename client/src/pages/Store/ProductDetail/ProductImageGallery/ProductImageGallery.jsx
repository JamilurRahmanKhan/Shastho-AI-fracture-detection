/**
 * Frontend page: ProductImageGallery
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';

/**
 * ProductImageGallery Component
 * 
 * Interactive image gallery with thumbnail navigation
 * Uses product data from useStore
 */
const ProductImageGallery = ({ product }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Use product image or placeholder
  const images = product?.imageUrl
    ? [product.imageUrl]
    : ['https://images.unsplash.com/photo-1585435557343-3b092031d5ad?w=500'];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Image */}
      <div 
        className="relative bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden cursor-zoom-in"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <img
          src={images[selectedImageIndex]}
          alt={product.name}
          className={`w-full h-64 sm:h-80 lg:h-96 object-cover transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <ZoomIn className="w-4 h-4 text-slate-700" />
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                selectedImageIndex === index
                  ? 'border-blue-500 shadow-md scale-105'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img
                src={image}
                alt={`${product.name} view ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;