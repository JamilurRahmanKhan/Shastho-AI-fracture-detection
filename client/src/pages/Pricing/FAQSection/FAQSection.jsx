/**
 * Frontend page: FAQSection
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

"use client"

export default function FAQSection() {
  // Static data for FAQs
  const faqs = [
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.",
    },
    {
      question: "Is my medical data secure?",
      answer: "Absolutely. We use enterprise-grade encryption and are fully HIPAA compliant. Your medical data is never shared with third parties and is stored with the highest security standards.",
    },
    {
      question: "How accurate is the AI diagnosis?",
      answer: "Our AI models achieve 94% accuracy in bone fracture detection using advanced Swin Transformer V2 technology. However, AI results should always be confirmed by a qualified healthcare professional.",
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for all premium subscriptions. If you're not satisfied with our service, contact us for a full refund.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our encrypted payment system.",
    },
  ]

  return (
    <section className="w-full py-4 bg-[#F9FBFC]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ Section */}
        <div className="mb-16">
          <h3 className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-12">
            Frequently Asked Questions
          </h3>
          
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                <div className="p-4 sm:p-6 lg:p-8">
                  <h4 className="font-bold text-slate-900 mb-2 sm:mb-3 text-lg sm:text-xl">
                    {faq.question}
                  </h4>
                  
                  <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}