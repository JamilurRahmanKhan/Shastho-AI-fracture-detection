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
import { Brain } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-[#FCFDFF] flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse shadow-2xl">
          <Brain className="w-12 h-12 text-white" />
        </div>
        <p className="text-slate-600 text-2xl font-semibold">Loading your health dashboard...</p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;