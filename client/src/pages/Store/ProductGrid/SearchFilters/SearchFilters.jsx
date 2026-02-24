/**
 * Frontend page: SearchFilters
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

/**
 * SearchFilters Component
 * 
 * Enhanced search and filter controls for product browsing with improved visibility
 * and user experience. Features a clean, accessible design with proper contrast
 * and responsive layout.
 * 
 * Key Features:
 * - High contrast text and icons for better readability
 * - Responsive flex/grid layout that adapts to all screen sizes
 * - Clear visual hierarchy with proper spacing
 * - Accessible form controls with focus states
 * - Consistent styling with the application design system
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.searchTerm - Current search query string
 * @param {Function} props.setSearchTerm - State setter function for search term
 * @param {string} props.selectedCategory - Currently selected category filter
 * @param {Function} props.setSelectedCategory - State setter for category filter
 * @param {string} props.sortBy - Current sorting criteria
 * @param {Function} props.setSortBy - State setter for sorting criteria
 * @param {Array} props.categories - Array of category objects with value and label properties
 * 
 * @example
 * <SearchFilters
 *   searchTerm={searchTerm}
 *   setSearchTerm={setSearchTerm}
 *   selectedCategory={selectedCategory}
 *   setSelectedCategory={setSelectedCategory}
 *   sortBy={sortBy}
 *   setSortBy={setSortBy}
 *   categories={categories}
 * />
 * 
 * @returns {JSX.Element} Rendered search and filters component
 */
const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  categories
}) => {
  /**
   * Handle search input change with proper event typing
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  /**
   * Handle category filter change
   * @param {React.ChangeEvent<HTMLSelectElement>} e - Select change event
   */
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  /**
   * Handle sort option change
   * @param {React.ChangeEvent<HTMLSelectElement>} e - Select change event
   */
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  return (
    <div 
      className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-100"
      role="search"
      aria-label="Product search and filters"
    >
      {/* Main Filters Container */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch">
        
        {/* Search Input Section */}
        <div className="flex-1 relative group">
          {/* Search Icon */}
          <Search 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5 sm:w-6 sm:h-6 transition-colors group-focus-within:text-blue-600" 
            aria-hidden="true"
          />
          
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search medications, supplements, and products..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 h-14 sm:h-16 text-lg sm:text-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl bg-white text-slate-900 placeholder-slate-500 transition-all duration-200 font-medium"
            aria-label="Search products"
            aria-describedby="search-help"
          />
          
          {/* Accessibility Help Text */}
          <div id="search-help" className="sr-only">
            Search for medications, supplements, and healthcare products by name or description
          </div>
        </div>

        {/* Filters Container - Stack on mobile, side by side on larger screens */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-shrink-0">
          
          {/* Category Filter */}
          <div className="relative group min-w-[200px]">
            {/* Filter Icon */}
            <Filter 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-emerald-600" 
              aria-hidden="true"
            />
            
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full h-14 sm:h-16 border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-xl bg-white pl-12 pr-10 text-lg sm:text-xl text-slate-900 font-medium appearance-none cursor-pointer transition-all duration-200"
              aria-label="Filter by category"
            >
              {categories.map((category) => (
                <option 
                  key={category.value} 
                  value={category.value}
                  className="text-slate-900 text-lg"
                >
                  {category.label}
                </option>
              ))}
            </select>
            
            {/* Custom Dropdown Arrow */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-600 group-focus-within:text-emerald-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Sort Options */}
          <div className="relative group min-w-[200px]">
            {/* Sort Icon */}
            <ArrowUpDown 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5 pointer-events-none transition-colors group-focus-within:text-purple-600" 
              aria-hidden="true"
            />
            
            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full h-14 sm:h-16 border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl bg-white pl-12 pr-10 text-lg sm:text-xl text-slate-900 font-medium appearance-none cursor-pointer transition-all duration-200"
              aria-label="Sort products"
            >
              <option value="name" className="text-slate-900 text-lg">Name A-Z</option>
              <option value="price-low" className="text-slate-900 text-lg">Price: Low to High</option>
              <option value="price-high" className="text-slate-900 text-lg">Price: High to Low</option>
              <option value="rating" className="text-slate-900 text-lg">Highest Rated</option>
            </select>
            
            {/* Custom Dropdown Arrow */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-600 group-focus-within:text-purple-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Indicator (Optional) */}
      {(searchTerm || selectedCategory !== 'all') && (
        <div className="mt-4 flex flex-wrap gap-2" aria-live="polite" aria-atomic="true">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              Search: "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="Clear search"
              >
                ×
              </button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              Category: {categories.find(cat => cat.value === selectedCategory)?.label}
              <button
                onClick={() => setSelectedCategory('all')}
                className="ml-2 text-emerald-600 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
                aria-label="Clear category filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;