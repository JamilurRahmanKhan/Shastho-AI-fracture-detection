/**
 * Frontend page: AnalysisPanel
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { Brain, CheckCircle2, Clock, Stethoscope, Pill, Download, Share, Bookmark, AlertTriangle } from 'lucide-react';

/**
 * Analysis Panel Component
 * 
 * Displays detailed medical analysis including:
 * - AI diagnosis results
 * - Confidence scores
 * - Treatment recommendations
 * - Doctor consultation advice
 * - Prescription information
 */
const AnalysisPanel = ({ currentAnalysis, onBackToChat }) => {
  if (!currentAnalysis) {
    return (
      <div className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center">
        <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-700 mb-4">No Analysis Available</h3>
        <p className="text-slate-600 mb-6">
          Start a conversation with the AI to get detailed medical analysis and recommendations.
        </p>
        <button
          onClick={onBackToChat}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          Start AI Consultation
        </button>
      </div>
    );
  }

  const urgencyColors = {
    emergency: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <div className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
      {/* Analysis Header */}
      <div className="border-b border-slate-200/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              currentAnalysis.urgency === 'emergency' ? 'bg-gradient-to-r from-red-600 to-red-700 animate-pulse' :
              currentAnalysis.urgency === 'high' ? 'bg-gradient-to-r from-orange-600 to-red-600' :
              currentAnalysis.urgency === 'medium' ? 'bg-gradient-to-r from-yellow-600 to-orange-600' :
              'bg-gradient-to-r from-emerald-600 to-teal-600'
            }`}>
              {currentAnalysis.type === 'fracture' ? (
                <ImageIcon className="w-8 h-8 text-white" />
              ) : currentAnalysis.type === 'prescription' ? (
                <Pill className="w-8 h-8 text-white" />
              ) : (
                <Stethoscope className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{currentAnalysis.title}</h2>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${urgencyColors[currentAnalysis.urgency]}`}>
                  {currentAnalysis.urgency.toUpperCase()} PRIORITY
                </span>
                {currentAnalysis.confidence && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                    {currentAnalysis.confidence}% Confidence
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-xl border border-blue-200 hover:bg-blue-50 text-blue-600 transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-emerald-600 transition-colors">
              <Share className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-600 transition-colors">
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      <div className="p-6 space-y-6">
        {/* Analysis Result */}
        <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <Brain className="w-6 h-6 mr-3 text-blue-600" />
            AI Analysis Result
          </h3>
          <p className="text-slate-700 text-lg leading-relaxed">{currentAnalysis.result}</p>
          {currentAnalysis.estimatedHealingTime && (
            <div className="mt-4 p-4 bg-white/80 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-slate-900">Estimated Healing Time:</span>
                <span className="text-blue-700 font-medium">{currentAnalysis.estimatedHealingTime}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-600" />
            Recommendations
          </h3>
          <div className="space-y-3">
            {currentAnalysis.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Consultation */}
        {currentAnalysis.doctorConsultation && (
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50/50 rounded-2xl border border-purple-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <Stethoscope className="w-6 h-6 mr-3 text-purple-600" />
              Doctor Consultation
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                  {currentAnalysis.doctorConsultation.recommended ? 'RECOMMENDED' : 'OPTIONAL'}
                </span>
                {currentAnalysis.doctorConsultation.specialty && (
                  <span className="text-slate-700">
                    Specialty: <strong>{currentAnalysis.doctorConsultation.specialty}</strong>
                  </span>
                )}
              </div>
              {currentAnalysis.doctorConsultation.urgency && (
                <p className="text-slate-700">
                  <strong>Timeline:</strong> {currentAnalysis.doctorConsultation.urgency}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Prescription Information */}
        {currentAnalysis.prescription && (
          <div className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50/50 rounded-2xl border border-orange-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
              <Pill className="w-6 h-6 mr-3 text-orange-600" />
              Medication Recommendations
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Medications:</h4>
                <div className="space-y-2">
                  {currentAnalysis.prescription.medications.map((medication, index) => (
                    <div key={index} className="p-3 bg-white/80 rounded-xl border border-orange-200">
                      <span className="font-medium text-orange-800">{medication}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Instructions:</h4>
                <div className="space-y-2">
                  {currentAnalysis.prescription.instructions.map((instruction, index) => (
                    <div key={index} className="p-3 bg-white/80 rounded-xl border border-orange-200">
                      <span className="text-slate-700">{instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-100 rounded-xl border border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> This is an AI-generated recommendation for informational purposes only. 
                  Please consult with a licensed physician before starting any new medication.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;