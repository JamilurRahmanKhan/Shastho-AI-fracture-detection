/**
 * Frontend page: EmergencyButton
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Emergency Button Component
 * 
 * Prominent emergency call-to-action with:
 * - High visibility design
 * - Pulse animation for attention
 * - Confirmation before activation
 * - Emergency mode state management
 */
const EmergencyButton = ({ onEmergency, isEmergencyMode }) => {
  const handleEmergencyClick = () => {
    if (window.confirm(
      '🚨 EMERGENCY MODE 🚨\n\nAre you sure you want to activate emergency mode? This will:\n\n• Contact emergency services\n• Share your location\n• Notify your emergency contacts\n\nPlease only use this for genuine medical emergencies.'
    )) {
      onEmergency();
    }
  };

  if (isEmergencyMode) {
    return (
      <div className="bg-red-100 border border-red-200 rounded-2xl p-4 mb-6 animate-pulse">
        <div className="flex items-center justify-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <span className="text-red-800 font-bold text-lg">Emergency Mode Active - Help is on the way</span>
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleEmergencyClick}
      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 animate-pulse mb-6 flex items-center justify-center space-x-3"
    >
      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
      <span className="text-lg sm:text-xl">EMERGENCY - GET HELP NOW</span>
      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
};

export default EmergencyButton;