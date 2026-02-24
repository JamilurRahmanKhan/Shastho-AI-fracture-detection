/**
 * Frontend page: HealthTab
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Stethoscope, Target, Plus, Heart, Activity, Thermometer, Weight, Droplets, Zap } from 'lucide-react';

const HealthTab = ({ healthMetrics }) => {
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Detailed Health Metrics */}
        <div className="lg:col-span-2 border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center mb-6">
            <Stethoscope className="w-8 h-8 mr-4 text-blue-600" />
            Comprehensive Health Metrics
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <Heart className="w-8 h-8 text-red-500" />
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Normal</span>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-2">{healthMetrics?.heartRate || 72} BPM</div>
                <div className="text-sm text-red-700 font-medium">Resting Heart Rate</div>
                <div className="text-xs text-red-600 mt-2">Range: 60-100 BPM</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <Thermometer className="w-8 h-8 text-orange-500" />
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Normal</span>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{healthMetrics?.temperature || 98.6}°F</div>
                <div className="text-sm text-orange-700 font-medium">Body Temperature</div>
                <div className="text-xs text-orange-600 mt-2">Range: 97.8-99.1°F</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <Weight className="w-8 h-8 text-purple-500" />
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Healthy</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">{healthMetrics?.weight || 70} kg</div>
                <div className="text-sm text-purple-700 font-medium">Current Weight</div>
                <div className="text-xs text-purple-600 mt-2">BMI: {healthMetrics?.bmi || 22.9}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-blue-500" />
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Normal</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">{healthMetrics?.bloodPressure || "120/80"}</div>
                <div className="text-sm text-blue-700 font-medium">Blood Pressure</div>
                <div className="text-xs text-blue-600 mt-2">Systolic/Diastolic</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <Droplets className="w-8 h-8 text-emerald-500" />
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Excellent</span>
                </div>
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {healthMetrics?.oxygenSaturation || 98}%
                </div>
                <div className="text-sm text-emerald-700 font-medium">Oxygen Saturation</div>
                <div className="text-xs text-emerald-600 mt-2">Range: 95-100%</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-8 h-8 text-yellow-500" />
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Normal</span>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {healthMetrics?.glucoseLevel || 95} mg/dL
                </div>
                <div className="text-sm text-yellow-700 font-medium">Blood Glucose</div>
                <div className="text-xs text-yellow-600 mt-2">Fasting level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Goals */}
        <div className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center mb-6">
            <Target className="w-7 h-7 mr-3 text-emerald-600" />
            Health Goals
          </h2>
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-emerald-800">Weight Loss</span>
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="text-sm text-emerald-700">3kg lost of 4kg goal</div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-blue-800">Exercise</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <div className="text-sm text-blue-700">150 min/week achieved</div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-purple-800">Sleep Quality</span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">90%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <div className="text-sm text-purple-700">7.5 hours average</div>
            </div>

            <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
              <Plus className="w-4 h-4 mr-2 inline" />
              Add New Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthTab;