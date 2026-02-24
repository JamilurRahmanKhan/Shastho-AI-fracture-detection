/**
 * Frontend page: VitalsPanel
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Heart, Activity, TrendingUp, Bell, CheckCircle2 } from 'lucide-react';

/**
 * Vitals Panel Component
 * 
 * Displays real-time vital signs monitoring with:
 * - Heart rate tracking
 * - Blood pressure monitoring
 * - Temperature readings
 * - Oxygen saturation
 * - Health alerts and notifications
 */
const VitalsPanel = () => {
  // Mock vital signs data
  const vitalSigns = {
    heartRate: 72,
    bloodPressure: "120/80",
    temperature: 98.6,
    oxygenSaturation: 98,
  };

  const vitals = [
    {
      icon: Heart,
      label: 'Heart Rate',
      value: `${vitalSigns.heartRate} BPM`,
      status: 'Normal',
      color: 'red',
      range: '60-100 BPM',
      progress: 75,
    },
    {
      icon: Activity,
      label: 'Blood Pressure',
      value: vitalSigns.bloodPressure,
      status: 'Normal',
      color: 'blue',
      range: '<120/80',
      progress: 80,
    },
    {
      icon: TrendingUp,
      label: 'Temperature',
      value: `${vitalSigns.temperature}°F`,
      status: 'Normal',
      color: 'orange',
      range: '97.8-99.1°F',
      progress: 70,
    },
    {
      icon: Activity,
      label: 'Oxygen Saturation',
      value: `${vitalSigns.oxygenSaturation}%`,
      status: 'Excellent',
      color: 'emerald',
      range: '95-100%',
      progress: 98,
    },
  ];

  const colorClasses = {
    red: 'from-red-50 to-pink-50 border-red-200 text-red-600',
    blue: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-600',
    orange: 'from-orange-50 to-yellow-50 border-orange-200 text-orange-600',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-600',
  };

  const progressColors = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200/50 p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center">
          <Heart className="w-8 h-8 mr-4 text-red-600" />
          Real-time Vital Signs Monitoring
        </h2>
        <p className="text-slate-600 text-lg mt-2">
          Monitor your health metrics in real-time during consultation
        </p>
      </div>

      {/* Vitals Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vitals.map((vital, index) => {
            const IconComponent = vital.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${colorClasses[vital.color]} rounded-2xl border p-6 text-center shadow-lg`}
              >
                <IconComponent className="w-12 h-12 mx-auto mb-4" />
                <div className="text-3xl font-bold mb-2">{vital.value}</div>
                <div className="text-sm font-medium mb-3">{vital.label}</div>
                <div className="bg-white/80 text-slate-800 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                  {vital.status}
                </div>
                <div className="w-full bg-white/50 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${progressColors[vital.color]}`}
                    style={{ width: `${vital.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-600">Normal: {vital.range}</div>
              </div>
            );
          })}
        </div>

        {/* Health Alerts */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <Bell className="w-6 h-6 mr-3 text-blue-600" />
            Health Alerts & Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-green-100 rounded-xl border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-green-800 font-medium">All vital signs within normal range</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-blue-100 rounded-xl border border-blue-200">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-blue-800 font-medium">
                Heart rate variability indicates good cardiovascular health
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalsPanel;