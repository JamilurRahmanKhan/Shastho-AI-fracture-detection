/**
 * Frontend page: XrayAnalysis
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import DoctorSidebar from "@/components/doctor/doctor-sidebar"
import DoctorNavbar from "@/components/doctor/doctor-navbar"

export default function XrayAnalysisPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const analyses = [
    { id: 1, patient: "John Doe", bodyPart: "Wrist", uploadDate: "2025-01-10", status: "Pending", priority: "High" },
    {
      id: 2,
      patient: "Jane Smith",
      bodyPart: "Ankle",
      uploadDate: "2025-01-09",
      status: "Completed",
      priority: "Medium",
      confidence: 94,
    },
    {
      id: 3,
      patient: "Mike Johnson",
      bodyPart: "Leg",
      uploadDate: "2025-01-09",
      status: "In Progress",
      priority: "Low",
    },
    {
      id: 4,
      patient: "Emily Brown",
      bodyPart: "Arm",
      uploadDate: "2025-01-08",
      status: "Completed",
      priority: "Medium",
      confidence: 88,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">X-ray Analysis</h1>
            <p className="text-gray-600">AI-powered bone fracture detection and analysis</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Analyses</h3>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">156</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Pending Review</h3>
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">8</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Avg. Confidence</h3>
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900">92%</p>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Recent X-ray Analyses</h2>
                <p className="text-sm text-gray-600">Review and manage AI-generated reports</p>
              </div>
              <Link to="/doctor/xray-analysis/upload">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload X-ray
                </Button>
              </Link>
            </div>
          </Card>

          <div className="grid gap-4">
            {analyses.map((analysis) => (
              <Card key={analysis.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{analysis.patient}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{analysis.bodyPart}</span>
                        <span>•</span>
                        <span>{analysis.uploadDate}</span>
                        {analysis.confidence && (
                          <>
                            <span>•</span>
                            <span className="text-teal-600 font-medium">{analysis.confidence}% Confidence</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        analysis.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : analysis.priority === "Medium"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {analysis.priority}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        analysis.status === "Completed"
                          ? "bg-teal-100 text-teal-700"
                          : analysis.status === "Pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {analysis.status}
                    </span>
                    <Link to={`/doctor/xray-analysis/${analysis.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
