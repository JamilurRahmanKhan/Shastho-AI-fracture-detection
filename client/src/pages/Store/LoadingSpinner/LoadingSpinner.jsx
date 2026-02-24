/**
 * Frontend page: LoadingSpinner
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { ShoppingCart } from 'lucide-react';

/**
 * LoadingSpinner Component
 * 
 * Displays a loading state for the medical store with animated elements
 * 
 * Features:
 * - Centered loading animation
 * - Medical store branding
 * - Smooth pulse animation
 * 
 * @returns {JSX.Element} Loading spinner component
 */
const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
          <ShoppingCart className="w-10 h-10 text-white" />
        </div>
        <p className="text-slate-600 text-xl font-medium">Loading medical store...</p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;