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

import { Sparkles, ArrowRight, MessageCircle } from "lucide-react"
import { Link } from "react-router-dom"


/**
 * CTASection Component
 * 
 * A responsive call-to-action section that encourages users to sign up or try the demo.
 * Features a gradient background, prominent buttons, and persuasive copy.
 * 
 * @param {string} className - Optional additional CSS classes for custom styling
 * 
 * Features:
 * - Fully responsive layout with centered content
 * - Gradient background from blue to purple
 * - Two primary action buttons (Start Free Trial & Try AI Demo)
 * - White text with proper contrast
 * - Hover effects and animations on buttons
 * 
 * Usage:
 * <CTASection className="my-8" />
 */
export default function CTASection({ className = "" }) {
  return (
    <section className={`py-20 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white ${className}`}>
      <div className="container mx-auto text-center">
        {/* Main Heading */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Transform Your Healthcare?
        </h2>
        
        {/* Description */}
        <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
          Join thousands of patients who trust ShasthoAI for their healthcare needs. Start your free consultation today.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Primary Button - Start Free Trial */}
          <Link
            href="/signup"
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 text-lg px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold inline-flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
            Start Free Trial
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
          </Link>

          {/* Secondary Button - Try AI Demo */}
          <Link
            href="/chat"
            className="border-2 border-white/30 hover:border-white hover:bg-white/10 text-lg px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-transparent backdrop-blur-sm font-semibold inline-flex items-center justify-center text-white"
          >
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
            Try AI Demo
          </Link>
        </div>
      </div>
    </section>
  )
}