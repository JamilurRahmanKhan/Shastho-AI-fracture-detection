// "use client"

// import { useMemo, useState } from "react"
// import { Check, Crown, Brain, Sparkles, Star, Target } from "lucide-react"
// import { useNavigate } from "react-router-dom"
// import { useAuth } from "@/contexts/AuthContext"
// import { useSubscription } from "@/contexts/SubscriptionContext"
// import { api } from "@/services/api"

// export default function PricingCards() {
//   const [isAnnual, setIsAnnual] = useState(false)
//   const navigate = useNavigate()
//   const { authUser } = useAuth()
//   const sub = useSubscription()
//   const [actionBusy, setActionBusy] = useState(false)

//   const planCodeByName = useMemo(
//     () => ({
//       Premium: "RECOVERY_6W",
//       Professional: "RECOVERY_PLUS_12W",
//     }),
//     []
//   )

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

//   // Handle upgrade button clicks
//   const handleUpgrade = async (plan) => {
//     // If user isn't logged in, keep the old behavior (go to sign up)
//     if (!authUser?.uid) {
//       navigate("/signup")
//       return
//     }

//     // No-switching rule: only one active plan/trial per user
//     try {
//       const snap = sub?.snapshot
//       const nowMs = Date.now()
//       const activePlan = Boolean(snap?.activePlan?.status === 'active' && snap?.activePlan?.endAt && new Date(snap.activePlan.endAt).getTime() > nowMs)
//       const activeTrial = Boolean(sub?.trial?.status === 'active' && sub?.trial?.trialEndAt && new Date(sub.trial.trialEndAt).getTime() > nowMs)
//       if (activePlan || activeTrial) {
//         alert('You already have an active plan/trial. You can activate a new one after the current one ends.')
//         return
//       }
//     } catch {
//       // If anything goes wrong, fall back to server-side enforcement
//     }

//     const amount = isAnnual ? plan.annualPrice : plan.price

//     // Free button = activate FREE_ThreeDays (trial) when logged-in
//     if (plan.name === "Free") {
//       setActionBusy(true)
//       try {
//         const resp = await api.activateFreeThreeDays()
//         // Keep subscription context in sync
//         const trialEpisodeId = resp?.episode?.id || resp?.episode?._id || resp?.trial?.episodeId || null
//         if (trialEpisodeId && sub?.selectEpisode) await sub.selectEpisode(trialEpisodeId)
//         else if (sub?.refresh) await sub.refresh()
//         alert("Free trial activated. You can now upload an X-ray in AI Chat.")
//         navigate("/chat")
//       } catch (e) {
//         alert(e?.message || "Failed to activate free trial.")
//       } finally {
//         setActionBusy(false)
//       }
//       return
//     }

//     // Premium / Professional = buy an episode plan (no payment gateway yet)
//     const planCode = planCodeByName[plan.name]
//     if (!planCode) {
//       alert("This plan is not available yet.")
//       return
//     }

//     setActionBusy(true)
//     try {
//       const episodeId = (await sub?.ensureActiveEpisode?.()) || sub?.activeEpisodeId || null
//       await api.purchaseEpisodePlan({
//         planCode,
//         episodeId: episodeId || undefined,
//         amount,
//         currency: "USD",
//         provider: "pricing_page",
//       })
//       if (episodeId && sub?.refresh) await sub.refresh(episodeId)
//       else if (sub?.refresh) await sub.refresh()
//       alert(`${plan.name} plan activated. You can now use your plan features.`)
//       navigate("/chat")
//     } catch (e) {
//       alert(e?.message || "Failed to activate plan.")
//     } finally {
//       setActionBusy(false)
//     }
//   }

//   return (
//     <section className="w-full py-20 bg-[#F9FBFC]">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header Section */}
//         <div className="text-center mb-20">
//           <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/50 px-4 py-2 text-sm font-semibold shadow-sm sm:px-6 sm:py-3 sm:text-base rounded-full">
//             <Sparkles className="w-4 h-4 mr-2" />
//             Flexible Pricing Plans
//           </div>
          
//           <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
//             Choose Your Healthcare Plan
//           </h2>
          
//           <p className="text-lg sm:text-xl text-slate-600 mb-16 max-w-3xl mx-auto leading-relaxed px-4">
//             Start with our free plan and upgrade as your needs grow. All plans include access to our advanced 
//             AI-powered diagnosis system with medical-grade accuracy.
//           </p>

//           {/* Billing Toggle */}
//           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-20">
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
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto my-24">
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
//                     disabled={actionBusy}
//                     onClick={() => handleUpgrade(plan)}
//                   >
//                     {plan.popular && <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />}
//                     {actionBusy ? "Please wait..." : plan.cta}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }


/**
 * Frontend page: PricingCards
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Pricing UI aligned to the backend subscription catalog.
 *
 * Notes:
 * - The backend is the source of truth for entitlements/limits.
 * - Backend endpoint: GET /api/subscriptions/plans (prices intentionally omitted)
 * - Backend endpoint: GET /api/subscriptions/me (current user's active plan/trial snapshot)
 */

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  Crown,
  FileText,
  MessageSquareText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { api } from "@/services/api"

/**
 * UI-only labels (friendly naming). Entitlements always come from backend.
 */
const UI_META_BY_CODE = {
  FREE_BASE: {
    name: "Free",
    description: "Basic access for exploring the platform",
    badge: null,
    icon: ShieldCheck,
  },
  FREE_THREEDAYS: {
    name: "Free Trial",
    description: "Try premium features for 72 hours",
    badge: "Trial",
    icon: Timer,
  },
  ACCIDENT_PASS_7D: {
    name: "Accident Pass",
    description: "Short-term support for an acute injury (7 days)",
    badge: null,
    icon: Crown,
  },
  RECOVERY_6W: {
    name: "Recovery",
    description: "Full recovery support for 6 weeks",
    badge: "Most popular",
    icon: Crown,
  },
  RECOVERY_PLUS_12W: {
    name: "Recovery Plus",
    description: "Extended recovery support for 12 weeks",
    badge: null,
    icon: Crown,
  },
}

const CARD_ORDER = ["FREE_BASE", "FREE_THREEDAYS", "ACCIDENT_PASS_7D", "RECOVERY_6W", "RECOVERY_PLUS_12W"]

function formatCap(n) {
  // In your backend conventions, some caps use 0 to represent "unlimited".
  if (n === 0) return "Unlimited"
  if (typeof n !== "number") return "—"
  return String(n)
}

function buildFeatureList(entitlements) {
  const ent = entitlements || {}

  const items = [
    { key: "scanCredits", icon: ScanLine, label: "X-ray AI scans" },
    { key: "pdfExports", icon: FileText, label: "PDF exports" },
    { key: "shareLinks", icon: FileText, label: "Share links" },
    { key: "scanContextChat", icon: MessageSquareText, label: "Scan chat messages" },
    { key: "generalChat", icon: MessageSquareText, label: "General chat messages" },
    { key: "reportsCap", icon: FileText, label: "Reports cap" },
    { key: "recordsCap", icon: FileText, label: "Medical records cap" },
    { key: "activeMedsCap", icon: ShieldCheck, label: "Active medications cap" },
    { key: "checkinsCap", icon: ShieldCheck, label: "Daily check-ins" },
  ]

  return items
    .map((it) => {
      const value = ent[it.key]
      const safeValue = typeof value === "undefined" ? 0 : value
      return {
        icon: it.icon,
        text: `${it.label}: ${formatCap(safeValue)}`,
        raw: safeValue,
      }
    })
    .filter((row) => {
      const isZero = row.raw === 0
      if (!isZero) return true
      return [
        "X-ray AI scans: Unlimited",
        "X-ray AI scans: 0",
        "General chat messages: Unlimited",
        "General chat messages: 0",
        "Reports cap: Unlimited",
        "Reports cap: 0",
      ].includes(row.text)
    })
}

export default function PricingCards() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const sub = useSubscription()

  const [busyCode, setBusyCode] = useState(null)
  const [remote, setRemote] = useState({ loading: true, error: "", trial: null, plans: [] })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const resp = await api.getSubscriptionPlans()
        if (!alive) return
        setRemote({ loading: false, error: "", trial: resp?.trial || null, plans: resp?.plans || [] })
      } catch (e) {
        if (!alive) return
        setRemote({ loading: false, error: e?.message || "Failed to load plans", trial: null, plans: [] })
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const nowMs = Date.now()

  const activePlan = useMemo(() => {
    const p = sub?.snapshot?.activePlan
    if (!p || p.status !== "active") return null
    if (!p.endAt) return p
    return new Date(p.endAt).getTime() > nowMs ? p : null
  }, [sub?.snapshot?.activePlan, nowMs])

  const activeTrial = useMemo(() => {
    const t = sub?.trial
    if (!t || t.status !== "active") return null
    if (!t.trialEndAt) return t
    return new Date(t.trialEndAt).getTime() > nowMs ? t : null
  }, [sub?.trial, nowMs])

  const hasAnyActive = Boolean(activePlan || activeTrial)

  const cards = useMemo(() => {
    const out = []

    for (const p of remote.plans || []) {
      const code = p.planCode || p.code || ""
      const meta = UI_META_BY_CODE[code] || {}
      out.push({
        kind: "plan",
        code,
        name: meta.name || code,
        description: meta.description || p.description || "",
        badge: meta.badge || null,
        icon: meta.icon || Crown,
        durationDays: p.durationDays || 0,
        entitlements: p.entitlements || {},
      })
    }

    if (remote.trial) {
      const trialCode = remote.trial.code || "FREE_THREEDAYS"
      const meta = UI_META_BY_CODE[trialCode] || UI_META_BY_CODE.FREE_THREEDAYS
      out.push({
        kind: "trial",
        code: trialCode,
        name: meta.name || "Free Trial",
        description: meta.description || "",
        badge: meta.badge || "Trial",
        icon: meta.icon || Timer,
        durationHours: remote.trial.durationHours || 72,
        entitlements: remote.trial.entitlements || {},
      })
    }

    out.sort((a, b) => CARD_ORDER.indexOf(a.code) - CARD_ORDER.indexOf(b.code))
    return out
  }, [remote.plans, remote.trial])

  const handleActivate = async (card) => {
    if (!authUser?.uid) {
      navigate("/signup")
      return
    }

    if (hasAnyActive) {
      alert("You already have an active plan/trial. You can activate a new one after the current one ends.")
      return
    }

    setBusyCode(card.code)
    try {
      if (card.kind === "trial") {
        const resp = await api.activateFreeThreeDays()
        const trialEpisodeId = resp?.episode?.id || resp?.episode?._id || resp?.trial?.episodeId || null
        if (trialEpisodeId && sub?.selectEpisode) await sub.selectEpisode(trialEpisodeId)
        else if (sub?.refresh) await sub.refresh()
        alert("Free trial activated. You can now upload an X-ray in AI Chat.")
        navigate("/chat")
        return
      }

      const planCode = card.code
      const episodeId = (await sub?.ensureActiveEpisode?.()) || sub?.activeEpisodeId || null
      await api.purchaseEpisodePlan({
        planCode,
        episodeId: episodeId || undefined,
        amount: 0,
        currency: "USD",
        provider: "pricing_page",
      })

      if (episodeId && sub?.refresh) await sub.refresh(episodeId)
      else if (sub?.refresh) await sub.refresh()

      alert(`${card.name} activated. You can now use the plan features.`)
      navigate("/chat")
    } catch (e) {
      alert(e?.message || "Failed to activate plan.")
    } finally {
      setBusyCode(null)
    }
  }

  return (
    <section className="w-full py-20 bg-[#F9FBFC]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200/50 px-4 py-2 text-sm font-semibold shadow-sm sm:px-6 sm:py-3 sm:text-base rounded-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Plans & Limits (Real)
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
            Choose a Plan That Matches Your Usage
          </h2>

        

          {remote.loading ? (
            <div className="mt-10 text-slate-600">Loading plans…</div>
          ) : remote.error ? (
            <div className="mt-10 text-red-600">{remote.error}</div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card) => {
            const Icon = card.icon || Crown
            const isActive =
              (activePlan && card.kind === "plan" && activePlan.planCode === card.code) || (activeTrial && card.kind === "trial")

            const durationText =
              card.kind === "trial"
                ? `${card.durationHours || 72} hours`
                : card.durationDays
                ? `${card.durationDays} days`
                : "No expiry"

            const features = buildFeatureList(card.entitlements)

            return (
              <div
                key={`${card.kind}:${card.code}`}
                className={`relative rounded-3xl border bg-white shadow-sm transition hover:shadow-md ${
                  card.badge === "Most popular" ? "border-blue-300 ring-2 ring-blue-200" : "border-slate-200"
                }`}
              >
                {card.badge ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold shadow-sm ${
                        card.badge === "Most popular" ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {card.badge}
                    </span>
                  </div>
                ) : null}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900/5 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900">{card.name}</div>
                      <div className="text-sm text-slate-600">{durationText}</div>
                    </div>
                  </div>

                  <p className="text-slate-600 mb-6">{card.description}</p>

                  <div className="space-y-3 mb-8">
                    {features.slice(0, 7).map((f, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-sm text-slate-700">{f.text}</div>
                      </div>
                    ))}
                    {features.length > 7 ? (
                      <div className="text-xs text-slate-500 pt-2">+ {features.length - 7} more limits/caps</div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={busyCode === card.code || (hasAnyActive && !isActive)}
                    onClick={() => {
                      if (card.code === "FREE_BASE") {
                        if (!authUser?.uid) navigate("/signup")
                        else navigate("/dashboard")
                        return
                      }
                      if (isActive) {
                        navigate("/dashboard")
                        return
                      }
                      handleActivate(card)
                    }}
                    className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
                      isActive
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : card.badge === "Most popular"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {busyCode === card.code
                      ? "Working…"
                      : card.code === "FREE_BASE"
                      ? authUser?.uid
                        ? "Go to Dashboard"
                        : "Get Started"
                      : isActive
                      ? "Current Plan"
                      : card.kind === "trial"
                      ? "Activate Free Trial"
                      : "Activate Plan"}
                  </button>

                  {hasAnyActive && !isActive ? (
                    <div className="mt-3 text-xs text-slate-500">
                      Another plan/trial is active. Activation is disabled until it ends.
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}