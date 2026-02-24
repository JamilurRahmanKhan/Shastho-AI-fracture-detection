/**
 * Frontend page: AppointmentsPanel
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Calendar, Video, Phone, MapPin, Sparkles, Stethoscope, Heart } from 'lucide-react';

/**
 * Appointments Panel Component
 * 
 * Handles medical appointment booking with:
 * - Multiple consultation types (video, phone, in-person)
 * - AI-recommended specialists
 * - Available time slots
 * - Doctor profiles and ratings
 */
const AppointmentsPanel = () => {
  const consultationTypes = [
    {
      icon: Video,
      type: 'Video Consultation',
      description: 'Connect with doctors via secure video call',
      availability: '24/7',
      duration: '15-30 minutes',
      badge: 'Most Popular',
      color: 'blue',
    },
    {
      icon: Phone,
      type: 'Phone Consultation',
      description: 'Speak directly with healthcare providers',
      availability: '8 AM - 10 PM',
      duration: '10-20 minutes',
      badge: 'Quick Access',
      color: 'emerald',
    },
    {
      icon: MapPin,
      type: 'In-Person Visit',
      description: 'Visit healthcare facilities near you',
      availability: 'Business Hours',
      duration: '30-60 minutes',
      badge: 'Comprehensive',
      color: 'purple',
    },
  ];

  const specialists = [
    {
      name: 'Dr. Sarah Johnson',
      specialty: 'Orthopedic Surgeon',
      availability: 'Available Today',
      rating: 'AI Recommended',
      description: 'Specializes in fracture treatment and sports injuries',
      icon: Stethoscope,
      color: 'blue',
    },
    {
      name: 'Dr. Michael Chen',
      specialty: 'Cardiologist',
      availability: 'Next Available: Tomorrow',
      rating: 'Highly Rated',
      description: 'Expert in cardiovascular health and preventive care',
      icon: Heart,
      color: 'emerald',
    },
  ];

  const colorClasses = {
    blue: 'from-blue-600 to-indigo-600',
    emerald: 'from-emerald-600 to-teal-600',
    purple: 'from-purple-600 to-pink-600',
  };

  const badgeColors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200/50 p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center">
          <Calendar className="w-8 h-8 mr-4 text-purple-600" />
          Book Doctor Consultation
        </h2>
        <p className="text-slate-600 text-lg mt-2">
          Schedule appointments with healthcare professionals based on your AI analysis
        </p>
      </div>

      {/* Consultation Types */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {consultationTypes.map((consultation, index) => {
            const IconComponent = consultation.icon;
            return (
              <div
                key={index}
                className="border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${colorClasses[consultation.color]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{consultation.type}</h3>
                  <p className="text-slate-600 mb-4">{consultation.description}</p>
                  <div className="space-y-2 mb-6">
                    <div className="text-sm text-slate-500">Available: {consultation.availability}</div>
                    <div className="text-sm text-slate-500">Duration: {consultation.duration}</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badgeColors[consultation.color]}`}>
                      {consultation.badge}
                    </span>
                  </div>
                  <button className={`w-full bg-gradient-to-r ${colorClasses[consultation.color]} hover:shadow-lg text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200`}>
                    Book {consultation.type.split(' ')[0]}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Recommended Specialists */}
        <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50/50 rounded-2xl border border-yellow-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <Sparkles className="w-6 h-6 mr-3 text-yellow-600" />
            AI-Recommended Specialists
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialists.map((specialist, index) => {
              const IconComponent = specialist.icon;
              return (
                <div key={index} className="p-4 bg-white/80 rounded-xl border border-yellow-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[specialist.color]} rounded-full flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{specialist.name}</h4>
                      <p className="text-sm text-slate-600">{specialist.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
                      {specialist.availability}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
                      {specialist.rating}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{specialist.description}</p>
                  <button className={`w-full bg-gradient-to-r ${colorClasses[specialist.color]} hover:shadow-lg text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all duration-200`}>
                    Book Appointment
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPanel;