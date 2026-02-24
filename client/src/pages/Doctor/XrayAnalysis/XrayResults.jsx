/**
 * Frontend page: XrayResults
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import DoctorSidebar from "@/components/doctor/doctor-sidebar"
import DoctorNavbar from "@/components/doctor/doctor-navbar"

export default function XrayResults() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [doctorNotes, setDoctorNotes] = useState("")

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">X-ray Analysis Results</h1>
              <p className="text-gray-600">Patient: John Doe | Analysis ID: #XRA-2024-0892</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Report
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve Report
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Fracture Type</h3>
              <p className="text-2xl font-bold text-blue-600">Hairline Fracture</p>
              <Badge className="mt-2 bg-orange-100 text-orange-700">Moderate Severity</Badge>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Confidence Score</h3>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-teal-600">96.8%</p>
                <p className="text-sm text-gray-600 mb-1">High Confidence</p>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600" style={{ width: "96.8%" }}></div>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Recovery Timeline</h3>
              <p className="text-2xl font-bold text-purple-600">6-8 weeks</p>
              <p className="text-sm text-gray-600 mt-2">With proper treatment and rest</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">X-ray Image with AI Analysis</h2>
              <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <svg
                    className="w-16 h-16 mx-auto mb-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm opacity-75">X-ray with heatmap overlay</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  Original
                </Button>
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  With Heatmap
                </Button>
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  Side by Side
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">AI Recommendations</h2>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Treatment Plan</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Immobilization with cast for 6-8 weeks</li>
                      <li>• Non-weight bearing for first 2 weeks</li>
                      <li>• Regular follow-up X-rays every 2 weeks</li>
                      <li>• Physical therapy after cast removal</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Medication Suggestions</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Ibuprofen 400mg - Pain relief (3x daily)</li>
                      <li>• Calcium + Vitamin D - Bone healing</li>
                      <li>• Vitamin C supplement - Tissue repair</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recovery Exercises</h2>
                <p className="text-sm text-gray-600 mb-3">Start after 3 weeks with doctor approval:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">Week 3-4:</span>
                    Gentle finger movements
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">Week 5-6:</span>
                    Wrist rotation exercises
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">Week 7-8:</span>
                    Strengthening exercises
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Doctor's Notes & Modifications</h2>
            <Textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Add your clinical observations, modify AI recommendations, or add additional instructions..."
              className="h-32 mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline">Save as Draft</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Finalize & Send Report
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
