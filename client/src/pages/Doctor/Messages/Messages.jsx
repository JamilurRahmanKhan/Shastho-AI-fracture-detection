/**
 * Frontend page: Messages
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// "use client"

// import { useEffect, useMemo, useRef, useState } from "react"
// import { useLocation } from "react-router-dom"
// import DoctorSidebar from "@/components/doctor/doctor-sidebar"
// import DoctorNavbar from "@/components/doctor/doctor-navbar"
// import { api } from "@/services/api"
// import { getMessagingSocket } from "@/services/messagingSocket"
// import { Search, SendHorizonal, Paperclip, X, ImageIcon, FileText, Video, MessageCircle, Users } from "lucide-react"
// import { useDoctorRealtime } from "@/contexts/DoctorRealtimeContext"
// import usePresence from "@/hooks/usePresence"

// function useQuery() {
//   const { search } = useLocation()
//   return useMemo(() => new URLSearchParams(search), [search])
// }

// function formatTime(ts) {
//   try {
//     return new Date(ts).toLocaleString()
//   } catch {
//     return ""
//   }
// }

// function bubbleClass(mine) {
//   return mine ? "ml-auto bg-blue-600 text-white" : "mr-auto bg-gray-50 text-slate-900 border border-gray-200"
// }

// function createClientMessageId() {
//   try {
//     return crypto.randomUUID()
//   } catch {
//     return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`
//   }
// }

// function isImage(mime = "") {
//   return mime.startsWith("image/")
// }

// function isVideo(mime = "") {
//   return mime.startsWith("video/")
// }

// function assetUrl(u) {
//   if (!u) return ""
//   const s = String(u)
//   if (/^https?:\/\//i.test(s)) return s
//   if (s.startsWith("/")) return s
//   if (s.startsWith("uploads/")) return `/${s}`
//   return `/uploads/${s}`
// }

// export default function DoctorMessages() {
//   const q = useQuery()
//   const preselectAppointmentId = q.get("appointmentId")

//   const [sidebarOpen, setSidebarOpen] = useState(false)

//   const [loading, setLoading] = useState(true)
//   const [threads, setThreads] = useState([])
//   const [threadsError, setThreadsError] = useState("")
//   const [filter, setFilter] = useState("")

//   const [activeThread, setActiveThread] = useState(null)
//   const [messages, setMessages] = useState([])
//   const [draft, setDraft] = useState("")
//   const [sending, setSending] = useState(false)
//   const [files, setFiles] = useState([])
//   const [uploading, setUploading] = useState(false)

//   const { call, setCallPeerName } = useDoctorRealtime()

//   useEffect(() => {
//     if (activeThread?.other?.name) setCallPeerName(activeThread.other.name)
//     else setCallPeerName("Patient")
//   }, [activeThread])
//   const presence = usePresence(activeThread?.other?.uid)

//   const listRef = useRef(null)
//   const fileInputRef = useRef(null)
//   const bottomRef = useRef(null)

//   const upsertMessage = (incoming) => {
//     if (!incoming) return
//     setMessages((prev) => {
//       const cid = incoming?.clientMessageId ? String(incoming.clientMessageId) : ""
//       const idx = prev.findIndex((m) => {
//         if (cid && m?.clientMessageId && String(m.clientMessageId) === cid) return true
//         if (incoming?.id && m?.id && String(m.id) === String(incoming.id)) return true
//         return false
//       })

//       if (idx >= 0) {
//         const next = [...prev]
//         next[idx] = { ...next[idx], ...incoming, _optimistic: false, _error: false }
//         return next
//       }
//       return [...prev, incoming]
//     })
//   }

//   const filteredThreads = useMemo(() => {
//     const f = filter.trim().toLowerCase()
//     if (!f) return threads
//     return threads.filter((t) => `${t?.other?.name || ""} ${t?.lastMessageText || ""}`.toLowerCase().includes(f))
//   }, [threads, filter])

//   const loadThreads = async () => {
//     const res = await api.listMessagingThreads({ limit: 100 })
//     const items = res?.items || []
//     setThreads(items)

//     if (preselectAppointmentId) {
//       const hit = items.find((x) => String(x.appointmentId) === String(preselectAppointmentId))
//       if (hit) setActiveThread(hit)
//     }

//     if (!preselectAppointmentId && !activeThread && items.length) {
//       setActiveThread(items[0])
//     }
//   }

//   useEffect(() => {
//     let mounted = true
//     ;(async () => {
//       try {
//         setLoading(true)
//         setThreadsError("")
//         await loadThreads()
//       } catch (e) {
//         if (!mounted) return
//         setThreadsError(e?.message || "Failed to load messages")
//       } finally {
//         if (mounted) setLoading(false)
//       }
//     })()
//     return () => {
//       mounted = false
//     }
//   }, [])

//   useEffect(() => {
//     let mounted = true
//     ;(async () => {
//       if (!activeThread?.id) return
//       try {
//         const res = await api.listThreadMessages(activeThread.id, { limit: 200 })
//         if (!mounted) return
//         setMessages(res?.items || [])

//         await api.markThreadRead(activeThread.id).catch(() => null)

//         setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? { ...t, unread: 0 } : t)))
//       } catch {
//         // ignore
//       }
//     })()
//     return () => {
//       mounted = false
//     }
//   }, [activeThread?.id])

//   useEffect(() => {
//     let cancelled = false
//     let socket = null

//     const onNew = (m) => {
//       if (String(m.threadId) !== String(activeThread?.id)) {
//         setThreads((prev) => prev.map((t) => (t.id === String(m.threadId) ? { ...t, unread: (t.unread || 0) + 1 } : t)))
//         return
//       }
//       upsertMessage(m)
//     }

//     const onDeleted = (payload) => {
//       if (!payload) return
//       if (String(payload.threadId) !== String(activeThread?.id)) return
//       const msg = payload?.message
//       const id = payload?.messageId || msg?.id
//       if (!id) return
//       setMessages((prev) =>
//         prev.map((x) =>
//           String(x.id) === String(id)
//             ? { ...x, ...(msg || {}), deletedForAll: true, text: "", attachments: [], _optimistic: false }
//             : x,
//         ),
//       )
//     }

//     const onThreadUpdate = () => {
//       loadThreads().catch(() => null)
//     }
//     ;(async () => {
//       socket = await getMessagingSocket()
//       if (!socket || cancelled) return

//       socket.on("message:new", onNew)
//       socket.on("message:deleted", onDeleted)
//       socket.on("thread:update", onThreadUpdate)

//       if (activeThread?.id) {
//         socket.emit("thread:join", activeThread.id, () => null)
//       }
//     })()

//     return () => {
//       cancelled = true
//       if (socket) {
//         socket.off("message:new", onNew)
//         socket.off("message:deleted", onDeleted)
//         socket.off("thread:update", onThreadUpdate)
//       }
//     }
//   }, [activeThread?.id])

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages.length])

//   const send = async () => {
//     const text = draft.trim()
//     if (!activeThread?.id) return
//     if (!text && files.length === 0) return
//     setSending(true)
//     setDraft("")

//     const clientMessageId = createClientMessageId()
//     let attachments = []

//     try {
//       if (files.length) {
//         setUploading(true)
//         const up = await api.uploadThreadFiles(activeThread.id, files)
//         attachments = up?.items || []
//       }
//     } catch (e) {
//       setUploading(false)
//       setSending(false)
//       console.warn(e)
//       return
//     } finally {
//       setUploading(false)
//     }

//     setFiles([])

//     const optimistic = {
//       id: `tmp_${clientMessageId}`,
//       clientMessageId,
//       threadId: activeThread.id,
//       senderRole: "doctor",
//       senderUid: "me",
//       text,
//       attachments,
//       createdAt: new Date().toISOString(),
//       _optimistic: true,
//     }
//     setMessages((prev) => [...prev, optimistic])

//     try {
//       const socket = await getMessagingSocket()
//       if (socket?.connected) {
//         const ack = await new Promise((resolve) => {
//           socket.emit("message:send", { threadId: activeThread.id, text, attachments, clientMessageId }, (a) =>
//             resolve(a),
//           )
//         })
//         if (!ack?.ok) throw new Error(ack?.error || "send_failed")
//         if (ack?.message) upsertMessage(ack.message)
//       } else {
//         const res = await api.sendThreadMessage(activeThread.id, { text, attachments, clientMessageId })
//         if (res?.message) upsertMessage(res.message)
//       }
//     } catch (e) {
//       setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, _error: true } : m)))
//       console.warn(e)
//     } finally {
//       setSending(false)
//     }
//   }

//   const onPickFiles = () => fileInputRef.current?.click()
//   const onFilesSelected = (e) => {
//     const incoming = Array.from(e.target.files || [])
//     if (incoming.length) {
//       setFiles((prev) => [...prev, ...incoming].slice(0, 10))
//     }
//     e.target.value = ""
//   }
//   const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))

//   const unsendMessage = async (messageId) => {
//     if (!activeThread?.id || !messageId) return
//     const ok = window.confirm("Unsend this message? It will be removed for both sides.")
//     if (!ok) return
//     setMessages((prev) =>
//       prev.map((m) =>
//         String(m.id) === String(messageId)
//           ? { ...m, deletedForAll: true, text: "", attachments: [], _optimistic: false }
//           : m,
//       ),
//     )
//     try {
//       await api.deleteThreadMessage(activeThread.id, messageId)
//     } catch (e) {
//       console.warn(e)
//       try {
//         const res = await api.listThreadMessages(activeThread.id, { limit: 200 })
//         setMessages(res?.items || [])
//       } catch {
//         // ignore
//       }
//     }
//   }

//   const deleteConversation = async (threadId) => {
//     const id = threadId || activeThread?.id
//     if (!id) return
//     const ok = window.confirm("Delete this conversation from your inbox? This only removes it for you.")
//     if (!ok) return
//     try {
//       await api.deleteMessagingThread(id)
//       setThreads((prev) => prev.filter((t) => t.id !== id))
//       if (activeThread?.id === id) {
//         setActiveThread(null)
//         setMessages([])
//       }
//     } catch (e) {
//       console.warn(e)
//     }
//   }

//   const clearChatHistory = async (threadId) => {
//     const id = threadId || activeThread?.id
//     if (!id) return
//     const ok = window.confirm(
//       "Clear chat history? Messages will show as 'This message was deleted' for both you and the patient.",
//     )
//     if (!ok) return

//     setMessages((prev) => prev.map((m) => ({ ...m, deletedForAll: true, text: "", attachments: [] })))
//     try {
//       await api.clearThreadHistory(id)
//     } catch (e) {
//       console.warn(e)
//       try {
//         const res = await api.listThreadMessages(id, { limit: 200 })
//         setMessages(res?.items || [])
//       } catch {
//         // ignore
//       }
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       <div className="lg:pl-64">
//         <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} title="Messages" showSearch={false} />

//         <main className="p-4 sm:p-6">
//           <div className="max-w-7xl mx-auto">
//             <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//               {/* Threads Sidebar */}
//               <div className="lg:col-span-4 xl:col-span-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
//                 <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50">
//                   <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversations</h2>
//                   <div className="flex items-center gap-2">
//                     <div className="relative w-full">
//                       <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
//                       <input
//                         value={filter}
//                         onChange={(e) => setFilter(e.target.value)}
//                         placeholder="Search patient name or message…"
//                         className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div ref={listRef} className="max-h-[70vh] overflow-y-auto">
//                   {loading ? (
//                     <div className="p-8 text-center">
//                       <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
//                         <MessageCircle className="w-6 h-6 text-blue-600" />
//                       </div>
//                       <p className="text-sm text-gray-600">Loading conversations…</p>
//                     </div>
//                   ) : threadsError ? (
//                     <div className="p-6 text-sm text-red-600 bg-red-50 border-b border-red-200">{threadsError}</div>
//                   ) : filteredThreads.length === 0 ? (
//                     <div className="p-8 text-center">
//                       <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
//                         <Users className="w-6 h-6 text-gray-400" />
//                       </div>
//                       <p className="text-sm font-medium text-gray-900">No conversations yet</p>
//                       <p className="text-xs text-gray-500 mt-1">
//                         Messages will appear here after your first appointment
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="divide-y divide-gray-100">
//                       {filteredThreads.map((t) => {
//                         const active = String(activeThread?.id) === String(t.id)
//                         return (
//                           <div
//                             key={t.id}
//                             className={`w-full p-4 transition-colors ${active ? "bg-blue-50 border-l-4 border-blue-500" : "bg-white hover:bg-gray-50"} flex items-start justify-between gap-3`}
//                           >
//                             <button onClick={() => setActiveThread(t)} className="flex-1 text-left min-w-0">
//                               <p className="font-semibold text-gray-900 truncate">{t?.other?.name || "Patient"}</p>
//                               <p className="text-xs text-gray-500 mt-0.5 truncate">{t.lastMessageText || "—"}</p>
//                               {t.lastMessageAt && (
//                                 <p className="text-[11px] text-gray-400 mt-1">{formatTime(t.lastMessageAt)}</p>
//                               )}
//                             </button>

//                             <div className="flex items-center gap-2 flex-shrink-0">
//                               {t.unread ? (
//                                 <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 text-xs font-bold rounded-full bg-blue-600 text-white">
//                                   {t.unread}
//                                 </span>
//                               ) : null}

//                               <div className="dropdown dropdown-end">
//                                 <button
//                                   tabIndex={0}
//                                   className="btn btn-ghost btn-xs text-gray-600 hover:text-gray-900"
//                                   onClick={(e) => e.stopPropagation()}
//                                   aria-label="Conversation menu"
//                                 >
//                                   ⋯
//                                 </button>
//                                 <ul
//                                   tabIndex={0}
//                                   className="dropdown-content z-[60] menu p-2 shadow bg-white rounded-lg w-52 border border-gray-200"
//                                   onClick={(e) => e.stopPropagation()}
//                                 >
//                                   <li>
//                                     <button
//                                       onClick={() => deleteConversation(t.id)}
//                                       className="text-red-600 hover:bg-red-50"
//                                     >
//                                       Delete conversation
//                                     </button>
//                                   </li>
//                                 </ul>
//                               </div>
//                             </div>
//                           </div>
//                         )
//                       })}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Chat Area */}
//               <div className="lg:col-span-8 xl:col-span-9 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
//                 <div className="p-4 sm:p-6 border-b border-gray-200 flex items-start justify-between gap-3 bg-gradient-to-r from-blue-50 to-blue-50">
//                   <div>
//                     <p className="font-semibold text-lg text-gray-900">
//                       {activeThread?.other?.name
//                         ? `Chat with ${activeThread.other.name}`
//                         : "Select a conversation to start"}
//                     </p>
//                     <p className="text-sm text-gray-600 mt-1">Secure messaging with your patient</p>
//                     {activeThread?.other?.uid ? (
//                       <p className="text-xs text-gray-600 mt-2">
//                         {presence.loading ? (
//                           "Checking status…"
//                         ) : presence.online ? (
//                           <span className="inline-flex items-center gap-1.5">
//                             <span className="w-2 h-2 rounded-full bg-blue-500" />
//                             <span className="font-medium">Online now</span>
//                           </span>
//                         ) : presence.lastSeenAt ? (
//                           <span>Last seen {formatTime(presence.lastSeenAt)}</span>
//                         ) : (
//                           "Offline"
//                         )}
//                       </p>
//                     ) : null}
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <button
//                       type="button"
//                       onClick={() => call.startCall(activeThread?.id)}
//                       disabled={!activeThread?.id || call.state !== "idle"}
//                       className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm"
//                       title={activeThread?.id ? "Start video call" : "Select a conversation"}
//                     >
//                       <Video className="w-4 h-4" />
//                       Video call
//                     </button>

//                     <div className="dropdown dropdown-end">
//                       <button
//                         tabIndex={0}
//                         className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-900"
//                         aria-label="Conversation menu"
//                         disabled={!activeThread?.id}
//                       >
//                         ⋯
//                       </button>
//                       <ul
//                         tabIndex={0}
//                         className="dropdown-content z-[60] menu p-2 shadow bg-white rounded-lg w-52 border border-gray-200"
//                       >
//                         <li>
//                           <button
//                             onClick={() => clearChatHistory(activeThread?.id)}
//                             className="text-gray-700 hover:bg-gray-50"
//                           >
//                             Clear chat history
//                           </button>
//                         </li>
//                         <li>
//                           <button
//                             onClick={() => deleteConversation(activeThread?.id)}
//                             className="text-red-600 hover:bg-red-50"
//                           >
//                             Delete conversation
//                           </button>
//                         </li>
//                       </ul>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex-1 p-4 sm:p-6 bg-white overflow-y-auto space-y-4">
//                   {!activeThread ? (
//                     <div className="h-full flex flex-col items-center justify-center text-center">
//                       <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
//                         <MessageCircle className="w-8 h-8 text-blue-600" />
//                       </div>
//                       <p className="text-lg font-semibold text-gray-900">No conversation selected</p>
//                       <p className="text-sm text-gray-600 mt-2">Choose a conversation from the list to get started</p>
//                     </div>
//                   ) : messages.length === 0 ? (
//                     <div className="h-full flex flex-col items-center justify-center text-center">
//                       <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
//                         <MessageCircle className="w-8 h-8 text-gray-400" />
//                       </div>
//                       <p className="text-lg font-semibold text-gray-900">Start the conversation</p>
//                       <p className="text-sm text-gray-600 mt-2">
//                         Send your first message to begin chatting with your patient
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="space-y-3">
//                       {messages.map((m) => {
//                         const mine = m.senderRole === "doctor" || m.senderUid === "me"

//                         if (m?.deletedForAll) {
//                           return (
//                             <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
//                               <div
//                                 className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${bubbleClass(mine)}`}
//                               >
//                                 <p className={`italic ${mine ? "text-white/80" : "text-gray-500"}`}>
//                                   This message was deleted.
//                                 </p>
//                                 <p className={`mt-2 text-[11px] ${mine ? "text-white/70" : "text-gray-500"}`}>
//                                   {formatTime(m.createdAt)}
//                                 </p>
//                               </div>
//                             </div>
//                           )
//                         }

//                         if (m?.kind === "call") {
//                           const status = m?.call?.status
//                           const dur = Number(m?.call?.durationSec || 0)
//                           const fmt = (s) => {
//                             const sec = Math.max(0, Math.floor(s))
//                             const mm = Math.floor(sec / 60)
//                             const rr = sec % 60
//                             return mm > 0 ? `${mm}:${String(rr).padStart(2, "0")}` : `0:${String(rr).padStart(2, "0")}`
//                           }
//                           let label = "Video call"
//                           if (status === "missed") label = "Missed video call"
//                           else if (status === "rejected") label = "Video call declined"
//                           else if (status === "cancelled") label = "Video call cancelled"
//                           else if (status === "completed") label = `Video call · ${fmt(dur)}`
//                           return (
//                             <div key={m.id} className="flex justify-center">
//                               <div className="text-xs text-gray-700 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
//                                 {label}
//                               </div>
//                             </div>
//                           )
//                         }
//                         return (
//                           <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
//                             <div
//                               className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${bubbleClass(mine)} ${m._error ? "opacity-70" : ""}`}
//                             >
//                               {mine && !m.deletedForAll && !String(m.id).startsWith("tmp_") ? (
//                                 <div className="dropdown dropdown-end absolute -top-2 -right-2 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
//                                   <button tabIndex={0} className="btn btn-ghost btn-xs" aria-label="Message actions">
//                                     ⋯
//                                   </button>
//                                   <ul
//                                     tabIndex={0}
//                                     className="dropdown-content z-[70] menu p-2 shadow bg-white rounded-lg w-44 border border-gray-200"
//                                   >
//                                     <li>
//                                       <button
//                                         onClick={() => unsendMessage(m.id)}
//                                         className="text-gray-700 hover:bg-gray-50"
//                                       >
//                                         Unsend
//                                       </button>
//                                     </li>
//                                   </ul>
//                                 </div>
//                               ) : null}

//                               {m.text ? <p className="whitespace-pre-wrap">{m.text}</p> : null}

//                               {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
//                                 <div
//                                   className={`mt-2 grid gap-2 ${m.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
//                                 >
//                                   {m.attachments.map((a, idx) => (
//                                     <div
//                                       key={`${m.id}_att_${idx}`}
//                                       className="rounded-lg overflow-hidden border border-gray-200 bg-white/80"
//                                     >
//                                       {isImage(a?.mime) ? (
//                                         <a
//                                           href={assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)}
//                                           target="_blank"
//                                           rel="noreferrer"
//                                           className="block"
//                                         >
//                                           <img
//                                             src={assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)}
//                                             alt={a.name || "attachment"}
//                                             className="w-full h-40 object-cover"
//                                           />
//                                         </a>
//                                       ) : isVideo(a?.mime) ? (
//                                         <video
//                                           src={assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)}
//                                           controls
//                                           className="w-full h-40 object-cover"
//                                         />
//                                       ) : (
//                                         <a
//                                           href={assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)}
//                                           target="_blank"
//                                           rel="noreferrer"
//                                           className="flex items-center gap-2 p-3 text-gray-700 hover:bg-gray-100"
//                                         >
//                                           <FileText className="w-4 h-4" />
//                                           <span className="text-sm truncate">{a.name || "Attachment"}</span>
//                                         </a>
//                                       )}
//                                     </div>
//                                   ))}
//                                 </div>
//                               ) : null}
//                               <p className={`mt-2 text-[11px] ${mine ? "text-white/70" : "text-gray-500"}`}>
//                                 {formatTime(m.createdAt)}
//                                 {m._error ? " · failed" : ""}
//                               </p>
//                             </div>
//                           </div>
//                         )
//                       })}
//                       <div ref={bottomRef} />
//                     </div>
//                   )}
//                 </div>

//                 <div className="p-4 sm:p-6 border-t border-gray-200 bg-white">
//                   <input
//                     ref={fileInputRef}
//                     type="file"
//                     multiple
//                     className="hidden"
//                     accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
//                     onChange={onFilesSelected}
//                   />

//                   {files.length > 0 ? (
//                     <div className="mb-3 flex flex-wrap gap-2">
//                       {files.map((f, idx) => (
//                         <div
//                           key={`${f.name}_${idx}`}
//                           className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 border border-gray-200"
//                         >
//                           {f.type.startsWith("image/") ? (
//                             <ImageIcon className="w-4 h-4 text-gray-600" />
//                           ) : (
//                             <Paperclip className="w-4 h-4 text-gray-600" />
//                           )}
//                           <span className="text-xs text-gray-700 max-w-[160px] truncate">{f.name}</span>
//                           <button
//                             onClick={() => removeFile(idx)}
//                             className="p-1 rounded-full hover:bg-gray-300 transition-colors"
//                             aria-label="Remove file"
//                           >
//                             <X className="w-3 h-3 text-gray-700" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : null}

//                   <div className="flex items-end gap-3">
//                     <button
//                       type="button"
//                       onClick={onPickFiles}
//                       disabled={!activeThread || sending || uploading}
//                       className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                       aria-label="Attach files"
//                       title="Attach files"
//                     >
//                       <Paperclip className="w-5 h-5 text-gray-700" />
//                     </button>

//                     <textarea
//                       value={draft}
//                       onChange={(e) => setDraft(e.target.value)}
//                       rows={2}
//                       placeholder={activeThread ? "Type your message here…" : "Select a conversation first"}
//                       disabled={!activeThread || uploading}
//                       className="w-full resize-none px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:placeholder-gray-400"
//                     />

//                     <button
//                       onClick={send}
//                       disabled={!activeThread || (draft.trim() === "" && files.length === 0) || sending || uploading}
//                       className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
//                     >
//                       {sending || uploading ? (
//                         <span className="loading loading-spinner loading-xs"></span>
//                       ) : (
//                         <SendHorizonal className="w-4 h-4" />
//                       )}
//                       {uploading ? "Uploading" : "Send"}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }


"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useLocation } from "react-router-dom"
import DoctorSidebar from "@/components/doctor/doctor-sidebar"
import DoctorNavbar from "@/components/doctor/doctor-navbar"
import { api } from "@/services/api"
import { getMessagingSocket } from "@/services/messagingSocket"
import {
  Search,
  SendHorizonal,
  Paperclip,
  X,
  ImageIcon,
  FileText,
  Video,
  MessageCircle,
  Users,
} from "lucide-react"
import { useDoctorRealtime } from "@/contexts/DoctorRealtimeContext"
import usePresence from "@/hooks/usePresence"

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ""
  }
}

function createClientMessageId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`
  }
}

function isImage(mime = "") {
  return mime.startsWith("image/")
}
function isVideo(mime = "") {
  return mime.startsWith("video/")
}

function assetUrl(u) {
  if (!u) return ""
  const s = String(u)
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith("/")) return s
  if (s.startsWith("uploads/")) return `/${s}`
  return `/uploads/${s}`
}

/** Clean bubble colors (user-friendly) */
function Bubble({ mine, children }) {
  return (
    <div
      className={[
        "relative max-w-[92%] sm:max-w-[72%] rounded-2xl px-4 py-3 text-sm shadow-sm",
        mine ? "ml-auto bg-blue-600 text-white" : "mr-auto bg-white text-slate-900 border border-slate-200",
      ].join(" ")}
    >
      {children}
    </div>
  )
}

/** Mobile Drawer (works) */
function MobileDrawer({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[9999] lg:hidden">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close drawer overlay" />
      <div className="absolute inset-y-0 left-0 w-[92vw] max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-extrabold text-slate-900">{title}</div>
          <button
            className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default function DoctorMessages() {
  const q = useQuery()
  const preselectAppointmentId = q.get("appointmentId")

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [threads, setThreads] = useState([])
  const [threadsError, setThreadsError] = useState("")
  const [filter, setFilter] = useState("")

  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const { call, setCallPeerName } = useDoctorRealtime()
  const presence = usePresence(activeThread?.other?.uid)

  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (activeThread?.other?.name) setCallPeerName(activeThread.other.name)
    else setCallPeerName("Patient")
  }, [activeThread, setCallPeerName])

  const filteredThreads = useMemo(() => {
    const f = filter.trim().toLowerCase()
    if (!f) return threads
    return threads.filter((t) => `${t?.other?.name || ""} ${t?.lastMessageText || ""}`.toLowerCase().includes(f))
  }, [threads, filter])

  const upsertMessage = (incoming) => {
    if (!incoming) return
    setMessages((prev) => {
      const cid = incoming?.clientMessageId ? String(incoming.clientMessageId) : ""
      const idx = prev.findIndex((m) => {
        if (cid && m?.clientMessageId && String(m.clientMessageId) === cid) return true
        if (incoming?.id && m?.id && String(m.id) === String(incoming.id)) return true
        return false
      })
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...incoming, _optimistic: false, _error: false }
        return next
      }
      return [...prev, incoming]
    })
  }

  const loadThreads = useCallback(async () => {
    const res = await api.listMessagingThreads({ limit: 100 })
    const items = res?.items || []
    setThreads(items)

    if (preselectAppointmentId) {
      const hit = items.find((x) => String(x.appointmentId) === String(preselectAppointmentId))
      if (hit) setActiveThread(hit)
    }

    if (!preselectAppointmentId && !activeThread && items.length) {
      setActiveThread(items[0])
    }
  }, [preselectAppointmentId, activeThread])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setThreadsError("")
        await loadThreads()
      } catch (e) {
        if (!mounted) return
        setThreadsError(e?.message || "Failed to load messages")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [loadThreads])

  // Load messages when thread changes
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!activeThread?.id) return
      try {
        const res = await api.listThreadMessages(activeThread.id, { limit: 200 })
        if (!mounted) return
        setMessages(res?.items || [])

        await api.markThreadRead(activeThread.id).catch(() => null)
        setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? { ...t, unread: 0 } : t)))
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [activeThread?.id])

  // Realtime
  useEffect(() => {
    let cancelled = false
    let socket = null

    const onNew = (m) => {
      if (String(m.threadId) !== String(activeThread?.id)) {
        setThreads((prev) =>
          prev.map((t) => (t.id === String(m.threadId) ? { ...t, unread: (t.unread || 0) + 1 } : t)),
        )
        return
      }
      upsertMessage(m)
    }

    const onThreadUpdate = () => loadThreads().catch(() => null)

    ;(async () => {
      socket = await getMessagingSocket()
      if (!socket || cancelled) return

      socket.on("message:new", onNew)
      socket.on("thread:update", onThreadUpdate)

      if (activeThread?.id) socket.emit("thread:join", activeThread.id, () => null)
    })()

    return () => {
      cancelled = true
      if (socket) {
        socket.off("message:new", onNew)
        socket.off("thread:update", onThreadUpdate)
      }
    }
  }, [activeThread?.id, loadThreads])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length])

  const onPickFiles = () => fileInputRef.current?.click()
  const onFilesSelected = (e) => {
    const incoming = Array.from(e.target.files || [])
    if (incoming.length) setFiles((prev) => [...prev, ...incoming].slice(0, 10))
    e.target.value = ""
  }
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const send = async () => {
    const text = draft.trim()
    if (!activeThread?.id) return
    if (!text && files.length === 0) return

    setSending(true)
    setDraft("")

    const clientMessageId = createClientMessageId()
    let attachments = []

    try {
      if (files.length) {
        setUploading(true)
        const up = await api.uploadThreadFiles(activeThread.id, files)
        attachments = up?.items || []
      }
    } catch (e) {
      setUploading(false)
      setSending(false)
      console.warn(e)
      return
    } finally {
      setUploading(false)
    }

    setFiles([])

    const optimistic = {
      id: `tmp_${clientMessageId}`,
      clientMessageId,
      threadId: activeThread.id,
      senderRole: "doctor",
      senderUid: "me",
      text,
      attachments,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const socket = await getMessagingSocket()
      if (socket?.connected) {
        const ack = await new Promise((resolve) => {
          socket.emit("message:send", { threadId: activeThread.id, text, attachments, clientMessageId }, (a) =>
            resolve(a),
          )
        })
        if (!ack?.ok) throw new Error(ack?.error || "send_failed")
        if (ack?.message) upsertMessage(ack.message)
      } else {
        const res = await api.sendThreadMessage(activeThread.id, { text, attachments, clientMessageId })
        if (res?.message) upsertMessage(res.message)
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, _error: true } : m)))
      console.warn(e)
    } finally {
      setSending(false)
    }
  }

  const onDraftKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const ThreadList = (
    <div className="h-full flex flex-col min-h-0">
      <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-extrabold text-slate-900">Conversations</h2>
          <button
            className="lg:hidden px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-800"
            onClick={() => setMobileThreadsOpen(false)}
          >
            Done
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search patient or message…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-white">
        {loading ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600">Loading conversations…</p>
          </div>
        ) : threadsError ? (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">{threadsError}</div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-900">No conversations yet</p>
            <p className="text-xs text-slate-500 mt-1">Messages appear after your first appointment</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredThreads.map((t) => {
              const active = String(activeThread?.id) === String(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveThread(t)
                    setMobileThreadsOpen(false)
                  }}
                  className={[
                    "w-full text-left p-4 flex items-start justify-between gap-3 transition",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                    active ? "bg-blue-50 border-l-4 border-blue-600" : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-900 truncate">{t?.other?.name || "Patient"}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{t.lastMessageText || "—"}</p>
                    {t.lastMessageAt ? (
                      <p className="text-[11px] text-slate-400 mt-1">{formatTime(t.lastMessageAt)}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.unread ? (
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 text-xs font-extrabold rounded-full bg-blue-600 text-white">
                        {t.unread}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="h-[100dvh] bg-slate-100 overflow-hidden overflow-x-hidden">
      <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 h-full flex flex-col min-h-0">
        <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} title="Messages" showSearch={false} />

        <main className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto h-full min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
              {/* Threads desktop */}
              <div className="hidden lg:block lg:col-span-4 xl:col-span-3 h-full min-h-0">
                <div className="h-full min-h-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  {ThreadList}
                </div>
              </div>

              {/* ✅ Threads mobile drawer (FIXED: open uses state) */}
              <MobileDrawer
                open={mobileThreadsOpen}
                title="Conversations"
                onClose={() => setMobileThreadsOpen(false)}
              >
                {ThreadList}
              </MobileDrawer>

              {/* Chat */}
              <div className="lg:col-span-8 xl:col-span-9 h-full min-h-0">
                <div className="h-full min-h-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  {/* Header */}
                  <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            className="lg:hidden px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-800"
                            onClick={() => setMobileThreadsOpen(true)}
                            type="button"
                          >
                            Chats
                          </button>

                          <p className="font-extrabold text-lg text-slate-900 truncate">
                            {activeThread?.other?.name ? `Chat with ${activeThread.other.name}` : "Select a conversation"}
                          </p>
                        </div>

                        <p className="text-sm text-slate-600 mt-1">Secure messaging with your patient</p>

                        {activeThread?.other?.uid ? (
                          <p className="text-xs text-slate-600 mt-2">
                            {presence.loading ? (
                              "Checking status…"
                            ) : presence.online ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-semibold">Online now</span>
                              </span>
                            ) : presence.lastSeenAt ? (
                              <span>Last seen {formatTime(presence.lastSeenAt)}</span>
                            ) : (
                              "Offline"
                            )}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => call.startCall(activeThread?.id)}
                          disabled={!activeThread?.id || call.state !== "idle"}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm"
                        >
                          <Video className="w-4 h-4" />
                          <span className="hidden sm:inline">Video call</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
                    <div className="px-4 sm:px-6 py-4 space-y-3">
                      {!activeThread ? (
                        <div className="h-[55vh] flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-blue-600" />
                          </div>
                          <p className="text-lg font-extrabold text-slate-900">No conversation selected</p>
                          <p className="text-sm text-slate-600 mt-2">Choose a conversation to start chatting</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((m) => {
                            const mine = m.senderRole === "doctor" || m.senderUid === "me"

                            return (
                              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                <Bubble mine={mine}>
                                  {m.text ? <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p> : null}

                                  {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
                                    <div className={`mt-3 grid gap-2 ${m.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                                      {m.attachments.map((a, idx) => {
                                        const url = assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)
                                        return (
                                          <div key={`${m.id}_att_${idx}`} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                                            {isImage(a?.mime) ? (
                                              <a href={url} target="_blank" rel="noreferrer" className="block">
                                                <img src={url} alt={a.name || "attachment"} className="w-full h-40 object-cover" />
                                              </a>
                                            ) : isVideo(a?.mime) ? (
                                              <video src={url} controls className="w-full h-40 object-cover" />
                                            ) : (
                                              <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 text-slate-800 hover:bg-slate-50">
                                                <FileText className="w-4 h-4" />
                                                <span className="text-sm truncate">{a.name || "Attachment"}</span>
                                              </a>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : null}

                                  <p className={`mt-2 text-[11px] ${mine ? "text-white/75" : "text-slate-400"}`}>
                                    {formatTime(m.createdAt)}
                                    {m._error ? " · failed" : ""}
                                  </p>
                                </Bubble>
                              </div>
                            )
                          })}
                          <div ref={bottomRef} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Composer */}
                  <div className="border-t border-slate-200 bg-white">
                    <div className="p-3 sm:p-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        onChange={onFilesSelected}
                      />

                      {files.length > 0 ? (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {files.map((f, idx) => (
                            <div
                              key={`${f.name}_${idx}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 border border-slate-200"
                            >
                              {f.type.startsWith("image/") ? (
                                <ImageIcon className="w-4 h-4 text-slate-600" />
                              ) : (
                                <Paperclip className="w-4 h-4 text-slate-600" />
                              )}
                              <span className="text-xs text-slate-700 max-w-[170px] truncate">{f.name}</span>
                              <button
                                onClick={() => removeFile(idx)}
                                className="p-1 rounded-full hover:bg-slate-200 transition"
                                aria-label="Remove file"
                                type="button"
                              >
                                <X className="w-3 h-3 text-slate-700" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-end gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={onPickFiles}
                          disabled={!activeThread || sending || uploading}
                          className="shrink-0 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                          aria-label="Attach files"
                          title="Attach files"
                        >
                          <Paperclip className="w-5 h-5 text-slate-700" />
                        </button>

                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={onDraftKeyDown}
                          rows={2}
                          placeholder={
                            activeThread
                              ? "Type your message… (Enter to send, Shift+Enter for new line)"
                              : "Select a conversation first"
                          }
                          disabled={!activeThread || uploading}
                          className="w-full min-w-0 resize-none px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                        />

                        <button
                          type="button"
                          onClick={send}
                          disabled={!activeThread || (draft.trim() === "" && files.length === 0) || sending || uploading}
                          className="shrink-0 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                          {sending || uploading ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <SendHorizonal className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">{uploading ? "Uploading" : "Send"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* end composer */}
                </div>
              </div>
              {/* end chat */}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
