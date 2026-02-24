/**
 * Frontend page: ProductGrid
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Search } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';

/**
 * ProductGrid Component
 * 
 * Displays the main product grid with search results and filtering
 * 
 * Features:
 * - Grid layout for products
 * - Empty state handling
 * - Responsive design
 * - Integration with search and filters
 * 
 * @param {Object} props - Component props
 * @param {Array} props.medications - Filtered medications to display
 * @param {Function} props.onAddToCart - Add to cart handler
 * @param {string} props.searchTerm - Current search term for empty state
 * @param {Function} props.onClearFilters - Clear filters handler
 * 
 * @returns {JSX.Element} Product grid component
 */
const ProductGrid = ({ 
  medications, 
  onAddToCart, 
  searchTerm,
  onClearFilters 
}) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {medications.map((medication) => (
          <ProductCard
            key={medication.id}
            medication={medication}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {/* Empty State */}
      {medications.length === 0 && (
        <div className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 text-center">
          <Search className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4 sm:mb-6" />
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
            {searchTerm ? 'No products found' : 'No products available'}
          </h3>
          <p className="text-slate-600 text-base sm:text-lg mb-6 sm:mb-8">
            {searchTerm 
              ? 'Try adjusting your search or filter criteria'
              : 'Check back later for new medications and supplements'
            }
          </p>
          {searchTerm && (
            <button
              onClick={onClearFilters}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center mx-auto"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Clear Search & Filters
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      {medications.length > 0 && (
        <div className="text-center">
          <p className="text-slate-600 text-sm sm:text-base">
            Showing {medications.length} product{medications.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;