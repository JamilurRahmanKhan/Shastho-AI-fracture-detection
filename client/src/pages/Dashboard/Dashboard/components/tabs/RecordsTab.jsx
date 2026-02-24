/**
 * Frontend page: RecordsTab
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// "use client"

// import { useMemo, useState } from "react"
// import {
//   FileText,
//   Upload,
//   Search,
//   X,
//   Pencil,
//   Trash2,
//   Eye,
//   Download,
//   ImageIcon,
//   Tag,
//   Calendar,
//   AlertTriangle,
// } from "lucide-react"

// import { api } from "@/services/api"

// function formatBytes(bytes) {
//   const b = Number(bytes || 0)
//   if (!b) return "0 B"
//   const units = ["B", "KB", "MB", "GB"]
//   let idx = 0
//   let n = b
//   while (n >= 1024 && idx < units.length - 1) {
//     n /= 1024
//     idx += 1
//   }
//   return `${n.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
// }

// function safeDate(d) {
//   if (!d) return ""
//   const x = d instanceof Date ? d : new Date(d)
//   return Number.isNaN(x.getTime()) ? "" : x.toLocaleDateString()
// }

// function isImageMime(mime = "") {
//   return String(mime).startsWith("image/")
// }

// const RECORD_TYPES = ["Lab Report", "Prescription", "X-ray", "MRI/CT", "Discharge Summary", "Other"]

// const RecordsTab = ({ medicalRecords = [], onMedicalRecordsChanged, analysisHistory = [] }) => {
//   const [activeSubtab, setActiveSubtab] = useState("records") // 'records' | 'analysis'

//   // Filters
//   const [query, setQuery] = useState("")
//   const [typeFilter, setTypeFilter] = useState("")

//   // Modal state
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editTarget, setEditTarget] = useState(null) // record object
//   const [busy, setBusy] = useState(false)
//   const [formError, setFormError] = useState("")
//   const [success, setSuccess] = useState("")

//   // Upload/Edit form
//   const [file, setFile] = useState(null)
//   const [title, setTitle] = useState("")
//   const [recordType, setRecordType] = useState("")
//   const [recordDate, setRecordDate] = useState("")
//   const [tags, setTags] = useState("")
//   const [description, setDescription] = useState("")

//   const filteredRecords = useMemo(() => {
//     const q = query.trim().toLowerCase()
//     return (medicalRecords || [])
//       .filter((r) => {
//         if (typeFilter && (r.recordType || "") !== typeFilter) return false
//         if (!q) return true
//         const hay = [r.title, r.recordType, r.filename, (r.tags || []).join(" "), r.description]
//           .filter(Boolean)
//           .join(" ")
//           .toLowerCase()
//         return hay.includes(q)
//       })
//       .slice()
//       .sort((a, b) => {
//         const da = a.uploadedAt || a.createdAt || 0
//         const db = b.uploadedAt || b.createdAt || 0
//         return new Date(db).getTime() - new Date(da).getTime()
//       })
//   }, [medicalRecords, query, typeFilter])

//   const openCreateModal = () => {
//     setEditTarget(null)
//     setFile(null)
//     setTitle("")
//     setRecordType("")
//     setRecordDate(new Date().toISOString().slice(0, 10))
//     setTags("")
//     setDescription("")
//     setFormError("")
//     setSuccess("")
//     setModalOpen(true)
//   }

//   const openEditModal = (r) => {
//     setEditTarget(r)
//     setFile(null)
//     setTitle(r.title || "")
//     setRecordType(r.recordType || "")
//     setRecordDate(r.recordDate ? new Date(r.recordDate).toISOString().slice(0, 10) : "")
//     setTags(Array.isArray(r.tags) ? r.tags.join(", ") : "")
//     setDescription(r.description || "")
//     setFormError("")
//     setSuccess("")
//     setModalOpen(true)
//   }

//   const closeModal = () => {
//     if (busy) return
//     setModalOpen(false)
//     setEditTarget(null)
//   }

//   const validateForm = () => {
//     const t = title.trim()
//     if (!t) return "Title is required."
//     if (!recordDate) return "Record date is required."
//     if (!editTarget && !file) return "Please choose a file to upload."
//     return ""
//   }

//   const submitForm = async () => {
//     setFormError("")
//     setSuccess("")

//     const err = validateForm()
//     if (err) {
//       setFormError(err)
//       return
//     }

//     try {
//       setBusy(true)

//       if (editTarget) {
//         await api.updateMedicalRecord(editTarget.id, {
//           title: title.trim(),
//           recordType: recordType.trim(),
//           recordDate,
//           description: description.trim(),
//           tags: tags,
//         })
//         setSuccess("Record updated.")
//       } else {
//         const fd = new FormData()
//         fd.append("file", file)
//         fd.append("title", title.trim())
//         fd.append("recordType", recordType.trim())
//         fd.append("recordDate", recordDate)
//         if (description.trim()) fd.append("description", description.trim())
//         if (tags.trim()) fd.append("tags", tags.trim())

//         await api.uploadMedicalRecord(fd)
//         setSuccess("Record uploaded successfully.")
//       }

//       await onMedicalRecordsChanged?.()
//       // Keep modal open briefly so user can see success, then close.
//       setTimeout(() => {
//         setModalOpen(false)
//       }, 600)
//     } catch (e) {
//       console.error(e)
//       setFormError(e?.message || "Something went wrong.")
//     } finally {
//       setBusy(false)
//     }
//   }

//   const handleDelete = async (r) => {
//     const ok = window.confirm("Delete this record? This cannot be undone.")
//     if (!ok) return
//     try {
//       setBusy(true)
//       await api.deleteMedicalRecord(r.id)
//       await onMedicalRecordsChanged?.()
//     } catch (e) {
//       console.error(e)
//       alert(e?.message || "Delete failed")
//     } finally {
//       setBusy(false)
//     }
//   }

//   const viewOrDownload = async (r, inline) => {
//     try {
//       const { blob, filename, contentType } = await api.downloadMedicalRecord(r.id, inline)
//       const url = URL.createObjectURL(blob)
//       if (inline) {
//         window.open(url, "_blank", "noopener,noreferrer")
//         // allow the new tab to read, then revoke later
//         setTimeout(() => URL.revokeObjectURL(url), 60_000)
//         return
//       }

//       const a = document.createElement("a")
//       a.href = url
//       a.download = filename || r.filename || r.title || "medical-record"
//       document.body.appendChild(a)
//       a.click()
//       a.remove()
//       setTimeout(() => URL.revokeObjectURL(url), 10_000)
//     } catch (e) {
//       console.error(e)
//       alert(e?.message || "Download failed")
//     }
//   }

//   return (
//     <div className="space-y-6">
//       <div className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
//         <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
//           <div>
//             <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center">
//               <FileText className="w-7 h-7 mr-3 text-blue-600" />
//               Medical Records & Analysis History
//             </h2>
//             <p className="text-slate-600 mt-1">
//               Upload and manage your medical documents, and review your past AI analyses.
//             </p>
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setActiveSubtab("records")}
//               className={`px-4 py-2 rounded-xl font-semibold transition-all ${
//                 activeSubtab === "records"
//                   ? "bg-blue-600 text-white shadow-lg"
//                   : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//               }`}
//             >
//               Medical Records
//             </button>
//             <button
//               onClick={() => setActiveSubtab("analysis")}
//               className={`px-4 py-2 rounded-xl font-semibold transition-all ${
//                 activeSubtab === "analysis"
//                   ? "bg-blue-600 text-white shadow-lg"
//                   : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
//               }`}
//             >
//               Analysis History
//             </button>
//           </div>
//         </div>
//       </div>

//       {activeSubtab === "records" ? (
//         <div className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
//               <div className="relative w-full sm:max-w-md">
//                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//                 <input
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   placeholder="Search title, tags, type..."
//                   className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
//                 />
//               </div>

//               <select
//                 value={typeFilter}
//                 onChange={(e) => setTypeFilter(e.target.value)}
//                 className="w-full sm:w-56 py-2.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
//               >
//                 <option value="">All record types</option>
//                 {RECORD_TYPES.map((t) => (
//                   <option key={t} value={t}>
//                     {t}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <button
//               onClick={openCreateModal}
//               className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
//             >
//               <Upload className="w-4 h-4" />
//               Upload Record
//             </button>
//           </div>

//           <div className="mt-5">
//             {filteredRecords.length === 0 ? (
//               <div className="text-center py-14">
//                 <FileText className="w-16 h-16 text-slate-300 mx-auto" />
//                 <h3 className="mt-3 text-lg font-bold text-slate-700">No records found</h3>
//                 <p className="text-slate-600 mt-1">Upload your first PDF or image to build your medical history.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
//                 {filteredRecords.map((r) => (
//                   <div
//                     key={r.id}
//                     className="border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition bg-white"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="min-w-0">
//                         <div className="flex items-center gap-2">
//                           {isImageMime(r.mimeType) ? (
//                             <ImageIcon className="w-4 h-4 text-blue-600" />
//                           ) : (
//                             <FileText className="w-4 h-4 text-blue-600" />
//                           )}
//                           <h4 className="font-bold text-slate-900 truncate">{r.title}</h4>
//                         </div>

//                         <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
//                           <span className="inline-flex items-center gap-1">
//                             <Calendar className="w-4 h-4" />
//                             {safeDate(r.recordDate) || "—"}
//                           </span>
//                           {r.recordType ? (
//                             <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
//                               {r.recordType}
//                             </span>
//                           ) : null}
//                           <span className="text-slate-500">{formatBytes(r.size)}</span>
//                         </div>

//                         {r.description ? (
//                           <p className="mt-2 text-sm text-slate-600 line-clamp-2">{r.description}</p>
//                         ) : null}

//                         {Array.isArray(r.tags) && r.tags.length ? (
//                           <div className="mt-3 flex flex-wrap gap-2">
//                             {r.tags.slice(0, 6).map((t, idx) => (
//                               <span
//                                 key={`${t}-${idx}`}
//                                 className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
//                               >
//                                 <Tag className="w-3 h-3" />
//                                 {t}
//                               </span>
//                             ))}
//                           </div>
//                         ) : null}
//                       </div>

//                       <div className="flex flex-col gap-2 shrink-0">
//                         <button
//                           onClick={() => viewOrDownload(r, true)}
//                           className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
//                           title="View"
//                         >
//                           <Eye className="w-4 h-4" />
//                           <span className="hidden sm:inline">View</span>
//                         </button>
//                         <button
//                           onClick={() => viewOrDownload(r, false)}
//                           className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
//                           title="Download"
//                         >
//                           <Download className="w-4 h-4" />
//                           <span className="hidden sm:inline">Download</span>
//                         </button>
//                         <button
//                           onClick={() => openEditModal(r)}
//                           className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
//                           title="Edit"
//                         >
//                           <Pencil className="w-4 h-4" />
//                           <span className="hidden sm:inline">Edit</span>
//                         </button>
//                         <button
//                           onClick={() => handleDelete(r)}
//                           disabled={busy}
//                           className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-700"
//                           title="Delete"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                           <span className="hidden sm:inline">Delete</span>
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Upload/Edit Modal */}
//           {modalOpen && (
//             <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//               <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
//               <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//                 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
//                   <div>
//                     <h3 className="text-lg sm:text-xl font-bold text-slate-900">
//                       {editTarget ? "Edit Medical Record" : "Upload Medical Record"}
//                     </h3>
//                     <p className="text-slate-600 text-sm">Supported: PDF, JPEG, PNG, WEBP (max 25MB)</p>
//                   </div>
//                   <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100" disabled={busy}>
//                     <X className="w-5 h-5 text-slate-700" />
//                   </button>
//                 </div>

//                 <div className="p-5 space-y-4">
//                   {formError && (
//                     <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700">
//                       <AlertTriangle className="w-5 h-5 mt-0.5" />
//                       <div className="text-sm">{formError}</div>
//                     </div>
//                   )}

//                   {success && (
//                     <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
//                       {success}
//                     </div>
//                   )}

//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-semibold text-slate-700 mb-2">
//                         Title <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         value={title}
//                         onChange={(e) => setTitle(e.target.value)}
//                         className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
//                         placeholder="e.g., Blood test report"
//                         autoFocus
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-semibold text-slate-700 mb-2">Record Type</label>
//                       <select
//                         value={recordType}
//                         onChange={(e) => setRecordType(e.target.value)}
//                         className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
//                       >
//                         <option value="">Select type (optional)</option>
//                         {RECORD_TYPES.map((t) => (
//                           <option key={t} value={t}>
//                             {t}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-semibold text-slate-700 mb-2">
//                         Record Date <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="date"
//                         value={recordDate}
//                         onChange={(e) => setRecordDate(e.target.value)}
//                         className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
//                       <input
//                         value={tags}
//                         onChange={(e) => setTags(e.target.value)}
//                         className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
//                         placeholder="e.g., diabetes, CBC, vitamin"
//                       />
//                       <p className="mt-1.5 text-xs text-slate-500">Comma-separated tags for better organization</p>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
//                     <textarea
//                       value={description}
//                       onChange={(e) => setDescription(e.target.value)}
//                       rows={3}
//                       className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
//                       placeholder="Optional notes to help you remember what this document is about"
//                     />
//                     <p className="mt-1.5 text-xs text-slate-500">Add context to remember why this record matters</p>
//                   </div>

//                   {!editTarget && (
//                     <div>
//                       <label className="block text-sm font-semibold text-slate-700 mb-2">
//                         File <span className="text-red-500">*</span>
//                       </label>
//                       <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition">
//                         <input
//                           type="file"
//                           accept="application/pdf,image/jpeg,image/png,image/webp"
//                           onChange={(e) => setFile(e.target.files?.[0] || null)}
//                           className="block w-full text-sm cursor-pointer"
//                         />
//                         {file && (
//                           <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
//                             <p className="text-xs text-emerald-600 font-medium">File selected:</p>
//                             <p className="text-sm font-semibold text-emerald-700 mt-1">{file.name}</p>
//                             <p className="text-xs text-emerald-600 mt-0.5">{formatBytes(file.size)}</p>
//                           </div>
//                         )}
//                         {!file && (
//                           <p className="mt-3 text-sm text-slate-600">Choose a PDF or image to upload (max 25MB)</p>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                   {editTarget && (
//                     <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
//                       <p className="text-sm text-blue-700">
//                         File replacement is not supported yet. You can edit metadata only.
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
//                   <button
//                     onClick={closeModal}
//                     className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white transition"
//                     disabled={busy}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={submitForm}
//                     className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
//                     disabled={busy}
//                   >
//                     {busy ? "Saving..." : editTarget ? "Save changes" : "Upload Record"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
//           {analysisHistory.length === 0 ? (
//             <div className="text-center py-14">
//               <ImageIcon className="w-16 h-16 text-slate-300 mx-auto" />
//               <h3 className="mt-3 text-lg font-bold text-slate-700">No analyses yet</h3>
//               <p className="text-slate-600 mt-1">Upload an X-ray in AI Chat to generate your first analysis report.</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
//               {analysisHistory.map((x) => {
//                 const created = x.createdAt ? (x.createdAt instanceof Date ? x.createdAt : new Date(x.createdAt)) : null
//                 const prob = x.analysis?.probability
//                 const fracture = x.analysis?.fractureDetected
//                 return (
//                   <div
//                     key={x.id}
//                     className="border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition bg-white"
//                   >
//                     <div className="flex gap-4">
//                       <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
//                         {x.fileUrl ? (
//                           <img
//                             src={x.fileUrl || "/placeholder.svg"}
//                             alt="xray"
//                             className="w-full h-full object-cover"
//                           />
//                         ) : (
//                           <ImageIcon className="w-8 h-8 text-slate-400" />
//                         )}
//                       </div>
//                       <div className="min-w-0 flex-1">
//                         <div className="flex items-start justify-between gap-3">
//                           <div className="min-w-0">
//                             <h4 className="font-bold text-slate-900 truncate">{x.originalName || "X-ray Analysis"}</h4>
//                             <p className="text-sm text-slate-600 mt-0.5">{created ? created.toLocaleString() : ""}</p>
//                           </div>
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-semibold border ${
//                               fracture
//                                 ? "bg-red-50 text-red-700 border-red-200"
//                                 : "bg-emerald-50 text-emerald-700 border-emerald-200"
//                             }`}
//                           >
//                             {fracture ? "Fracture suspected" : "No fracture"}
//                           </span>
//                         </div>

//                         <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
//                           <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
//                             <p className="text-slate-500">Confidence</p>
//                             <p className="font-bold text-slate-900">
//                               {typeof prob === "number" ? `${Math.round(prob * 100)}%` : "—"}
//                             </p>
//                           </div>
//                           <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
//                             <p className="text-slate-500">Timeline</p>
//                             <p className="font-bold text-slate-900">{x.analysis?.recoveryTimeline || "—"}</p>
//                           </div>
//                         </div>

//                         {x.analysis?.recommendations?.length && (
//                           <ul className="mt-3 text-sm text-slate-700 list-disc pl-5">
//                             {x.analysis.recommendations.slice(0, 2).map((r, idx) => (
//                               <li key={idx}>{r}</li>
//                             ))}
//                           </ul>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// export default RecordsTab


"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import {
  FileText,
  Upload,
  Search,
  X,
  Pencil,
  Trash2,
  Eye,
  Download,
  ImageIcon,
  Tag,
  Calendar,
  AlertTriangle,
} from "lucide-react"

import { api } from "@/services/api"

function formatBytes(bytes) {
  const b = Number(bytes || 0)
  if (!b) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let idx = 0
  let n = b
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024
    idx += 1
  }
  return `${n.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

function safeDate(d) {
  if (!d) return ""
  const x = d instanceof Date ? d : new Date(d)
  return Number.isNaN(x.getTime()) ? "" : x.toLocaleDateString()
}

function isImageMime(mime = "") {
  return String(mime).startsWith("image/")
}

const RECORD_TYPES = ["Lab Report", "Prescription", "X-ray", "MRI/CT", "Discharge Summary", "Other"]

function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

const RecordsTab = ({ medicalRecords = [], onMedicalRecordsChanged, analysisHistory = [] }) => {
  const [activeSubtab, setActiveSubtab] = useState("records") // 'records' | 'analysis'

  // Filters
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState("")
  const [success, setSuccess] = useState("")

  // Upload/Edit form
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState("")
  const [recordType, setRecordType] = useState("")
  const [recordDate, setRecordDate] = useState("")
  const [tags, setTags] = useState("")
  const [description, setDescription] = useState("")

  const titleRef = useRef(null)

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (medicalRecords || [])
      .filter((r) => {
        if (typeFilter && (r.recordType || "") !== typeFilter) return false
        if (!q) return true
        const hay = [r.title, r.recordType, r.filename, (r.tags || []).join(" "), r.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return hay.includes(q)
      })
      .slice()
      .sort((a, b) => {
        const da = a.uploadedAt || a.createdAt || 0
        const db = b.uploadedAt || b.createdAt || 0
        return new Date(db).getTime() - new Date(da).getTime()
      })
  }, [medicalRecords, query, typeFilter])

  const openCreateModal = () => {
    setEditTarget(null)
    setFile(null)
    setTitle("")
    setRecordType("")
    setRecordDate(new Date().toISOString().slice(0, 10))
    setTags("")
    setDescription("")
    setFormError("")
    setSuccess("")
    setModalOpen(true)
  }

  const openEditModal = (r) => {
    setEditTarget(r)
    setFile(null)
    setTitle(r.title || "")
    setRecordType(r.recordType || "")
    setRecordDate(r.recordDate ? new Date(r.recordDate).toISOString().slice(0, 10) : "")
    setTags(Array.isArray(r.tags) ? r.tags.join(", ") : "")
    setDescription(r.description || "")
    setFormError("")
    setSuccess("")
    setModalOpen(true)
  }

  const closeModal = () => {
    if (busy) return
    setModalOpen(false)
    setEditTarget(null)
  }

  const validateForm = () => {
    const t = title.trim()
    if (!t) return "Title is required."
    if (!recordDate) return "Record date is required."
    if (!editTarget && !file) return "Please choose a file to upload."
    return ""
  }

  const submitForm = async () => {
    setFormError("")
    setSuccess("")

    const err = validateForm()
    if (err) {
      setFormError(err)
      return
    }

    try {
      setBusy(true)

      if (editTarget) {
        await api.updateMedicalRecord(editTarget.id, {
          title: title.trim(),
          recordType: recordType.trim(),
          recordDate,
          description: description.trim(),
          tags: tags,
        })
        setSuccess("Record updated.")
      } else {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("title", title.trim())
        fd.append("recordType", recordType.trim())
        fd.append("recordDate", recordDate)
        if (description.trim()) fd.append("description", description.trim())
        if (tags.trim()) fd.append("tags", tags.trim())

        await api.uploadMedicalRecord(fd)
        setSuccess("Record uploaded successfully.")
      }

      await onMedicalRecordsChanged?.()
      setTimeout(() => setModalOpen(false), 450)
    } catch (e) {
      console.error(e)
      setFormError(e?.message || "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (r) => {
    const ok = window.confirm("Delete this record? This cannot be undone.")
    if (!ok) return
    try {
      setBusy(true)
      await api.deleteMedicalRecord(r.id)
      await onMedicalRecordsChanged?.()
    } catch (e) {
      console.error(e)
      alert(e?.message || "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  const viewOrDownload = async (r, inline) => {
    try {
      const { blob, filename } = await api.downloadMedicalRecord(r.id, inline)
      const url = URL.createObjectURL(blob)

      if (inline) {
        window.open(url, "_blank", "noopener,noreferrer")
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        return
      }

      const a = document.createElement("a")
      a.href = url
      a.download = filename || r.filename || r.title || "medical-record"
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      console.error(e)
      alert(e?.message || "Download failed")
    }
  }

  // Lock body scroll while modal open + ESC close + focus title
  useEffect(() => {
    if (!modalOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal()
    }
    window.addEventListener("keydown", onKeyDown)

    // focus first field after paint
    setTimeout(() => titleRef.current?.focus?.(), 0)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [modalOpen])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="w-7 h-7 text-blue-600 shrink-0" />
              <span className="truncate">Medical Records & Analysis History</span>
            </h2>
            <p className="text-slate-600 mt-1">
              Upload and manage your medical documents, and review your past AI analyses.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveSubtab("records")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-semibold transition-all ${
                activeSubtab === "records"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Medical Records
            </button>
            <button
              onClick={() => setActiveSubtab("analysis")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-semibold transition-all ${
                activeSubtab === "analysis"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Analysis History
            </button>
          </div>
        </div>
      </div>

      {activeSubtab === "records" ? (
        <div className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
          {/* Filters */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, tags, type..."
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-56 py-2.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All record types</option>
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition w-full sm:w-auto"
            >
              <Upload className="w-4 h-4" />
              Upload Record
            </button>
          </div>

          {/* List */}
          <div className="mt-5">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-14">
                <FileText className="w-16 h-16 text-slate-300 mx-auto" />
                <h3 className="mt-3 text-lg font-bold text-slate-700">No records found</h3>
                <p className="text-slate-600 mt-1">Upload your first PDF or image to build your medical history.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredRecords.map((r) => (
                  <div
                    key={r.id}
                    className="border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isImageMime(r.mimeType) ? (
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600" />
                          )}
                          <h4 className="font-bold text-slate-900 truncate">{r.title}</h4>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {safeDate(r.recordDate) || "—"}
                          </span>
                          {r.recordType ? (
                            <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                              {r.recordType}
                            </span>
                          ) : null}
                          <span className="text-slate-500">{formatBytes(r.size)}</span>
                        </div>

                        {r.description ? (
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{r.description}</p>
                        ) : null}

                        {Array.isArray(r.tags) && r.tags.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.tags.slice(0, 6).map((t, idx) => (
                              <span
                                key={`${t}-${idx}`}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                              >
                                <Tag className="w-3 h-3" />
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => viewOrDownload(r, true)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => viewOrDownload(r, false)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                        <button
                          onClick={() => openEditModal(r)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload/Edit Modal (PORTAL, RESPONSIVE) */}
          {modalOpen ? (
            <ModalPortal>
              <div className="fixed inset-0 z-[1000]">
                {/* Backdrop */}
                <button
                  type="button"
                  className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-[2px]"
                  onClick={closeModal}
                  aria-label="Close modal"
                />

                {/* Shell: desktop centered, mobile bottom-sheet */}
                <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="
                      w-full sm:max-w-2xl
                      bg-white shadow-2xl border border-slate-200
                      rounded-t-2xl sm:rounded-2xl
                      overflow-hidden
                      max-h-[calc(100dvh-8px)] sm:max-h-[calc(100dvh-32px)]
                      flex flex-col
                    "
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-white">
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                          {editTarget ? "Edit Medical Record" : "Upload Medical Record"}
                        </h3>
                        <p className="text-slate-600 text-sm">Supported: PDF, JPEG, PNG, WEBP (max 25MB)</p>
                      </div>

                      <button
                        onClick={closeModal}
                        className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-50"
                        disabled={busy}
                        aria-label="Close"
                      >
                        <X className="w-5 h-5 text-slate-700" />
                      </button>
                    </div>

                    {/* Body (scrolls on small screens) */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {formError ? (
                        <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700">
                          <AlertTriangle className="w-5 h-5 mt-0.5" />
                          <div className="text-sm">{formError}</div>
                        </div>
                      ) : null}

                      {success ? (
                        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
                          {success}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={titleRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="e.g., Blood test report"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Record Type</label>
                          <select
                            value={recordType}
                            onChange={(e) => setRecordType(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          >
                            <option value="">Select type (optional)</option>
                            {RECORD_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Record Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={recordDate}
                            onChange={(e) => setRecordDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                          <input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="e.g., diabetes, CBC, vitamin"
                          />
                          <p className="mt-1.5 text-xs text-slate-500">Comma-separated tags for better organization</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                          placeholder="Optional notes to help you remember what this document is about"
                        />
                        <p className="mt-1.5 text-xs text-slate-500">Add context to remember why this record matters</p>
                      </div>

                      {!editTarget ? (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            File <span className="text-red-500">*</span>
                          </label>
                          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 sm:p-6 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition">
                            <input
                              type="file"
                              accept="application/pdf,image/jpeg,image/png,image/webp"
                              onChange={(e) => setFile(e.target.files?.[0] || null)}
                              className="block w-full text-sm cursor-pointer"
                            />

                            {file ? (
                              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                <p className="text-xs text-emerald-600 font-medium">File selected:</p>
                                <p className="text-sm font-semibold text-emerald-700 mt-1 break-words">{file.name}</p>
                                <p className="text-xs text-emerald-600 mt-0.5">{formatBytes(file.size)}</p>
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-slate-600">Choose a PDF or image to upload (max 25MB)</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                          <p className="text-sm text-blue-700">File replacement is not supported yet. You can edit metadata only.</p>
                        </div>
                      )}
                    </div>

                    {/* Footer (sticky-like) */}
                    <div
                      className="
                        shrink-0
                        px-5 py-4 border-t border-slate-100 bg-white
                        flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3
                        pb-[calc(env(safe-area-inset-bottom)+16px)]
                      "
                    >
                      <button
                        onClick={closeModal}
                        className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
                        disabled={busy}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitForm}
                        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        disabled={busy}
                      >
                        {busy ? "Saving..." : editTarget ? "Save changes" : "Upload Record"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ModalPortal>
          ) : null}
        </div>
      ) : (
        <div className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-6">
          {analysisHistory.length === 0 ? (
            <div className="text-center py-14">
              <ImageIcon className="w-16 h-16 text-slate-300 mx-auto" />
              <h3 className="mt-3 text-lg font-bold text-slate-700">No analyses yet</h3>
              <p className="text-slate-600 mt-1">Upload an X-ray in AI Chat to generate your first analysis report.</p>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/chat"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 w-full sm:w-auto"
                >
                  Go to AI Chat
                </Link>
                <Link
                  to="/history"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 w-full sm:w-auto"
                >
                  Open History
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {analysisHistory.map((x) => {
                const created = x.createdAt ? (x.createdAt instanceof Date ? x.createdAt : new Date(x.createdAt)) : null
                const prob = x.analysis?.probability
                const fracture = x.analysis?.fractureDetected
                return (
                  <div
                    key={x.id}
                    className="border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition bg-white"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {x.fileUrl ? (
                          <img src={x.fileUrl || "/placeholder.svg"} alt="xray" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{x.originalName || "X-ray Analysis"}</h4>
                            <p className="text-sm text-slate-600 mt-0.5">{created ? created.toLocaleString() : ""}</p>
                          </div>

                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                              fracture
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {fracture ? "Fracture suspected" : "No fracture"}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <p className="text-slate-500">Confidence</p>
                            <p className="font-bold text-slate-900">
                              {typeof prob === "number" ? `${Math.round(prob * 100)}%` : "—"}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <p className="text-slate-500">Timeline</p>
                            <p className="font-bold text-slate-900">{x.analysis?.recoveryTimeline || "—"}</p>
                          </div>
                        </div>

                        {x.analysis?.recommendations?.length ? (
                          <ul className="mt-3 text-sm text-slate-700 list-disc pl-5">
                            {x.analysis.recommendations.slice(0, 2).map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecordsTab
