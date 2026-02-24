/**
 * Frontend page: Consultations
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
import { Badge } from "@/components/ui/badge"
import DoctorSidebar from "@/components/doctor/doctor-sidebar"
import DoctorNavbar from "@/components/doctor/doctor-navbar"

export default function Consultations() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedChat, setSelectedChat] = useState(1)
  const [message, setMessage] = useState("")

  const chats = [
    { id: 1, patient: "John Doe", lastMessage: "Thanks for the consultation", time: "2m ago", unread: 2 },
    { id: 2, patient: "Jane Smith", lastMessage: "When should I schedule follow-up?", time: "1h ago", unread: 0 },
    { id: 3, patient: "Mike Johnson", lastMessage: "Can you review my X-ray?", time: "3h ago", unread: 1 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Consultations</h1>
            <p className="text-gray-600">Chat with your patients and provide real-time support</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-4">
              <div className="mb-4">
                <Input placeholder="Search patients..." />
              </div>
              <div className="space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedChat === chat.id ? "bg-blue-50 border-2 border-blue-600" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{chat.patient}</h4>
                      {chat.unread > 0 && <Badge className="bg-blue-600 text-white">{chat.unread}</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-1 truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-gray-500">{chat.time}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-2 flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      JD
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">John Doe</h3>
                      <p className="text-sm text-teal-600">Online</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Start Video Call
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    JD
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3 inline-block">
                      <p className="text-sm text-gray-900">Hi Doctor, I have a question about my wrist pain.</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    SJ
                  </div>
                  <div className="flex-1 text-right">
                    <div className="bg-blue-600 text-white rounded-lg p-3 inline-block">
                      <p className="text-sm">Hello John! I'd be happy to help. Can you describe the pain?</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">10:31 AM</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    JD
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3 inline-block">
                      <p className="text-sm text-gray-900">
                        It's a sharp pain when I move my wrist. Started after I fell yesterday.
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">10:32 AM</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    SJ
                  </div>
                  <div className="flex-1 text-right">
                    <div className="bg-blue-600 text-white rounded-lg p-3 inline-block">
                      <p className="text-sm">
                        I see. Let's get an X-ray to check for any fractures. I'll schedule that for you now.
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">10:33 AM</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    JD
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3 inline-block">
                      <p className="text-sm text-gray-900">Thanks for the consultation</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">10:35 AM</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
