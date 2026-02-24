/**
 * Frontend page: ChatHeader
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Home, ShoppingCart } from 'lucide-react';

/**
 * Chat Header Component
 * 
 * Displays the application header with navigation and branding
 * Features emergency mode indicator and quick access to other sections
 */
const ChatHeader = ({ isEmergencyMode, user }) => {
  return (
    <header className="bg-white/90 backdrop-blur-2xl border-b border-slate-200/50 shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              ShasthoAI
            </span>
            <div className="text-xs font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text tracking-wider">
              AI MEDICAL ASSISTANT
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 text-sm sm:text-base font-medium py-2 px-3 rounded-lg transition-colors hover:bg-gray-50"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:block">Dashboard</span>
          </Link>
          
          <Link
            to="/store"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 text-sm sm:text-base font-medium py-2 px-3 rounded-lg transition-colors hover:bg-gray-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:block">Medical Store</span>
          </Link>

          {/* Emergency Mode Indicator */}
          {isEmergencyMode && (
            <div className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              🚨 Emergency Mode Active
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;