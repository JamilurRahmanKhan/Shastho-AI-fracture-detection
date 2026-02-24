/**
 * Frontend page: TestimonialsSection
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

"use client"

import { Star } from "lucide-react"

/**
 * TestimonialsSection Component
 * 
 * A responsive testimonials section displaying patient success stories with:
 * - Star ratings
 * - Patient photos (represented by gradient circles with initials)
 * - Names and roles
 * - Testimonial content
 * 
 * @param {string} className - Optional additional CSS classes for custom styling
 * 
 * Features:
 * - Fully responsive grid layout (1 column on mobile, 3 columns on desktop)
 * - Gradient avatars for patients
 * - Consistent card design with shadows and backdrop blur
 * - Star rating system
 * 
 * Usage:
 * <TestimonialsSection className="my-8" />
 */
export default function TestimonialsSection({ className = "" }) {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Mitchell",
      role: "Marathon Runner",
      content: "\"ShasthoAI diagnosed my fracture instantly when I uploaded my X-ray. The AI was more accurate than my initial doctor visit, and I got treatment 2 days earlier!\"",
      initials: "SM",
      gradientFrom: "from-blue-600",
      gradientTo: "to-indigo-600"
    },
    {
      id: 2,
      name: "David Johnson",
      role: "Father of 3",
      content: "\"The family health management feature is incredible. I can track my entire family's health, schedule appointments, and manage medications all in one place.\"",
      initials: "DJ",
      gradientFrom: "from-emerald-600",
      gradientTo: "to-teal-600"
    },
    {
      id: 3,
      name: "Maria Chen",
      role: "Retired Teacher",
      content: "\"As a senior citizen, having 24/7 access to medical consultation gives me peace of mind. The AI is patient, thorough, and always available when I need help.\"",
      initials: "MC",
      gradientFrom: "from-purple-600",
      gradientTo: "to-pink-600"
    }
  ]

  return (
    <section className={`py-20 px-6 bg-white ${className}`}>
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200 px-6 py-2 text-lg mb-6 inline-flex items-center rounded-full">
            <Star className="w-5 h-5 mr-2" />
            Patient Success Stories
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
            Trusted by Patients Worldwide
          </h2>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            See how ShasthoAI has transformed healthcare experiences for thousands of patients around the globe.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl"
            >
              <div className="p-6 md:p-8">
                {/* Star Rating */}
                <div className="flex items-center mb-4 md:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-current" 
                    />
                  ))}
                </div>

                {/* Testimonial Content */}
                <p className="text-base md:text-lg text-slate-700 mb-4 md:mb-6 leading-relaxed">
                  {testimonial.content}
                </p>

                {/* Patient Info */}
                <div className="flex items-center space-x-3 md:space-x-4">
                  {/* Avatar with Gradient */}
                  <div 
                    className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${testimonial.gradientFrom} ${testimonial.gradientTo} rounded-full flex items-center justify-center shadow-lg`}
                  >
                    <span className="text-white font-bold text-sm md:text-base">
                      {testimonial.initials}
                    </span>
                  </div>
                  
                  {/* Name and Role */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm md:text-base truncate">
                      {testimonial.name}
                    </div>
                    <div className="text-slate-600 text-xs md:text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}