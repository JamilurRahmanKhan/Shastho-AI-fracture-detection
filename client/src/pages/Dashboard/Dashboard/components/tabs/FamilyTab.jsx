/**
 * Frontend page: FamilyTab
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Users, Plus, TrendingUp, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

const FamilyTab = () => {
  return (
    <div className="space-y-8">
      <div className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center mb-6">
          <Users className="w-8 h-8 mr-4 text-purple-600" />
          Family Health Management
        </h2>
        <p className="text-lg text-slate-600 mb-8">
          Manage health records for your entire family
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Family Member Cards */}
          <div className="border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-white font-bold text-2xl">J</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">John Doe</h3>
            <p className="text-slate-600 mb-4">Spouse • Age 35</p>
            <div className="space-y-2 mb-4">
              <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-sm font-medium">Healthy</span>
              <div className="text-sm text-slate-500">Last checkup: 2 weeks ago</div>
            </div>
            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 rounded-lg transition-all duration-200">
              <span className="flex items-center justify-center">
                View Records
              </span>
            </button>
          </div>

          <div className="border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Emma Doe</h3>
            <p className="text-slate-600 mb-4">Daughter • Age 8</p>
            <div className="space-y-2 mb-4">
              <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-sm font-medium">Checkup Due</span>
              <div className="text-sm text-slate-500">Last checkup: 6 months ago</div>
            </div>
            <button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium py-2 rounded-lg transition-all duration-200">
              <span className="flex items-center justify-center">
                Schedule Checkup
              </span>
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-400 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Add Family Member</h3>
            <p className="text-slate-600 mb-4">Invite family members to join</p>
            <button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-medium py-2 rounded-lg transition-all duration-200">
              <span className="flex items-center justify-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </span>
            </button>
          </div>
        </div>

        {/* Family Health Overview */}
        <div className="border border-slate-200 shadow-xl rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center mb-6">
            <TrendingUp className="w-7 h-7 mr-3 text-emerald-600" />
            Family Health Overview
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
              <div className="text-3xl font-bold text-emerald-600 mb-2">2</div>
              <div className="text-sm text-emerald-700 font-medium">Members Up to Date</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
              <div className="text-3xl font-bold text-yellow-600 mb-2">1</div>
              <div className="text-sm text-yellow-700 font-medium">Checkup Due</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
              <div className="text-sm text-blue-700 font-medium">Upcoming Appointments</div>
            </div>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl text-lg mt-8">
          <Users className="w-5 h-5 mr-3 inline" />
          Manage Family Health Plan
          <span className="w-4 h-4 ml-2 inline">✨</span>
        </button>
      </div>
    </div>
  );
};

export default FamilyTab;