/**
 * Frontend page: WelcomeSection
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Calendar, Activity, Shield, CheckCircle2 } from 'lucide-react';

const WelcomeSection = ({ user, healthMetrics }) => {
  return (
    <div className="mb-8 lg:mb-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
        {/* Left Section - User Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <span className="text-white text-2xl sm:text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          
          {/* User Details */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2 sm:mb-3">
              Welcome back, {user?.name}!
            </h1>
            
            <p className="text-slate-600 flex items-center justify-center sm:justify-start text-base sm:text-lg lg:text-xl mb-3 sm:mb-4">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 flex-shrink-0" />
              Member since {new Date(user?.joinDate).toLocaleDateString()}
            </p>
            
            {/* Badges */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
              <span className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                Active Patient
              </span>
              
              {user?.isPremium && (
                <span className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  Premium Pro
                </span>
              )}
              
              <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                Verified Account
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Health Status */}
        <div className="text-center sm:text-right lg:text-right flex-shrink-0">
          <div className="text-sm text-slate-500 mb-1 sm:mb-2">Last Health Check</div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">
            {healthMetrics?.lastUpdated?.toLocaleDateString() || new Date().toLocaleDateString()}
          </div>
          <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-start lg:justify-end">
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            All Systems Normal
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;