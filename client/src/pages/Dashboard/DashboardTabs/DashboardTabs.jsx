/**
 * Frontend page: DashboardTabs
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from 'react';
import { 
  BarChart3, 
  Heart, 
  Calendar, 
  Pill, 
  FileText, 
  Users 
} from 'lucide-react';

// Import tab components
import OverviewTab from '../Dashboard/components/tabs/OverviewTab';
import HealthTab from '../Dashboard/components/tabs/HealthTab';
import AppointmentsTab from '../Dashboard/components/tabs/AppointmentsTab';
import MedicationsTab from '../Dashboard/components/tabs/MedicationsTab';
import RecordsTab from '../Dashboard/components/tabs/RecordsTab';
import FamilyTab from '../Dashboard/components/tabs/FamilyTab';

const DashboardTabs = ({
  activeTab,
  setActiveTab,
  // user,
  healthMetrics,
  appointments,
  onAppointmentsChanged,
  medications,
  onMedicationsChanged,
  analysisHistory,
  medicalRecords,
  onMedicalRecordsChanged
}) => {
  const tabs = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    // { id: "health", name: "Health Metrics", icon: Heart },
    { id: "appointments", name: "Appointments", icon: Calendar },
    { id: "medications", name: "Medications", icon: Pill },
    { id: "records", name: "Medical Records", icon: FileText },
    // { id: "family", name: "Family Health", icon: Users },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab healthMetrics={healthMetrics} />;
      // case "health":
      //   return <HealthTab healthMetrics={healthMetrics} />;
      case "appointments":
        return <AppointmentsTab appointments={appointments} onAppointmentsChanged={onAppointmentsChanged} />;
      case "medications":
        return <MedicationsTab medications={medications} onMedicationsChanged={onMedicationsChanged} />;
      case "records":
        return <RecordsTab analysisHistory={analysisHistory} medicalRecords={medicalRecords} onMedicalRecordsChanged={onMedicalRecordsChanged} />;
      // case "family":
      //   return <FamilyTab />;
      default:
        return <OverviewTab healthMetrics={healthMetrics} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs Navigation */}
      {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-2xl rounded-2xl p-2"> */}
        <div
        className={`grid gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-2xl rounded-2xl p-2 
        grid-cols-2 sm:grid-cols-2 md:grid-cols-4`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DashboardTabs;