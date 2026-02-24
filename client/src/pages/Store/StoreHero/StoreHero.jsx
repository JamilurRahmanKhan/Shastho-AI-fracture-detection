/**
 * Frontend page: StoreHero
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Truck, Shield, Award } from 'lucide-react';

/**
 * StoreHero Component
 * 
 * Hero section for the medical store with key features and benefits
 * 
 * Features:
 * - Gradient background with overlay
 * - Trust indicators with icons
 * - Responsive layout
 * - Professional medical branding
 * 
 * @returns {JSX.Element} Store hero component
 */
const StoreHero = ({ currencySymbol = '৳', freeShippingThreshold = 0 }) => {
  return (
    <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-2xl text-white p-8 sm:p-12 mb-8 sm:mb-12 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-blue-700/90"></div>
      
      <div className="relative">
        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
          Premium Medical Store
        </h1>
        
        {/* Description */}
        <p className="text-emerald-100 mb-6 sm:mb-8 text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-3xl">
          Get your prescribed medications and health supplements delivered to your door with our professional
          pharmacy service
        </p>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-8 text-sm sm:text-base">
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 sm:px-4 sm:py-2 w-full sm:w-auto justify-center sm:justify-start">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
            Free delivery over {currencySymbol}{Number(freeShippingThreshold || 0).toLocaleString()}
          </div>
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 sm:px-4 sm:py-2 w-full sm:w-auto justify-center sm:justify-start">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
            Verified medications
          </div>
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 sm:px-4 sm:py-2 w-full sm:w-auto justify-center sm:justify-start">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
            Trusted by thousands
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHero;