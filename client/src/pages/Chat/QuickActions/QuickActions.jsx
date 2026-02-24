/**
 * Frontend page: QuickActions
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Stethoscope, ImageIcon, Pill, Upload, Video } from 'lucide-react';

/**
 * Quick Actions Component
 * 
 * Provides quick access to common medical actions:
 * - Symptom checking
 * - Image analysis
 * - Medication information
 * - Lab results upload
 * - Video consultations
 */
const QuickActions = () => {
  const actions = [
    {
      icon: Stethoscope,
      label: 'Symptom Checker',
      description: 'Comprehensive symptom assessment',
      color: 'emerald',
    },
    {
      icon: ImageIcon,
      label: 'X-ray Analysis',
      description: 'Upload and analyze medical images',
      color: 'blue',
    },
    {
      icon: Pill,
      label: 'Medication Info',
      description: 'Drug information and interactions',
      color: 'purple',
    },
    {
      icon: Upload,
      label: 'Lab Results',
      description: 'Upload and interpret lab tests',
      color: 'orange',
    },
    {
      icon: Video,
      label: 'Video Consultation',
      description: 'Connect with doctors',
      color: 'pink',
    },
  ];

  const colorClasses = {
    emerald: 'border-emerald-200 hover:bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 hover:bg-blue-50 text-blue-700',
    purple: 'border-purple-200 hover:bg-purple-50 text-purple-700',
    orange: 'border-orange-200 hover:bg-orange-50 text-orange-700',
    pink: 'border-pink-200 hover:bg-pink-50 text-pink-700',
  };

  return (
    <div className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center">
        <span className="text-blue-600 mr-2">⚡</span>
        Quick Actions
      </h3>
      
      <div className="space-y-3">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              className={`w-full text-left p-3 rounded-xl border-2 bg-transparent transition-all duration-200 hover:shadow-md ${colorClasses[action.color]}`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm sm:text-base">{action.label}</div>
                  <div className="text-xs text-slate-600">{action.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;