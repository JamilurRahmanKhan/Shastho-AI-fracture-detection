/**
 * Frontend page: Settings
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// "use client"

// import { useEffect, useMemo, useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { api } from "@/services/api"

// const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// function normalizeSettings(doc) {
//   const d = doc || {}
//   const profile = d.profile || {}
//   const delivery = d.delivery || {}
//   const compliance = d.compliance || {}

//   let operatingHours = Array.isArray(delivery.operatingHours) ? delivery.operatingHours : []
//   const byDay = new Map(operatingHours.map((x) => [x.day, x]))
//   operatingHours = DAYS.map((day) => {
//     const x = byDay.get(day) || {}
//     return {
//       day,
//       isClosed: !!x.isClosed,
//       open: x.open || "09:00",
//       close: x.close || "21:00",
//     }
//   })

//   return {
//     profile: {
//       pharmacyName: profile.pharmacyName || "",
//       licenseNumber: profile.licenseNumber || "",
//       email: profile.email || "",
//       phone: profile.phone || "",
//       fullAddress: profile.fullAddress || "",
//       city: profile.city || "",
//       postalCode: profile.postalCode || "",
//     },
//     delivery: {
//       deliveryZonesText: Array.isArray(delivery.deliveryZones) ? delivery.deliveryZones.join(", ") : "",
//       deliveryFee: Number.isFinite(delivery.deliveryFee) ? delivery.deliveryFee : 0,
//       freeDeliveryThreshold: Number.isFinite(delivery.freeDeliveryThreshold) ? delivery.freeDeliveryThreshold : 0,
//       minimumOrderValue: Number.isFinite(delivery.minimumOrderValue) ? delivery.minimumOrderValue : 0,
//       operatingHours,
//     },
//     compliance: {
//       verificationStatus: compliance.verificationStatus || "unverified",
//       licenseDocumentFilename: compliance.licenseDocumentFilename || "",
//       reviewerNote: compliance.reviewerNote || "",
//     },
//   }
// }

// const TABS = [
//   { key: "profile", label: "Profile" },
//   { key: "hours", label: "Hours & Zones" },
//   { key: "compliance", label: "Compliance" },
//   { key: "staff", label: "Staff & Roles" },
// ]

// function StatusBadge({ status }) {
//   const badgeClasses = {
//     verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
//     rejected: "bg-red-100 text-red-800 border-red-200",
//     pending: "bg-amber-100 text-amber-800 border-amber-200",
//     unverified: "bg-slate-100 text-slate-700 border-slate-200",
//   }

//   const cls = badgeClasses[status] || badgeClasses.unverified
//   return (
//     <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${cls}`}>
//       {status}
//     </span>
//   )
// }

// export default function Settings() {
//   const navigate = useNavigate()
//   const [activeTab, setActiveTab] = useState("profile")
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [error, setError] = useState("")
//   const [success, setSuccess] = useState("")

//   const [form, setForm] = useState(() => normalizeSettings(null))
//   const [licenseFile, setLicenseFile] = useState(null)

//   const zonesArr = useMemo(() => {
//     return form.delivery.deliveryZonesText
//       .split(",")
//       .map((s) => s.trim())
//       .filter(Boolean)
//   }, [form.delivery.deliveryZonesText])

//   const disabled = loading || saving

//   const inputClass =
//     "input input-bordered w-full bg-white text-slate-900 placeholder-slate-400 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//   const textareaClass =
//     "textarea textarea-bordered w-full bg-white text-slate-900 placeholder-slate-400 border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"

//   async function load() {
//     setLoading(true)
//     setError("")
//     setSuccess("")
//     try {
//       const doc = await api.getPharmacySettings()
//       setForm(normalizeSettings(doc))
//     } catch (e) {
//       setError(e?.message || "Failed to load settings")
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     load()
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   async function save() {
//     setSaving(true)
//     setError("")
//     setSuccess("")
//     try {
//       await api.updatePharmacySettings({
//         profile: form.profile,
//         delivery: {
//           deliveryZones: zonesArr,
//           deliveryFee: Number(form.delivery.deliveryFee) || 0,
//           freeDeliveryThreshold: Number(form.delivery.freeDeliveryThreshold) || 0,
//           minimumOrderValue: Number(form.delivery.minimumOrderValue) || 0,
//           operatingHours: form.delivery.operatingHours,
//         },
//       })
//       setSuccess("Settings saved successfully.")
//       await load()
//     } catch (e) {
//       setError(e?.message || "Failed to save settings")
//     } finally {
//       setSaving(false)
//     }
//   }

//   async function uploadLicense() {
//     if (!licenseFile) return
//     setSaving(true)
//     setError("")
//     setSuccess("")
//     try {
//       await api.uploadPharmacyLicenseDocument(licenseFile)
//       setLicenseFile(null)
//       setSuccess("License document uploaded (status: pending).")
//       await load()
//     } catch (e) {
//       setError(e?.message || "Failed to upload license document")
//     } finally {
//       setSaving(false)
//     }
//   }

//   async function viewLicense() {
//     try {
//       const { blob, contentType } = await api.downloadPharmacyLicenseDocument()
//       const url = URL.createObjectURL(new Blob([blob], { type: contentType || blob.type }))
//       window.open(url, "_blank", "noopener,noreferrer")
//       setTimeout(() => URL.revokeObjectURL(url), 60_000)
//     } catch (e) {
//       setError(e?.message || "Could not open license document")
//     }
//   }

//   const goBackToPanel = () => {
//     // Adjust this route to match your pharmacy panel landing route
//     // Examples: "/pharmacy/dashboard" or "/pharmacy"
//     navigate("/pharmacy/dashboard")
//   }
  
//   return (
//     <div className="w-full min-h-[calc(100vh-64px)] bg-slate-50">
//       <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
//         {/* Back to Pharmacy Panel */}
//         <div className="mb-4">
//           <button
//             type="button"
//             onClick={goBackToPanel}
//             className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
//             title="Back to Pharmacy Panel"
//           >
//             <span className="text-lg leading-none">←</span>
//             Back to Pharmacy Panel
//           </button>
//         </div>

//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-slate-900 mb-2">Pharmacy Settings</h1>
//           <p className="text-slate-600">Manage profile, delivery setup, and compliance. Saved per pharmacy account.</p>
//         </div>

//         {/* Status Section */}
//         <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 bg-white rounded-lg border border-slate-200">
//           <div className="flex items-center gap-3 flex-1">
//             <span className="text-sm font-medium text-slate-700">Verification Status</span>
//             <StatusBadge status={form.compliance.verificationStatus} />
//           </div>
//           <button
//             className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             onClick={load}
//             disabled={disabled}
//             title="Refresh settings"
//           >
//             Refresh
//           </button>
//         </div>

//         {/* Alerts */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
//             <span className="break-words">{error}</span>
//           </div>
//         )}
//         {success && (
//           <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
//             <span className="break-words">{success}</span>
//           </div>
//         )}

//         {/* Main Card */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200">
//           {/* Tabs */}
//           <div className="border-b border-slate-200">
//             <div className="px-6 pt-6">
//               <div className="flex gap-2 overflow-x-auto pb-4">
//                 {TABS.map((t) => (
//                   <button
//                     key={t.key}
//                     type="button"
//                     onClick={() => setActiveTab(t.key)}
//                     disabled={disabled}
//                     className={`px-4 py-2 whitespace-nowrap font-medium text-sm rounded-lg transition-all ${
//                       activeTab === t.key
//                         ? "bg-blue-600 text-white"
//                         : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
//                     } disabled:opacity-50 disabled:cursor-not-allowed`}
//                   >
//                     {t.label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Content */}
//           <div className="p-6">
//             {loading ? (
//               <div className="py-16 text-center">
//                 <div className="inline-flex items-center gap-2 text-slate-600">
//                   <span className="loading loading-spinner loading-md" />
//                   <span>Loading settings...</span>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 {/* PROFILE */}
//                 {activeTab === "profile" && (
//                   <div className="space-y-6">
//                     <div>
//                       <h2 className="text-xl font-semibold text-slate-900 mb-1">Pharmacy Profile</h2>
//                       <p className="text-sm text-slate-600">This information appears on invoices and order slips.</p>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">Pharmacy Name</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           value={form.profile.pharmacyName}
//                           onChange={(e) =>
//                             setForm((p) => ({ ...p, profile: { ...p.profile, pharmacyName: e.target.value } }))
//                           }
//                         />
//                       </div>

//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">License Number</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           value={form.profile.licenseNumber}
//                           onChange={(e) =>
//                             setForm((p) => ({ ...p, profile: { ...p.profile, licenseNumber: e.target.value } }))
//                           }
//                         />
//                       </div>

//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">Email</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           type="email"
//                           value={form.profile.email}
//                           onChange={(e) => setForm((p) => ({ ...p, profile: { ...p.profile, email: e.target.value } }))}
//                         />
//                       </div>

//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">Phone</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           value={form.profile.phone}
//                           onChange={(e) => setForm((p) => ({ ...p, profile: { ...p.profile, phone: e.target.value } }))}
//                         />
//                       </div>

//                       <div className="form-control w-full md:col-span-2">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">Full Address</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           value={form.profile.fullAddress}
//                           onChange={(e) =>
//                             setForm((p) => ({ ...p, profile: { ...p.profile, fullAddress: e.target.value } }))
//                           }
//                         />
//                       </div>

//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">City</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           value={form.profile.city}
//                           onChange={(e) => setForm((p) => ({ ...p, profile: { ...p.profile, city: e.target.value } }))}
//                         />
//                       </div>

//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">Postal Code</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           value={form.profile.postalCode}
//                           onChange={(e) =>
//                             setForm((p) => ({ ...p, profile: { ...p.profile, postalCode: e.target.value } }))
//                           }
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* HOURS & ZONES */}
//                 {activeTab === "hours" && (
//                   <div className="space-y-6">
//                     <div>
//                       <h2 className="text-xl font-semibold text-slate-900 mb-1">Hours & Zones</h2>
//                       <p className="text-sm text-slate-600">
//                         Set delivery rules and operating hours customers can rely on.
//                       </p>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">Delivery Fee (৳)</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           type="number"
//                           min="0"
//                           value={form.delivery.deliveryFee}
//                           onChange={(e) =>
//                             setForm((p) => ({ ...p, delivery: { ...p.delivery, deliveryFee: e.target.value } }))
//                           }
//                         />
//                       </div>

//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">Free Delivery Threshold (৳)</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           type="number"
//                           min="0"
//                           value={form.delivery.freeDeliveryThreshold}
//                           onChange={(e) =>
//                             setForm((p) => ({
//                               ...p,
//                               delivery: { ...p.delivery, freeDeliveryThreshold: e.target.value },
//                             }))
//                           }
//                         />
//                       </div>

//                       <div className="form-control w-full">
//                         <label className="label pb-2">
//                           <span className="label-text font-medium text-slate-700">Minimum Order (৳)</span>
//                         </label>
//                         <input
//                           className={inputClass}
//                           type="number"
//                           min="0"
//                           value={form.delivery.minimumOrderValue}
//                           onChange={(e) =>
//                             setForm((p) => ({ ...p, delivery: { ...p.delivery, minimumOrderValue: e.target.value } }))
//                           }
//                         />
//                       </div>
//                     </div>

//                     <div className="form-control w-full">
//                       <label className="label pb-2">
//                         <span className="label-text font-medium text-slate-700">Delivery Zones</span>
//                       </label>
//                       <textarea
//                         className={textareaClass}
//                         placeholder="e.g., Gulshan, Dhanmondi, Uttara"
//                         rows={3}
//                         value={form.delivery.deliveryZonesText}
//                         onChange={(e) =>
//                           setForm((p) => ({ ...p, delivery: { ...p.delivery, deliveryZonesText: e.target.value } }))
//                         }
//                       />
//                       <span className="text-xs text-slate-500 mt-2">Comma-separated list.</span>
//                     </div>

//                     <div className="border-t pt-6">
//                       <h3 className="font-semibold text-slate-900 mb-4">Operating Hours</h3>

//                       {/* Mobile cards */}
//                       <div className="grid grid-cols-1 md:hidden gap-3">
//                         {form.delivery.operatingHours.map((row, idx) => (
//                           <div key={row.day} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
//                             <div className="flex items-center justify-between mb-4">
//                               <div className="font-medium text-slate-900">{row.day}</div>
//                               <label className="label cursor-pointer gap-2">
//                                 <span className="label-text text-sm text-slate-700">Closed</span>
//                                 <input
//                                   type="checkbox"
//                                   className="toggle toggle-sm toggle-blue"
//                                   checked={row.isClosed}
//                                   onChange={(e) => {
//                                     const checked = e.target.checked
//                                     setForm((p) => {
//                                       const next = [...p.delivery.operatingHours]
//                                       next[idx] = { ...next[idx], isClosed: checked }
//                                       return { ...p, delivery: { ...p.delivery, operatingHours: next } }
//                                     })
//                                   }}
//                                 />
//                               </label>
//                             </div>

//                             <div className="flex items-center gap-2">
//                               <input
//                                 className={`${inputClass} h-10 text-sm`}
//                                 type="time"
//                                 value={row.open}
//                                 disabled={row.isClosed}
//                                 onChange={(e) => {
//                                   const v = e.target.value
//                                   setForm((p) => {
//                                     const next = [...p.delivery.operatingHours]
//                                     next[idx] = { ...next[idx], open: v }
//                                     return { ...p, delivery: { ...p.delivery, operatingHours: next } }
//                                   })
//                                 }}
//                               />
//                               <span className="text-slate-400">–</span>
//                               <input
//                                 className={`${inputClass} h-10 text-sm`}
//                                 type="time"
//                                 value={row.close}
//                                 disabled={row.isClosed}
//                                 onChange={(e) => {
//                                   const v = e.target.value
//                                   setForm((p) => {
//                                     const next = [...p.delivery.operatingHours]
//                                     next[idx] = { ...next[idx], close: v }
//                                     return { ...p, delivery: { ...p.delivery, operatingHours: next } }
//                                   })
//                                 }}
//                               />
//                             </div>
//                           </div>
//                         ))}
//                       </div>

//                       {/* Desktop table */}
//                       <div className="hidden md:block overflow-x-auto">
//                         <table className="w-full">
//                           <thead>
//                             <tr className="border-b border-slate-200">
//                               <th className="text-left py-3 px-3 font-semibold text-slate-700">Day</th>
//                               <th className="text-left py-3 px-3 font-semibold text-slate-700">Status</th>
//                               <th className="text-left py-3 px-3 font-semibold text-slate-700">Open</th>
//                               <th className="text-left py-3 px-3 font-semibold text-slate-700">Close</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {form.delivery.operatingHours.map((row, idx) => (
//                               <tr key={row.day} className="border-b border-slate-100 hover:bg-slate-50">
//                                 <td className="py-3 px-3 font-medium text-slate-900">{row.day}</td>
//                                 <td className="py-3 px-3">
//                                   <input
//                                     type="checkbox"
//                                     className="toggle toggle-sm toggle-blue"
//                                     checked={row.isClosed}
//                                     onChange={(e) => {
//                                       const checked = e.target.checked
//                                       setForm((p) => {
//                                         const next = [...p.delivery.operatingHours]
//                                         next[idx] = { ...next[idx], isClosed: checked }
//                                         return { ...p, delivery: { ...p.delivery, operatingHours: next } }
//                                       })
//                                     }}
//                                   />
//                                 </td>
//                                 <td className="py-3 px-3">
//                                   <input
//                                     className="input input-bordered input-sm bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-32"
//                                     type="time"
//                                     value={row.open}
//                                     disabled={row.isClosed}
//                                     onChange={(e) => {
//                                       const v = e.target.value
//                                       setForm((p) => {
//                                         const next = [...p.delivery.operatingHours]
//                                         next[idx] = { ...next[idx], open: v }
//                                         return { ...p, delivery: { ...p.delivery, operatingHours: next } }
//                                       })
//                                     }}
//                                   />
//                                 </td>
//                                 <td className="py-3 px-3">
//                                   <input
//                                     className="input input-bordered input-sm bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-32"
//                                     type="time"
//                                     value={row.close}
//                                     disabled={row.isClosed}
//                                     onChange={(e) => {
//                                       const v = e.target.value
//                                       setForm((p) => {
//                                         const next = [...p.delivery.operatingHours]
//                                         next[idx] = { ...next[idx], close: v }
//                                         return { ...p, delivery: { ...p.delivery, operatingHours: next } }
//                                       })
//                                     }}
//                                   />
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* COMPLIANCE */}
//                 {activeTab === "compliance" && (
//                   <div className="space-y-6">
//                     <div>
//                       <h2 className="text-xl font-semibold text-slate-900 mb-1">Compliance</h2>
//                       <p className="text-sm text-slate-600">Upload your license to enable Rx order processing.</p>
//                     </div>

//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
//                       <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
//                         <h3 className="font-semibold text-slate-900 mb-3">Verification Status</h3>
//                         <div className="mb-4">
//                           <StatusBadge status={form.compliance.verificationStatus} />
//                         </div>

//                         {form.compliance.reviewerNote ? (
//                           <div className="text-sm text-slate-700">
//                             <span className="font-medium">Reviewer Note:</span>
//                             <p className="mt-2">{form.compliance.reviewerNote}</p>
//                           </div>
//                         ) : (
//                           <p className="text-sm text-slate-600">
//                             Upload a valid document to move to <span className="font-medium">pending</span> status.
//                           </p>
//                         )}
//                       </div>

//                       <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
//                         <h3 className="font-semibold text-slate-900 mb-3">License Document</h3>
//                         <p className="text-sm text-slate-600 truncate mb-4">
//                           {form.compliance.licenseDocumentFilename || "No document uploaded"}
//                         </p>

//                         <div className="space-y-3">
//                           <input
//                             type="file"
//                             accept=".pdf,image/*"
//                             className="file-input file-input-bordered w-full bg-white text-slate-900 border-slate-200 focus:border-blue-500"
//                             onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
//                           />

//                           <div className="flex flex-col sm:flex-row gap-2">
//                             <button
//                               type="button"
//                               className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none"
//                               disabled={disabled || !licenseFile}
//                               onClick={uploadLicense}
//                             >
//                               {saving ? "Uploading..." : "Upload"}
//                             </button>

//                             <button
//                               type="button"
//                               className="px-4 py-2 bg-white text-slate-700 font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none"
//                               disabled={disabled || !form.compliance.licenseDocumentFilename}
//                               onClick={viewLicense}
//                             >
//                               View
//                             </button>
//                           </div>

//                           <p className="text-xs text-slate-500">Accepted: PDF/JPG/PNG, max 10MB.</p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* STAFF */}
//                 {activeTab === "staff" && (
//                   <div className="space-y-4">
//                     <h2 className="text-xl font-semibold text-slate-900 mb-2">Staff & Roles</h2>
//                     <p className="text-sm text-slate-600 mb-4">
//                       This build supports one pharmacy account per login. Staff roles (cashier/manager/rider) can be
//                       added in the future.
//                     </p>
//                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
//                       Nothing to configure here yet.
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-xl">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//               <p className="text-xs text-slate-600">
//                 {saving ? "Saving changes..." : "Click Save Changes to apply your updates."}
//               </p>
//               <div className="flex gap-2 justify-end">
//                 <button
//                   className="px-4 py-2 bg-white text-slate-700 font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                   disabled={disabled}
//                   onClick={load}
//                 >
//                   Reset
//                 </button>
//                 <button
//                   className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                   disabled={disabled}
//                   onClick={save}
//                 >
//                   {saving ? "Saving..." : "Save Changes"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="h-8" />
//       </div>
//     </div>
//   )
// }



"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/services/api"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const GREEN = "#069668"

function normalizeSettings(doc) {
  const d = doc || {}
  const profile = d.profile || {}
  const delivery = d.delivery || {}
  const compliance = d.compliance || {}

  let operatingHours = Array.isArray(delivery.operatingHours) ? delivery.operatingHours : []
  const byDay = new Map(operatingHours.map((x) => [x.day, x]))
  operatingHours = DAYS.map((day) => {
    const x = byDay.get(day) || {}
    return {
      day,
      isClosed: !!x.isClosed,
      open: x.open || "09:00",
      close: x.close || "21:00",
    }
  })

  return {
    profile: {
      pharmacyName: profile.pharmacyName || "",
      licenseNumber: profile.licenseNumber || "",
      email: profile.email || "",
      phone: profile.phone || "",
      fullAddress: profile.fullAddress || "",
      city: profile.city || "",
      postalCode: profile.postalCode || "",
    },
    delivery: {
      deliveryZonesText: Array.isArray(delivery.deliveryZones) ? delivery.deliveryZones.join(", ") : "",
      deliveryFee: Number.isFinite(delivery.deliveryFee) ? delivery.deliveryFee : 0,
      freeDeliveryThreshold: Number.isFinite(delivery.freeDeliveryThreshold) ? delivery.freeDeliveryThreshold : 0,
      minimumOrderValue: Number.isFinite(delivery.minimumOrderValue) ? delivery.minimumOrderValue : 0,
      operatingHours,
    },
    compliance: {
      verificationStatus: compliance.verificationStatus || "unverified",
      licenseDocumentFilename: compliance.licenseDocumentFilename || "",
      reviewerNote: compliance.reviewerNote || "",
    },
  }
}

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "hours", label: "Hours & Zones" },
  { key: "compliance", label: "Compliance" },
  { key: "staff", label: "Staff & Roles" },
]

function StatusBadge({ status }) {
  const badgeClasses = {
    verified: "bg-emerald-50 text-emerald-800 border-emerald-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    unverified: "bg-slate-50 text-slate-700 border-slate-200",
  }

  const cls = badgeClasses[status] || badgeClasses.unverified
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${cls}`}>
      {status}
    </span>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState(() => normalizeSettings(null))
  const [licenseFile, setLicenseFile] = useState(null)

  const zonesArr = useMemo(() => {
    return form.delivery.deliveryZonesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }, [form.delivery.deliveryZonesText])

  const disabled = loading || saving

  // ✅ GREEN THEME INPUT STYLES
  const inputClass =
    "input input-bordered w-full bg-white text-slate-900 placeholder-slate-400 border-slate-200 " +
    "focus:outline-none focus:ring-2 focus:ring-[rgba(6,150,104,0.25)] focus:border-[var(--brand)]"

  const textareaClass =
    "textarea textarea-bordered w-full bg-white text-slate-900 placeholder-slate-400 border-slate-200 " +
    "focus:outline-none focus:ring-2 focus:ring-[rgba(6,150,104,0.25)] focus:border-[var(--brand)]"

  async function load() {
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const doc = await api.getPharmacySettings()
      setForm(normalizeSettings(doc))
    } catch (e) {
      setError(e?.message || "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await api.updatePharmacySettings({
        profile: form.profile,
        delivery: {
          deliveryZones: zonesArr,
          deliveryFee: Number(form.delivery.deliveryFee) || 0,
          freeDeliveryThreshold: Number(form.delivery.freeDeliveryThreshold) || 0,
          minimumOrderValue: Number(form.delivery.minimumOrderValue) || 0,
          operatingHours: form.delivery.operatingHours,
        },
      })
      setSuccess("Settings saved successfully.")
      await load()
    } catch (e) {
      setError(e?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function uploadLicense() {
    if (!licenseFile) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await api.uploadPharmacyLicenseDocument(licenseFile)
      setLicenseFile(null)
      setSuccess("License document uploaded (status: pending).")
      await load()
    } catch (e) {
      setError(e?.message || "Failed to upload license document")
    } finally {
      setSaving(false)
    }
  }

  async function viewLicense() {
    try {
      const { blob, contentType } = await api.downloadPharmacyLicenseDocument()
      const url = URL.createObjectURL(new Blob([blob], { type: contentType || blob.type }))
      window.open(url, "_blank", "noopener,noreferrer")
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      setError(e?.message || "Could not open license document")
    }
  }

  const goBackToPanel = () => navigate("/pharmacy/dashboard")

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-slate-50" style={{ ["--brand"]: GREEN }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <div className="mb-4">
          <button
            type="button"
            onClick={goBackToPanel}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            title="Back to Pharmacy Panel"
          >
            <span className="text-lg leading-none">←</span>
            Back to Pharmacy Panel
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Pharmacy Settings</h1>
          <p className="text-slate-600">Manage profile, delivery setup, and compliance. Saved per pharmacy account.</p>
        </div>

        {/* Status */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium text-slate-700">Verification Status</span>
            <StatusBadge status={form.compliance.verificationStatus} />
          </div>
          <button
            className="px-4 py-2 text-sm font-medium text-[var(--brand)] bg-[rgba(6,150,104,0.08)] border border-[rgba(6,150,104,0.25)] rounded-lg hover:bg-[rgba(6,150,104,0.12)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={load}
            disabled={disabled}
            title="Refresh settings"
          >
            Refresh
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
            <span className="break-words">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
            <span className="break-words">{success}</span>
          </div>
        )}

        {/* Main */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          {/* Tabs */}
          <div className="border-b border-slate-200">
            <div className="px-6 pt-6">
              <div className="flex gap-2 overflow-x-auto pb-4">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    disabled={disabled}
                    className={`px-4 py-2 whitespace-nowrap font-medium text-sm rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[rgba(6,150,104,0.25)] ${
                      activeTab === t.key
                        ? "bg-[var(--brand)] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="py-16 text-center">
                <div className="inline-flex items-center gap-2 text-slate-600">
                  <span className="loading loading-spinner loading-md" />
                  <span>Loading settings...</span>
                </div>
              </div>
            ) : (
              <>
                {/* PROFILE */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 mb-1">Pharmacy Profile</h2>
                      <p className="text-sm text-slate-600">This information appears on invoices and order slips.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">Pharmacy Name</span>
                        </label>
                        <input
                          className={inputClass}
                          value={form.profile.pharmacyName}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, profile: { ...p.profile, pharmacyName: e.target.value } }))
                          }
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">License Number</span>
                        </label>
                        <input
                          className={inputClass}
                          value={form.profile.licenseNumber}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, profile: { ...p.profile, licenseNumber: e.target.value } }))
                          }
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">Email</span>
                        </label>
                        <input
                          className={inputClass}
                          type="email"
                          value={form.profile.email}
                          onChange={(e) => setForm((p) => ({ ...p, profile: { ...p.profile, email: e.target.value } }))}
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">Phone</span>
                        </label>
                        <input
                          className={inputClass}
                          value={form.profile.phone}
                          onChange={(e) => setForm((p) => ({ ...p, profile: { ...p.profile, phone: e.target.value } }))}
                        />
                      </div>

                      <div className="form-control w-full md:col-span-2">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">Full Address</span>
                        </label>
                        <input
                          className={inputClass}
                          value={form.profile.fullAddress}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, profile: { ...p.profile, fullAddress: e.target.value } }))
                          }
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">City</span>
                        </label>
                        <input
                          className={inputClass}
                          value={form.profile.city}
                          onChange={(e) => setForm((p) => ({ ...p, profile: { ...p.profile, city: e.target.value } }))}
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">Postal Code</span>
                        </label>
                        <input
                          className={inputClass}
                          value={form.profile.postalCode}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, profile: { ...p.profile, postalCode: e.target.value } }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* HOURS & ZONES */}
                {activeTab === "hours" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 mb-1">Hours & Zones</h2>
                      <p className="text-sm text-slate-600">Set delivery rules and operating hours customers can rely on.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">Delivery Fee (৳)</span>
                        </label>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          value={form.delivery.deliveryFee}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, delivery: { ...p.delivery, deliveryFee: e.target.value } }))
                          }
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">Free Delivery Threshold (৳)</span>
                        </label>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          value={form.delivery.freeDeliveryThreshold}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, delivery: { ...p.delivery, freeDeliveryThreshold: e.target.value } }))
                          }
                        />
                      </div>

                      <div className="form-control w-full">
                        <label className="label pb-2">
                          <span className="label-text font-medium text-slate-700">Minimum Order (৳)</span>
                        </label>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          value={form.delivery.minimumOrderValue}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, delivery: { ...p.delivery, minimumOrderValue: e.target.value } }))
                          }
                        />
                      </div>
                    </div>

                    <div className="form-control w-full">
                      <label className="label pb-2">
                        <span className="label-text font-medium text-slate-700">Delivery Zones</span>
                      </label>
                      <textarea
                        className={textareaClass}
                        placeholder="e.g., Gulshan, Dhanmondi, Uttara"
                        rows={3}
                        value={form.delivery.deliveryZonesText}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, delivery: { ...p.delivery, deliveryZonesText: e.target.value } }))
                        }
                      />
                      <span className="text-xs text-slate-500 mt-2">Comma-separated list.</span>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-slate-900 mb-4">Operating Hours</h3>

                      {/* Mobile cards */}
                      <div className="grid grid-cols-1 md:hidden gap-3">
                        {form.delivery.operatingHours.map((row, idx) => (
                          <div key={row.day} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="font-medium text-slate-900">{row.day}</div>
                              <label className="label cursor-pointer gap-2">
                                <span className="label-text text-sm text-slate-700">Closed</span>
                                <input
                                  type="checkbox"
                                  className="toggle toggle-sm"
                                  style={{ ["--tglbg"]: GREEN }}
                                  checked={row.isClosed}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setForm((p) => {
                                      const next = [...p.delivery.operatingHours]
                                      next[idx] = { ...next[idx], isClosed: checked }
                                      return { ...p, delivery: { ...p.delivery, operatingHours: next } }
                                    })
                                  }}
                                />
                              </label>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                className={`${inputClass} h-10 text-sm`}
                                type="time"
                                value={row.open}
                                disabled={row.isClosed}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setForm((p) => {
                                    const next = [...p.delivery.operatingHours]
                                    next[idx] = { ...next[idx], open: v }
                                    return { ...p, delivery: { ...p.delivery, operatingHours: next } }
                                  })
                                }}
                              />
                              <span className="text-slate-400">–</span>
                              <input
                                className={`${inputClass} h-10 text-sm`}
                                type="time"
                                value={row.close}
                                disabled={row.isClosed}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setForm((p) => {
                                    const next = [...p.delivery.operatingHours]
                                    next[idx] = { ...next[idx], close: v }
                                    return { ...p, delivery: { ...p.delivery, operatingHours: next } }
                                  })
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-3 px-3 font-semibold text-slate-700">Day</th>
                              <th className="text-left py-3 px-3 font-semibold text-slate-700">Status</th>
                              <th className="text-left py-3 px-3 font-semibold text-slate-700">Open</th>
                              <th className="text-left py-3 px-3 font-semibold text-slate-700">Close</th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.delivery.operatingHours.map((row, idx) => (
                              <tr key={row.day} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-3 font-medium text-slate-900">{row.day}</td>
                                <td className="py-3 px-3">
                                  <input
                                    type="checkbox"
                                    className="toggle toggle-sm"
                                    style={{ ["--tglbg"]: GREEN }}
                                    checked={row.isClosed}
                                    onChange={(e) => {
                                      const checked = e.target.checked
                                      setForm((p) => {
                                        const next = [...p.delivery.operatingHours]
                                        next[idx] = { ...next[idx], isClosed: checked }
                                        return { ...p, delivery: { ...p.delivery, operatingHours: next } }
                                      })
                                    }}
                                  />
                                </td>
                                <td className="py-3 px-3">
                                  <input
                                    className="input input-bordered input-sm bg-white text-slate-900 border-slate-200 w-32 focus:outline-none focus:ring-2 focus:ring-[rgba(6,150,104,0.25)] focus:border-[var(--brand)]"
                                    type="time"
                                    value={row.open}
                                    disabled={row.isClosed}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      setForm((p) => {
                                        const next = [...p.delivery.operatingHours]
                                        next[idx] = { ...next[idx], open: v }
                                        return { ...p, delivery: { ...p.delivery, operatingHours: next } }
                                      })
                                    }}
                                  />
                                </td>
                                <td className="py-3 px-3">
                                  <input
                                    className="input input-bordered input-sm bg-white text-slate-900 border-slate-200 w-32 focus:outline-none focus:ring-2 focus:ring-[rgba(6,150,104,0.25)] focus:border-[var(--brand)]"
                                    type="time"
                                    value={row.close}
                                    disabled={row.isClosed}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      setForm((p) => {
                                        const next = [...p.delivery.operatingHours]
                                        next[idx] = { ...next[idx], close: v }
                                        return { ...p, delivery: { ...p.delivery, operatingHours: next } }
                                      })
                                    }}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* COMPLIANCE */}
                {activeTab === "compliance" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 mb-1">Compliance</h2>
                      <p className="text-sm text-slate-600">Upload your license to enable Rx order processing.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <h3 className="font-semibold text-slate-900 mb-3">Verification Status</h3>
                        <div className="mb-4">
                          <StatusBadge status={form.compliance.verificationStatus} />
                        </div>

                        {form.compliance.reviewerNote ? (
                          <div className="text-sm text-slate-700">
                            <span className="font-medium">Reviewer Note:</span>
                            <p className="mt-2">{form.compliance.reviewerNote}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600">
                            Upload a valid document to move to <span className="font-medium">pending</span> status.
                          </p>
                        )}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <h3 className="font-semibold text-slate-900 mb-3">License Document</h3>
                        <p className="text-sm text-slate-600 truncate mb-4">
                          {form.compliance.licenseDocumentFilename || "No document uploaded"}
                        </p>

                        <div className="space-y-3">
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="file-input file-input-bordered w-full bg-white text-slate-900 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[rgba(6,150,104,0.25)] focus:border-[var(--brand)]"
                            onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                          />

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              className="px-4 py-2 bg-[var(--brand)] text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex-1 sm:flex-none"
                              disabled={disabled || !licenseFile}
                              onClick={uploadLicense}
                            >
                              {saving ? "Uploading..." : "Upload"}
                            </button>

                            <button
                              type="button"
                              className="px-4 py-2 bg-white text-slate-700 font-medium border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex-1 sm:flex-none"
                              disabled={disabled || !form.compliance.licenseDocumentFilename}
                              onClick={viewLicense}
                            >
                              View
                            </button>
                          </div>

                          <p className="text-xs text-slate-500">Accepted: PDF/JPG/PNG, max 10MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAFF */}
                {activeTab === "staff" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Staff & Roles</h2>
                    <p className="text-sm text-slate-600 mb-4">
                      This build supports one pharmacy account per login. Staff roles can be added in the future.
                    </p>
                    <div className="p-4 bg-[rgba(6,150,104,0.10)] border border-[rgba(6,150,104,0.25)] rounded-xl text-[var(--brand)] text-sm">
                      Nothing to configure here yet.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-slate-600">{saving ? "Saving changes..." : "Click Save Changes to apply your updates."}</p>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 bg-white text-slate-700 font-medium border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  disabled={disabled}
                  onClick={load}
                >
                  Reset
                </button>
                <button
                  className="px-4 py-2 bg-[var(--brand)] text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  disabled={disabled}
                  onClick={save}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}