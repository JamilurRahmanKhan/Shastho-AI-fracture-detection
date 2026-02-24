/**
 * Frontend page: StatsCards
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { BarChart3, Calendar, Pill, Target } from 'lucide-react';

/**
 * StatsCards Component
 * 
 * A responsive grid of statistic cards displaying user health metrics and usage data.
 * Features hover animations, gradient backgrounds, and progressive scaling for all screen sizes.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - User data object
 * @param {number} props.queryUsagePercentage - Percentage of monthly queries used (0-100)
 * @param {number} props.remainingQueries - Number of queries remaining this month
 * @param {number} props.upcomingAppointments - Count of upcoming medical appointments
 * @param {number} props.activeMedications - Count of currently active medications
 * 
 * @returns {JSX.Element} Responsive statistics cards grid
 */
const StatsCards = ({ 
  user, 
  queryUsagePercentage, 
  remainingQueries, 
  upcomingAppointments, 
  activeMedications 
}) => {
  return (
    /**
     * Main Grid Container
     * 
     * Responsive grid layout:
     * - Mobile (default): 1 column (full width cards)
     * - Medium screens (md: 768px+): 2 columns
     * - Large screens (lg: 1024px+): 4 columns
     * 
     * Features:
     * - Adaptive gap spacing (4-8 units)
     * - Bottom margin that scales with screen size
     * - Consistent card height with flex column layout
     */
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 lg:mb-12">
      
      {/* 
        Card 1: Monthly Queries 
        Displays AI query usage with progress bar
      */}
      <div className="
        border-0 shadow-xl lg:shadow-2xl 
        bg-gradient-to-br from-white to-blue-50/70 lg:from-white/90 lg:to-blue-50/50 
        backdrop-blur-sm 
        hover:shadow-2xl lg:hover:shadow-3xl 
        transition-all duration-500 
        transform hover:-translate-y-1 lg:hover:-translate-y-2 
        rounded-xl lg:rounded-2xl 
        p-4 sm:p-5 lg:p-6
        flex flex-col justify-between
        min-h-[180px] sm:min-h-[200px]
      ">
        {/* Card Header */}
        <div className="flex items-center mb-3 sm:mb-4">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-600 truncate">
            Monthly Queries
          </h3>
        </div>
        
        {/* Main Stat Value */}
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3 sm:mb-4">
          {user?.queryCount || 2}/5
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-3 sm:mb-4">
          <div 
            className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-500" 
            style={{ width: `${queryUsagePercentage}%` }}
            aria-label={`${queryUsagePercentage}% of monthly queries used`}
          ></div>
        </div>
        
        {/* Supporting Text */}
        <p className="text-xs sm:text-sm text-slate-500 font-semibold">
          {remainingQueries} {remainingQueries === 1 ? 'query' : 'queries'} remaining
        </p>
      </div>

      {/* 
        Card 2: Upcoming Appointments 
        Displays appointment count with contextual information
      */}
      <div className="
        border-0 shadow-xl lg:shadow-2xl 
        bg-gradient-to-br from-white to-emerald-50/70 lg:from-white/90 lg:to-emerald-50/50 
        backdrop-blur-sm 
        hover:shadow-2xl lg:hover:shadow-3xl 
        transition-all duration-500 
        transform hover:-translate-y-1 lg:hover:-translate-y-2 
        rounded-xl lg:rounded-2xl 
        p-4 sm:p-5 lg:p-6
        flex flex-col justify-between
        min-h-[180px] sm:min-h-[200px]
      ">
        <div className="flex items-center mb-3 sm:mb-4">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 mr-2 sm:mr-3 text-emerald-600 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-600 truncate">
            Upcoming Appointments
          </h3>
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3 sm:mb-4">
          {upcomingAppointments}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-semibold">
          Next: Tomorrow 2:30 PM
        </p>
      </div>

      {/* 
        Card 3: Active Medications 
        Displays current medication count with status
      */}
      <div className="
        border-0 shadow-xl lg:shadow-2xl 
        bg-gradient-to-br from-white to-purple-50/70 lg:from-white/90 lg:to-purple-50/50 
        backdrop-blur-sm 
        hover:shadow-2xl lg:hover:shadow-3xl 
        transition-all duration-500 
        transform hover:-translate-y-1 lg:hover:-translate-y-2 
        rounded-xl lg:rounded-2xl 
        p-4 sm:p-5 lg:p-6
        flex flex-col justify-between
        min-h-[180px] sm:min-h-[200px]
      ">
        <div className="flex items-center mb-3 sm:mb-4">
          <Pill className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 mr-2 sm:mr-3 text-purple-600 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-600 truncate">
            Active Medications
          </h3>
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3 sm:mb-4">
          {activeMedications}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-semibold">
          All on schedule
        </p>
      </div>

      {/* 
        Card 4: Health Score 
        Displays overall health assessment score
      */}
      <div className="
        border-0 shadow-xl lg:shadow-2xl 
        bg-gradient-to-br from-white to-orange-50/70 lg:from-white/90 lg:to-orange-50/50 
        backdrop-blur-sm 
        hover:shadow-2xl lg:hover:shadow-3xl 
        transition-all duration-500 
        transform hover:-translate-y-1 lg:hover:-translate-y-2 
        rounded-xl lg:rounded-2xl 
        p-4 sm:p-5 lg:p-6
        flex flex-col justify-between
        min-h-[180px] sm:min-h-[200px]
      ">
        <div className="flex items-center mb-3 sm:mb-4">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 mr-2 sm:mr-3 text-orange-600 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-600 truncate">
            Health Score
          </h3>
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3 sm:mb-4">
          94/100
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-semibold">
          Excellent health status
        </p>
      </div>
    </div>
  );
};

export default StatsCards;