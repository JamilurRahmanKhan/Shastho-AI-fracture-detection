/**
 * Frontend page: CTASection
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

"use client"

import { useState } from "react"
import { Sparkles, Brain } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { api } from "@/services/api"

export default function CTASection() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const sub = useSubscription()
  const [busy, setBusy] = useState(false)

  const onStartTrial = async () => {
    if (!authUser?.uid) {
      navigate("/signup")
      return
    }
    setBusy(true)
    try {
      const resp = await api.activateFreeThreeDays()
      const trialEpisodeId = resp?.episode?.id || resp?.episode?._id || resp?.trial?.episodeId || null
      if (trialEpisodeId && sub?.selectEpisode) await sub.selectEpisode(trialEpisodeId)
      else if (sub?.refresh) await sub.refresh()
      alert("Free trial activated. You can now upload an X-ray in AI Chat.")
      navigate("/chat")
    } catch (e) {
      alert(e?.message || "Failed to activate free trial.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="w-full py-12 bg-[#F9FBFC]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white border-0 shadow-2xl relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-700/90"></div>
            
            <div className="p-8 sm:p-12 lg:p-16 relative">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
                Ready to Experience Advanced AI Healthcare?
              </h3>
              
              <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
                Join thousands of healthcare professionals and patients who trust ShasthoAI for accurate, instant
                medical diagnosis and comprehensive healthcare solutions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <button
                  className="bg-white text-blue-600 hover:bg-blue-50 px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl"
                  disabled={busy}
                  onClick={onStartTrial}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 inline" />
                  {busy ? "Please wait..." : "Start Free Trial"}
                </button>
                
                <button
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 rounded-xl bg-transparent"
                  onClick={() => navigate("/chat")}
                >
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 inline" />
                  Try Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}