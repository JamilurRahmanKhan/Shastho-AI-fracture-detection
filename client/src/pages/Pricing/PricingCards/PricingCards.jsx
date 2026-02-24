/**
 * Frontend page: PricingCards
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// "use client"

// import { useState } from "react"
// import { Check, Crown, Brain, Zap, Shield, Headphones, Sparkles, Star, Target } from "lucide-react"

// export default function PricingCards() {
//   const [isAnnual, setIsAnnual] = useState(false)

//   // Static data for pricing plans
//   const plans = [
//     {
//       name: "Free",
//       description: "Perfect for trying out our AI diagnosis platform",
//       price: 0,
//       annualPrice: 0,
//       features: [
//         "5 AI analyses per month",
//         "Basic chat support",
//         "Standard response time",
//         "Access to medical store",
//         "Basic health reports",
//         "Email notifications",
//       ],
//       limitations: ["Limited query history", "No priority support", "Standard AI model"],
//       popular: false,
//       cta: "Get Started Free",
//       gradient: "from-slate-600 to-slate-700",
//       icon: Brain,
//     },
//     {
//       name: "Premium",
//       description: "Unlimited access to advanced AI healthcare",
//       price: 29.99,
//       annualPrice: 299.99,
//       features: [
//         "Unlimited AI analyses",
//         "Priority chat support",
//         "Advanced AI models",
//         "Detailed medical reports",
//         "Complete analysis history",
//         "Prescription recommendations",
//         "Health trend tracking",
//         "Export reports (PDF)",
//         "Email notifications",
//         "24/7 customer support",
//         "API access",
//         "Custom integrations",
//       ],
//       limitations: [],
//       popular: true,
//       cta: "Upgrade to Premium",
//       gradient: "from-blue-600 to-indigo-600",
//       icon: Crown,
//     },
//     {
//       name: "Professional",
//       description: "For healthcare professionals and clinics",
//       price: 99.99,
//       annualPrice: 999.99,
//       features: [
//         "Everything in Premium",
//         "Multi-user accounts (up to 10)",
//         "Advanced API access",
//         "Custom integrations",
//         "Bulk analysis tools",
//         "Advanced analytics dashboard",
//         "White-label options",
//         "Dedicated account manager",
//         "Custom AI model training",
//         "HIPAA compliance tools",
//         "Priority phone support",
//         "Custom reporting",
//       ],
//       limitations: [],
//       popular: false,
//       cta: "Contact Sales",
//       gradient: "from-purple-600 to-pink-600",
//       icon: Target,
//     },
//   ]

//   // Static data for features
//   const features = [
//     {
//       icon: Zap,
//       title: "Lightning Fast",
//       description: "Get AI analysis results in seconds, not minutes",
//       gradient: "from-yellow-500 to-orange-500",
//     },
//     {
//       icon: Shield,
//       title: "Secure & Private",
//       description: "Your medical data is encrypted and HIPAA compliant",
//       gradient: "from-emerald-500 to-teal-500",
//     },
//     {
//       icon: Brain,
//       title: "Advanced AI",
//       description: "State-of-the-art models with 94% accuracy rate",
//       gradient: "from-purple-500 to-pink-500",
//     },
//     {
//       icon: Headphones,
//       title: "24/7 Support",
//       description: "Get help whenever you need it from our expert team",
//       gradient: "from-blue-500 to-indigo-500",
//     },
//   ]

//   // Static data for FAQs
//   const faqs = [
//     {
//       question: "Can I cancel my subscription anytime?",
//       answer: "Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.",
//     },
//     {
//       question: "Is my medical data secure?",
//       answer: "Absolutely. We use enterprise-grade encryption and are fully HIPAA compliant. Your medical data is never shared with third parties and is stored with the highest security standards.",
//     },
//     {
//       question: "How accurate is the AI diagnosis?",
//       answer: "Our AI models achieve 94% accuracy in bone fracture detection using advanced Swin Transformer V2 technology. However, AI results should always be confirmed by a qualified healthcare professional.",
//     },
//     {
//       question: "Do you offer refunds?",
//       answer: "We offer a 30-day money-back guarantee for all premium subscriptions. If you're not satisfied with our service, contact us for a full refund.",
//     },
//     {
//       question: "What payment methods do you accept?",
//       answer: "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our encrypted payment system.",
//     },
//   ]

//   // Handle upgrade button clicks
//   const handleUpgrade = (planName) => {
//     if (planName === "Free") {
//       window.location.href = "/signup"
//     } else if (planName === "Professional") {
//       window.location.href = "mailto:sales@shasthoai.com"
//     } else {
//       // For Premium plan - static implementation for now
//       alert("Redirecting to secure payment...")
//     }
//   }

//   return (
//     <section className="w-full py-20 bg-[#F9FBFC]">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header Section */}
//         <div className="text-center mb-16">
//           <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/50 px-4 py-2 text-sm font-semibold shadow-sm sm:px-6 sm:py-3 sm:text-base rounded-full">
//             <Sparkles className="w-4 h-4 mr-2" />
//             Flexible Pricing Plans
//           </div>
          
//           <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
//             Choose Your Healthcare Plan
//           </h2>
          
//           <p className="text-lg sm:text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed px-4">
//             Start with our free plan and upgrade as your needs grow. All plans include access to our advanced 
//             AI-powered diagnosis system with medical-grade accuracy.
//           </p>

//           {/* Billing Toggle */}
//           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-16">
//             <div className="flex items-center gap-4 sm:gap-6">
//               <span className={`text-base sm:text-lg font-semibold ${!isAnnual ? "text-slate-900" : "text-slate-500"}`}>
//                 Monthly
//               </span>
              
//               {/* Custom Switch */}
//               <button
//                 type="button"
//                 role="switch"
//                 aria-checked={isAnnual}
//                 onClick={() => setIsAnnual(!isAnnual)}
//                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
//                   isAnnual ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-300'
//                 }`}
//               >
//                 <span
//                   className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                     isAnnual ? 'translate-x-6' : 'translate-x-1'
//                   }`}
//                 />
//               </button>
              
//               <span className={`text-base sm:text-lg font-semibold ${isAnnual ? "text-slate-900" : "text-slate-500"}`}>
//                 Annual
//               </span>
//             </div>
            
//             <div className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200 px-3 py-1 sm:px-4 sm:py-2 shadow-sm rounded-full text-sm font-medium">
//               <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
//               Save 17%
//             </div>
//           </div>
//         </div>

//         {/* Pricing Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto my-16">
//           {plans.map((plan) => (
//             <div
//               key={plan.name}
//               className={`relative border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-2xl
//                 ${plan.popular ? "ring-2 ring-blue-500 scale-105 md:scale-110 z-10" : ""}
//                 flex flex-col h-full`}
//             >
//               {plan.popular && (
//                 <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
//                   <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 text-xs sm:text-sm font-bold shadow-lg rounded-full">
//                     <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline" />
//                     Most Popular
//                   </div>
//                 </div>
//               )}

//               <div className="text-center pb-6 pt-12 sm:pt-14 flex-grow-0 px-6">
//                 <div
//                   className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}
//                 >
//                   <plan.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
//                 </div>
                
//                 <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">
//                   {plan.name}
//                 </h3>
                
//                 <p className="text-slate-600 text-base sm:text-lg leading-relaxed px-2">
//                   {plan.description}
//                 </p>
                
//                 <div className="mt-6 sm:mt-8">
//                   <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
//                     ${isAnnual ? plan.annualPrice : plan.price}
//                     {plan.price > 0 && (
//                       <span className="text-lg sm:text-xl font-normal text-slate-500">
//                         /{isAnnual ? "year" : "month"}
//                       </span>
//                     )}
//                   </div>
                  
//                   {isAnnual && plan.price > 0 && (
//                     <div className="text-sm text-slate-500 mt-2 font-medium">
//                       ${(plan.annualPrice / 12).toFixed(2)}/month billed annually
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="space-y-6 px-4 sm:px-6 pb-6 sm:pb-8 flex-grow">
//                 <div>
//                   <h4 className="font-bold text-slate-900 mb-4 text-base sm:text-lg">Features included:</h4>
//                   <ul className="space-y-2 sm:space-y-3">
//                     {plan.features.map((feature, index) => (
//                       <li key={index} className="flex items-start">
//                         <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
//                         <span className="text-sm sm:text-base text-slate-600 leading-relaxed">{feature}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {plan.limitations.length > 0 && (
//                   <div>
//                     <h4 className="font-bold text-slate-900 mb-4 text-base sm:text-lg">Limitations:</h4>
//                     <ul className="space-y-2 sm:space-y-3">
//                       {plan.limitations.map((limitation, index) => (
//                         <li key={index} className="flex items-start">
//                           <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-300 rounded mr-3 mt-0.5 flex-shrink-0" />
//                           <span className="text-sm sm:text-base text-slate-500 leading-relaxed">{limitation}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}

//                 <div className="pt-4">
//                   <button
//                     className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl text-white
//                       ${plan.popular
//                         ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
//                         : "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
//                       }`}
//                     onClick={() => handleUpgrade(plan.name)}
//                   >
//                     {plan.popular && <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />}
//                     {plan.cta}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Features Comparison */}
//         <div className="mb-16">
//           <h3 className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-12">
//             Why Choose ShasthoAI Premium?
//           </h3>
          
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
//             {features.map((feature, index) => (
//               <div
//                 key={index}
//                 className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 rounded-2xl"
//               >
//                 <div className="p-4 sm:p-6">
//                   <div
//                     className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md`}
//                   >
//                     <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
//                   </div>
                  
//                   <h4 className="font-bold text-slate-900 mb-2 text-base sm:text-lg">{feature.title}</h4>
                  
//                   <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
//                     {feature.description}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* FAQ Section */}
//         <div className="mb-16">
//           <h3 className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-12">
//             Frequently Asked Questions
//           </h3>
          
//           <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
//             {faqs.map((faq, index) => (
//               <div
//                 key={index}
//                 className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 rounded-2xl"
//               >
//                 <div className="p-4 sm:p-6 lg:p-8">
//                   <h4 className="font-bold text-slate-900 mb-2 sm:mb-3 text-lg sm:text-xl">
//                     {faq.question}
//                   </h4>
                  
//                   <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
//                     {faq.answer}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* CTA Section */}
//         <div className="text-center">
//           <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white border-0 shadow-2xl relative overflow-hidden rounded-2xl">
//             <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-700/90"></div>
            
//             <div className="p-8 sm:p-12 lg:p-16 relative">
//               <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
//                 Ready to Experience Advanced AI Healthcare?
//               </h3>
              
//               <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
//                 Join thousands of healthcare professionals and patients who trust ShasthoAI for accurate, instant
//                 medical diagnosis and comprehensive healthcare solutions.
//               </p>
              
//               <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
//                 <button
//                   className="bg-white text-blue-600 hover:bg-blue-50 px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl"
//                   onClick={() => window.location.href = "/signup"}
//                 >
//                   <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 inline" />
//                   Start Free Trial
//                 </button>
                
//                 <button
//                   className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 rounded-xl bg-transparent"
//                   onClick={() => window.location.href = "/chat"}
//                 >
//                   <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 inline" />
//                   Try Demo
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }


"use client"

import { useMemo, useState } from "react"
import { Check, Crown, Brain, Sparkles, Star, Target } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { api } from "@/services/api"

export default function PricingCards() {
  const [isAnnual, setIsAnnual] = useState(false)
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const sub = useSubscription()
  const [actionBusy, setActionBusy] = useState(false)

  const planCodeByName = useMemo(
    () => ({
      Premium: "RECOVERY_6W",
      Professional: "RECOVERY_PLUS_12W",
    }),
    []
  )

  // Static data for pricing plans
  const plans = [
    {
      name: "Free",
      description: "Perfect for trying out our AI diagnosis platform",
      price: 0,
      annualPrice: 0,
      features: [
        "5 AI analyses per month",
        "Basic chat support",
        "Standard response time",
        "Access to medical store",
        "Basic health reports",
        "Email notifications",
      ],
      limitations: ["Limited query history", "No priority support", "Standard AI model"],
      popular: false,
      cta: "Get Started Free",
      gradient: "from-slate-600 to-slate-700",
      icon: Brain,
    },
    {
      name: "Premium",
      description: "Unlimited access to advanced AI healthcare",
      price: 29.99,
      annualPrice: 299.99,
      features: [
        "Unlimited AI analyses",
        "Priority chat support",
        "Advanced AI models",
        "Detailed medical reports",
        "Complete analysis history",
        "Prescription recommendations",
        "Health trend tracking",
        "Export reports (PDF)",
        "Email notifications",
        "24/7 customer support",
        "API access",
        "Custom integrations",
      ],
      limitations: [],
      popular: true,
      cta: "Upgrade to Premium",
      gradient: "from-blue-600 to-indigo-600",
      icon: Crown,
    },
    {
      name: "Professional",
      description: "For healthcare professionals and clinics",
      price: 99.99,
      annualPrice: 999.99,
      features: [
        "Everything in Premium",
        "Multi-user accounts (up to 10)",
        "Advanced API access",
        "Custom integrations",
        "Bulk analysis tools",
        "Advanced analytics dashboard",
        "White-label options",
        "Dedicated account manager",
        "Custom AI model training",
        "HIPAA compliance tools",
        "Priority phone support",
        "Custom reporting",
      ],
      limitations: [],
      popular: false,
      cta: "Contact Sales",
      gradient: "from-purple-600 to-pink-600",
      icon: Target,
    },
  ]

  // Handle upgrade button clicks
  const handleUpgrade = async (plan) => {
    // If user isn't logged in, keep the old behavior (go to sign up)
    if (!authUser?.uid) {
      navigate("/signup")
      return
    }

    // No-switching rule: only one active plan/trial per user
    try {
      const snap = sub?.snapshot
      const nowMs = Date.now()
      const activePlan = Boolean(snap?.activePlan?.status === 'active' && snap?.activePlan?.endAt && new Date(snap.activePlan.endAt).getTime() > nowMs)
      const activeTrial = Boolean(sub?.trial?.status === 'active' && sub?.trial?.trialEndAt && new Date(sub.trial.trialEndAt).getTime() > nowMs)
      if (activePlan || activeTrial) {
        alert('You already have an active plan/trial. You can activate a new one after the current one ends.')
        return
      }
    } catch {
      // If anything goes wrong, fall back to server-side enforcement
    }

    const amount = isAnnual ? plan.annualPrice : plan.price

    // Free button = activate FREE_ThreeDays (trial) when logged-in
    if (plan.name === "Free") {
      setActionBusy(true)
      try {
        const resp = await api.activateFreeThreeDays()
        // Keep subscription context in sync
        const trialEpisodeId = resp?.episode?.id || resp?.episode?._id || resp?.trial?.episodeId || null
        if (trialEpisodeId && sub?.selectEpisode) await sub.selectEpisode(trialEpisodeId)
        else if (sub?.refresh) await sub.refresh()
        alert("Free trial activated. You can now upload an X-ray in AI Chat.")
        navigate("/chat")
      } catch (e) {
        alert(e?.message || "Failed to activate free trial.")
      } finally {
        setActionBusy(false)
      }
      return
    }

    // Premium / Professional = buy an episode plan (no payment gateway yet)
    const planCode = planCodeByName[plan.name]
    if (!planCode) {
      alert("This plan is not available yet.")
      return
    }

    setActionBusy(true)
    try {
      const episodeId = (await sub?.ensureActiveEpisode?.()) || sub?.activeEpisodeId || null
      await api.purchaseEpisodePlan({
        planCode,
        episodeId: episodeId || undefined,
        amount,
        currency: "USD",
        provider: "pricing_page",
      })
      if (episodeId && sub?.refresh) await sub.refresh(episodeId)
      else if (sub?.refresh) await sub.refresh()
      alert(`${plan.name} plan activated. You can now use your plan features.`)
      navigate("/chat")
    } catch (e) {
      alert(e?.message || "Failed to activate plan.")
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <section className="w-full py-20 bg-[#F9FBFC]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/50 px-4 py-2 text-sm font-semibold shadow-sm sm:px-6 sm:py-3 sm:text-base rounded-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Flexible Pricing Plans
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
            Choose Your Healthcare Plan
          </h2>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-16 max-w-3xl mx-auto leading-relaxed px-4">
            Start with our free plan and upgrade as your needs grow. All plans include access to our advanced 
            AI-powered diagnosis system with medical-grade accuracy.
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-20">
            <div className="flex items-center gap-4 sm:gap-6">
              <span className={`text-base sm:text-lg font-semibold ${!isAnnual ? "text-slate-900" : "text-slate-500"}`}>
                Monthly
              </span>
              
              {/* Custom Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isAnnual}
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isAnnual ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              
              <span className={`text-base sm:text-lg font-semibold ${isAnnual ? "text-slate-900" : "text-slate-500"}`}>
                Annual
              </span>
            </div>
            
            <div className="inline-flex items-center bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200 px-3 py-1 sm:px-4 sm:py-2 shadow-sm rounded-full text-sm font-medium">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Save 17%
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto my-24">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-2xl
                ${plan.popular ? "ring-2 ring-blue-500 scale-105 md:scale-110 z-10" : ""}
                flex flex-col h-full`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 text-xs sm:text-sm font-bold shadow-lg rounded-full">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center pb-6 pt-12 sm:pt-14 flex-grow-0 px-6">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}
                >
                  <plan.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">
                  {plan.name}
                </h3>
                
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed px-2">
                  {plan.description}
                </p>
                
                <div className="mt-6 sm:mt-8">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    ${isAnnual ? plan.annualPrice : plan.price}
                    {plan.price > 0 && (
                      <span className="text-lg sm:text-xl font-normal text-slate-500">
                        /{isAnnual ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  
                  {isAnnual && plan.price > 0 && (
                    <div className="text-sm text-slate-500 mt-2 font-medium">
                      ${(plan.annualPrice / 12).toFixed(2)}/month billed annually
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 px-4 sm:px-6 pb-6 sm:pb-8 flex-grow">
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 text-base sm:text-lg">Features included:</h4>
                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-slate-600 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 mb-4 text-base sm:text-lg">Limitations:</h4>
                    <ul className="space-y-2 sm:space-y-3">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-300 rounded mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm sm:text-base text-slate-500 leading-relaxed">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl text-white
                      ${plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        : "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
                      }`}
                    disabled={actionBusy}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {plan.popular && <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />}
                    {actionBusy ? "Please wait..." : plan.cta}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}