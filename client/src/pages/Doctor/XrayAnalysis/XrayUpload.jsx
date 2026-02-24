/**
 * Frontend page: XrayUpload
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DoctorSidebar from "@/components/doctor/doctor-sidebar"
import DoctorNavbar from "@/components/doctor/doctor-navbar"

export default function UploadXray() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleImageUpload = (e) => {
    const file = e?.target?.files && e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        setUploadedImage(typeof result === "string" ? result : String(result ?? ""))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = () => {
    setAnalyzing(true)
    setTimeout(() => {
      window.location.href = "/doctor/xray-analysis/results"
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">X-ray Analysis</h1>
            <p className="text-gray-600">Upload X-ray image for AI-powered fracture detection</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload X-ray Image</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="patient">Select Patient</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Doe - #PAT-2024-0156</SelectItem>
                      <SelectItem value="2">Jane Smith - #PAT-2024-0157</SelectItem>
                      <SelectItem value="3">Mike Johnson - #PAT-2024-0158</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bodyPart">Body Part</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body part" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wrist">Wrist</SelectItem>
                      <SelectItem value="ankle">Ankle</SelectItem>
                      <SelectItem value="arm">Arm</SelectItem>
                      <SelectItem value="leg">Leg</SelectItem>
                      <SelectItem value="hand">Hand</SelectItem>
                      <SelectItem value="foot">Foot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Clinical Notes</Label>
                  <Textarea id="notes" placeholder="Patient complaints, symptoms, injury details..." className="h-24" />
                </div>

                <div>
                  <Label htmlFor="xray">X-ray Image</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="xray"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {!uploadedImage ? (
                        <div className="flex flex-col items-center justify-center py-6">
                          <svg
                            className="w-12 h-12 text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, DICOM (MAX. 10MB)</p>
                        </div>
                      ) : (
                        <div className="relative w-full h-full p-2">
                          <img
                            src={uploadedImage || "/placeholder.svg"}
                            alt="X-ray"
                            className="w-full h-full object-contain rounded"
                          />
                        </div>
                      )}
                      <Input id="xray" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                {uploadedImage && (
                  <Button onClick={handleAnalyze} disabled={analyzing} className="w-full bg-blue-600 hover:bg-blue-700">
                    {analyzing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Analyze X-ray
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Analysis Information</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">AI Model: Swin Transformer V2</h4>
                      <p className="text-sm text-blue-700">
                        Our advanced AI model provides accurate fracture detection and classification with 97.3%
                        accuracy.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What the AI will analyze:</h4>
                  <ul className="space-y-2">
                    {[
                      "Fracture Detection & Classification",
                      "Precise Localization with Heatmap",
                      "Severity Assessment",
                      "Confidence Score Analysis",
                      "Treatment Recommendations",
                      "Recovery Timeline Estimation",
                      "Suggested Exercise Plan",
                      "Medication Guidelines",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-1">Important Note</h4>
                  <p className="text-sm text-orange-700">
                    AI analysis is a diagnostic aid tool. Always review results carefully and apply your clinical
                    judgment before finalizing reports.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
