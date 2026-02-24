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
// import { Search, Send, Paperclip, X, FileText, Video, MoreVertical, MessageCircle } from "lucide-react"

// import { api } from "@/services/api"
// import { getMessagingSocket } from "@/services/messagingSocket"
// import { useAuth } from "@/contexts/AuthContext"
// import usePresence from "@/hooks/usePresence"
// import { useUserRealtime } from "@/contexts/UserRealtimeContext"

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

// function formatDuration(sec) {
//   const s = Math.max(0, Math.floor(Number(sec) || 0))
//   const m = Math.floor(s / 60)
//   const r = s % 60
//   if (m <= 0) return `${r}s`
//   return `${m}m ${String(r).padStart(2, "0")}s`
// }

// function bubbleClass(mine) {
//   return mine
//     ? "ml-auto bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md"
//     : "mr-auto bg-white text-gray-900 border border-gray-200 shadow-sm"
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

// function callLine(m) {
//   const status = m?.call?.status || ""
//   const dur = Number(m?.call?.durationSec || 0)
//   if (status === "completed") return `📹 Video call • ${formatDuration(dur)}`
//   if (status === "missed") return "📹 Missed video call"
//   if (status === "rejected") return "📹 Video call declined"
//   if (status === "cancelled") return "📹 Video call cancelled"
//   return "📹 Video call"
// }

// export default function UserMessages() {
//   const q = useQuery()
//   const preselectAppointmentId = q.get("appointmentId")

//   const { profile } = useAuth()
//   const { call, setCallPeerName } = useUserRealtime()

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

//   const presence = usePresence(activeThread?.other?.uid)

//   const fileInputRef = useRef(null)
//   const bottomRef = useRef(null)

//   useEffect(() => {
//     if (activeThread?.other?.name) setCallPeerName(activeThread.other.name)
//     else setCallPeerName("Doctor")
//   }, [activeThread, setCallPeerName])

//   const filteredThreads = useMemo(() => {
//     const f = filter.trim().toLowerCase()
//     if (!f) return threads
//     return threads.filter((t) => `${t?.other?.name || ""} ${t?.lastMessageText || ""}`.toLowerCase().includes(f))
//   }, [threads, filter])

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

//   const loadMessages = async (threadId) => {
//     if (!threadId) return
//     const res = await api.listThreadMessages(threadId, { limit: 200 })
//     setMessages(res?.items || [])
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
//         setThreadsError(e?.message || "Failed to load conversations")
//       } finally {
//         if (mounted) setLoading(false)
//       }
//     })()
//     return () => {
//       mounted = false
//     }
//   }, [profile?.uid])

//   useEffect(() => {
//     let mounted = true
//     ;(async () => {
//       if (!activeThread?.id) {
//         setMessages([])
//         return
//       }
//       try {
//         await loadMessages(activeThread.id)
//       } catch {
//         if (!mounted) return
//         setMessages([])
//       }
//     })()
//     return () => {
//       mounted = false
//     }
//   }, [activeThread?.id])

//   useEffect(() => {
//     let socket
//     let mounted = true
//     const activeThreadId = activeThread?.id ? String(activeThread.id) : ""

//     const onMessageNew = (m) => {
//       if (!mounted) return
//       if (String(m?.threadId || "") !== activeThreadId) return
//       upsertMessage(m)
//     }

//     const onThreadUpdate = () => {
//       if (!mounted) return
//       loadThreads().catch(() => null)
//     }
//     ;(async () => {
//       socket = await getMessagingSocket()
//       if (!socket || !mounted) return
//       if (activeThreadId) {
//         socket.emit("thread:join", activeThreadId, () => null)
//       }
//       socket.on("message:new", onMessageNew)
//       socket.on("thread:update", onThreadUpdate)
//     })()

//     return () => {
//       mounted = false
//       if (socket) {
//         socket.off("message:new", onMessageNew)
//         socket.off("thread:update", onThreadUpdate)
//       }
//     }
//   }, [activeThread?.id])

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
//   }, [messages.length])

//   const onFilesSelected = (e) => {
//     const list = Array.from(e.target.files || [])
//     if (!list.length) return
//     const next = [...files, ...list].slice(0, 5)
//     setFiles(next)
//     e.target.value = ""
//   }

//   const removeFile = (idx) => {
//     setFiles((prev) => prev.filter((_, i) => i !== idx))
//   }

//   const uploadAttachments = async () => {
//     if (!activeThread?.id) return []
//     if (!files.length) return []
//     setUploading(true)
//     try {
//       const res = await api.uploadThreadFiles(activeThread.id, files)
//       const items = Array.isArray(res?.items) ? res.items : []
//       return items.map((it) => ({
//         url: it.url,
//         name: it.originalName || it.name || "Attachment",
//         mime: it.contentType || "",
//         size: it.size || 0,
//       }))
//     } finally {
//       setUploading(false)
//     }
//   }

//   const sendMessage = async () => {
//     if (!activeThread?.id) return
//     const text = draft.trim()
//     if (!text && files.length === 0) return
//     if (sending || uploading) return

//     setSending(true)
//     const clientMessageId = createClientMessageId()

//     let attachments = []
//     try {
//       if (files.length) attachments = await uploadAttachments()
//     } catch {
//       // ignore
//     }

//     const optimistic = {
//       id: `tmp_${clientMessageId}`,
//       threadId: activeThread.id,
//       senderUid: "me",
//       senderRole: "user",
//       kind: "text",
//       call: null,
//       text,
//       attachments,
//       clientMessageId,
//       createdAt: new Date().toISOString(),
//       _optimistic: true,
//       _error: false,
//     }
//     if (text || attachments.length) upsertMessage(optimistic)

//     try {
//       const socket = await getMessagingSocket()
//       const ack = await new Promise((resolve) => {
//         socket.emit("message:send", { threadId: activeThread.id, text, attachments, clientMessageId }, (a) =>
//           resolve(a),
//         )
//       })
//       if (!ack?.ok) throw new Error(ack?.error || "send_failed")
//       if (ack?.message) upsertMessage(ack.message)
//       setDraft("")
//       setFiles([])
//     } catch {
//       setMessages((prev) =>
//         prev.map((m) => (String(m.clientMessageId) === String(clientMessageId) ? { ...m, _error: true } : m)),
//       )
//     } finally {
//       setSending(false)
//     }
//   }

//   const clearChatHistory = async (threadId) => {
//     const id = threadId || activeThread?.id
//     if (!id) return
//     const ok = window.confirm(
//       "Clear chat history? Messages will show as 'This message was deleted' for both you and the doctor.",
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
//     <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-slate-50 to-blue-50">
//       <div className="mx-auto max-w-7xl h-[calc(100vh-72px)] flex flex-col px-4 py-6 lg:px-6">
//         <div className="mb-6">
//           <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
//           <p className="mt-2 text-gray-600">Connect with your healthcare providers</p>
//         </div>

//         {threadsError ? (
//           <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{threadsError}</div>
//         ) : null}

//         <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 min-h-0">
//           <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
//             <div className="p-4 border-b border-gray-100">
//               <div className="relative">
//                 <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
//                 <input
//                   value={filter}
//                   onChange={(e) => setFilter(e.target.value)}
//                   placeholder="Find a doctor or message..."
//                   className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
//                 />
//               </div>
//             </div>
//             <div className="flex-1 overflow-y-auto">
//               {loading ? (
//                 <div className="p-6 flex items-center justify-center">
//                   <div className="text-sm text-gray-600">
//                     <div className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
//                     Loading your conversations...
//                   </div>
//                 </div>
//               ) : filteredThreads.length === 0 ? (
//                 <div className="p-6 flex items-center justify-center">
//                   <div className="text-center">
//                     <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
//                     <p className="text-sm text-gray-600">No conversations yet</p>
//                     <p className="text-xs text-gray-500 mt-1">Your messages will appear here</p>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="divide-y divide-gray-100">
//                   {filteredThreads.map((t) => {
//                     const active = String(activeThread?.id || "") === String(t.id)
//                     return (
//                       <button
//                         key={t.id}
//                         type="button"
//                         onClick={() => setActiveThread(t)}
//                         className={`w-full text-left p-4 hover:bg-blue-50 transition ${
//                           active ? "bg-blue-50 border-l-4 border-blue-600" : "bg-white"
//                         }`}
//                       >
//                         <div className="flex items-start justify-between gap-3">
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-semibold text-gray-900">
//                               {t.other?.name || "Healthcare Provider"}
//                             </p>
//                             <p className="mt-1 text-xs text-gray-600 line-clamp-1">
//                               {t.lastMessageText || "No messages yet"}
//                             </p>
//                           </div>
//                           {t.unreadCount ? (
//                             <span className="shrink-0 rounded-full bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 animate-pulse">
//                               {t.unreadCount}
//                             </span>
//                           ) : null}
//                         </div>
//                       </button>
//                     )
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
//             {/* Header */}
//             <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4 bg-gradient-to-r from-white to-blue-50">
//               <div className="flex-1 min-w-0">
//                 <p className="text-base font-semibold text-gray-900">
//                   {activeThread?.other?.name || "Select a conversation"}
//                 </p>
//                 {activeThread?.other?.uid ? (
//                   <p className="mt-1 text-xs text-gray-600 flex items-center gap-1.5">
//                     <span
//                       className={`inline-block w-2 h-2 rounded-full ${presence?.online ? "bg-green-500" : "bg-gray-400"}`}
//                     ></span>
//                     {presence?.online ? "Online" : "Offline"}
//                   </p>
//                 ) : null}
//               </div>

//               {activeThread ? (
//                 <div className="flex items-center gap-2 shrink-0">
//                   <button
//                     type="button"
//                     onClick={() => call?.startCall?.(activeThread.id)}
//                     className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 transition shadow-sm"
//                   >
//                     <Video className="w-4 h-4" />
//                     <span className="hidden sm:inline">Video call</span>
//                   </button>

//                   <div className="relative group">
//                     <button
//                       type="button"
//                       className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
//                       aria-label="Conversation actions"
//                     >
//                       <MoreVertical className="w-5 h-5" />
//                     </button>
//                     <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
//                       <button
//                         onClick={() => clearChatHistory(activeThread.id)}
//                         className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition"
//                       >
//                         Clear chat history
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ) : null}
//             </div>

//             {/* Messages area */}
//             <div className="flex-1 p-6 bg-white overflow-y-auto">
//               {!activeThread ? (
//                 <div className="h-full flex flex-col items-center justify-center gap-4">
//                   <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
//                     <MessageCircle className="w-8 h-8 text-blue-600" />
//                   </div>
//                   <div className="text-center max-w-xs">
//                     <p className="text-lg font-semibold text-gray-900">No conversation selected</p>
//                     <p className="text-sm text-gray-600 mt-2">
//                       Choose a doctor from the list to start or continue a conversation
//                     </p>
//                   </div>
//                 </div>
//               ) : messages.length === 0 ? (
//                 <div className="h-full flex flex-col items-center justify-center gap-4">
//                   <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
//                     <Send className="w-8 h-8 text-blue-600" />
//                   </div>
//                   <div className="text-center max-w-xs">
//                     <p className="text-lg font-semibold text-gray-900">Start the conversation</p>
//                     <p className="text-sm text-gray-600 mt-2">Share your concerns or ask your doctor a question</p>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4 flex flex-col">
//                   {messages.map((m) => {
//                     const mine = m.senderRole === "user" || m.senderUid === "me"

//                     if (m.deletedForAll) {
//                       return (
//                         <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
//                           <div className={`max-w-xs rounded-lg px-4 py-3 text-sm ${bubbleClass(mine)}`}>
//                             <p className={`italic ${mine ? "text-white/80" : "text-gray-500"}`}>
//                               This message was deleted
//                             </p>
//                             <p className={`mt-1 text-xs ${mine ? "text-white/60" : "text-gray-400"}`}>
//                               {formatTime(m.createdAt)}
//                             </p>
//                           </div>
//                         </div>
//                       )
//                     }

//                     if (m.kind === "call") {
//                       return (
//                         <div key={m.id} className="flex justify-center">
//                           <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
//                             {callLine(m)}
//                           </div>
//                         </div>
//                       )
//                     }

//                     return (
//                       <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
//                         <div
//                           className={`relative max-w-xs rounded-lg px-4 py-3 text-sm ${bubbleClass(mine)} ${m._error ? "opacity-70" : ""}`}
//                         >
//                           {m.text ? <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p> : null}

//                           {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
//                             <div
//                               className={`mt-3 grid gap-2 ${m.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
//                             >
//                               {m.attachments.map((a, idx) => (
//                                 <div
//                                   key={`${m.id}_att_${idx}`}
//                                   className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
//                                 >
//                                   {isImage(a?.mime) ? (
//                                     <a
//                                       href={assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)}
//                                       target="_blank"
//                                       rel="noreferrer"
//                                       className="block hover:opacity-90 transition"
//                                     >
//                                       <img
//                                         src={assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)}
//                                         alt={a.name || "attachment"}
//                                         className="w-full h-40 object-cover"
//                                       />
//                                     </a>
//                                   ) : isVideo(a?.mime) ? (
//                                     <video
//                                       src={assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)}
//                                       controls
//                                       className="w-full h-40 object-cover"
//                                     />
//                                   ) : (
//                                     <a
//                                       href={assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)}
//                                       target="_blank"
//                                       rel="noreferrer"
//                                       className="flex items-center gap-2 p-3 text-gray-700 hover:bg-gray-100 transition"
//                                     >
//                                       <FileText className="w-4 h-4 shrink-0" />
//                                       <span className="text-xs truncate">{a.name || "Attachment"}</span>
//                                     </a>
//                                   )}
//                                 </div>
//                               ))}
//                             </div>
//                           ) : null}
//                           <p className={`mt-2 text-xs ${mine ? "text-white/60" : "text-gray-500"}`}>
//                             {formatTime(m.createdAt)}
//                             {m._error ? " · Failed to send" : ""}
//                           </p>
//                         </div>
//                       </div>
//                     )
//                   })}
//                   <div ref={bottomRef} />
//                 </div>
//               )}
//             </div>

//             <div className="p-5 border-t border-gray-100 bg-white">
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 multiple
//                 className="hidden"
//                 accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
//                 onChange={onFilesSelected}
//               />

//               {files.length > 0 ? (
//                 <div className="mb-4 flex flex-wrap gap-2">
//                   {files.map((f, idx) => (
//                     <div
//                       key={`${f.name}_${idx}`}
//                       className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
//                     >
//                       <span className="truncate max-w-[120px]">{f.name}</span>
//                       <button
//                         type="button"
//                         className="text-gray-500 hover:text-gray-900 transition"
//                         onClick={() => removeFile(idx)}
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               ) : null}

//               <div className="flex items-end gap-3">
//                 <button
//                   type="button"
//                   onClick={() => fileInputRef.current?.click()}
//                   className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
//                   title="Attach files"
//                 >
//                   <Paperclip className="w-4 h-4" />
//                 </button>
//                 <input
//                   value={draft}
//                   onChange={(e) => setDraft(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter" && !e.shiftKey && !uploading && !sending) {
//                       e.preventDefault()
//                       sendMessage()
//                     }
//                   }}
//                   placeholder="Type your message here... (Shift+Enter for new line)"
//                   disabled={!activeThread}
//                   className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed resize-none"
//                   style={{ height: "44px" }}
//                 />
//                 <button
//                   type="button"
//                   onClick={sendMessage}
//                   disabled={(!draft.trim() && !files.length) || sending || uploading || !activeThread}
//                   className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
//                   title="Send message"
//                 >
//                   <Send className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import {
  Search,
  Send,
  Paperclip,
  X,
  FileText,
  Video,
  MoreVertical,
  MessageCircle,
  ArrowLeft,
} from "lucide-react"

import { api } from "@/services/api"
import { getMessagingSocket } from "@/services/messagingSocket"
import { useAuth } from "@/contexts/AuthContext"
import usePresence from "@/hooks/usePresence"
import { useUserRealtime } from "@/contexts/UserRealtimeContext"

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

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m <= 0) return `${r}s`
  return `${m}m ${String(r).padStart(2, "0")}s`
}

function bubbleClass(mine) {
  return mine
    ? "ml-auto bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md"
    : "mr-auto bg-white text-gray-900 border border-gray-200 shadow-sm"
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

function callLine(m) {
  const status = m?.call?.status || ""
  const dur = Number(m?.call?.durationSec || 0)
  if (status === "completed") return `📹 Video call • ${formatDuration(dur)}`
  if (status === "missed") return "📹 Missed video call"
  if (status === "rejected") return "📹 Video call declined"
  if (status === "cancelled") return "📹 Video call cancelled"
  return "📹 Video call"
}

function getInitials(name) {
  const safe = String(name || "").trim()
  if (!safe) return "D"
  const parts = safe.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] || "D"
  const b = parts[1]?.[0] || ""
  return (a + b).toUpperCase()
}

export default function UserMessages() {
  const q = useQuery()
  const preselectAppointmentId = q.get("appointmentId")

  const { profile } = useAuth()
  const { call, setCallPeerName } = useUserRealtime()

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

  // ✅ Only true mobile: < md
  const [isNarrow, setIsNarrow] = useState(false)
  // Mobile: "list" or "chat"
  const [mobileView, setMobileView] = useState("list")

  const presence = usePresence(activeThread?.other?.uid)

  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  const actionsRef = useRef(null)
  const [actionsOpen, setActionsOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 767px)") // < md
    const apply = () => setIsNarrow(!!mq.matches)
    apply()
    mq.addEventListener?.("change", apply)
    return () => mq.removeEventListener?.("change", apply)
  }, [])

  useEffect(() => {
    if (activeThread?.other?.name) setCallPeerName(activeThread.other.name)
    else setCallPeerName("Doctor")
  }, [activeThread, setCallPeerName])

  // Close actions dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const filteredThreads = useMemo(() => {
    const f = filter.trim().toLowerCase()
    if (!f) return threads
    return threads.filter((t) =>
      `${t?.other?.name || ""} ${t?.lastMessageText || ""}`.toLowerCase().includes(f),
    )
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

  const loadThreads = async () => {
    // If we arrived here from an appointment card, ensure the thread exists first.
    // This prevents "Message doctor" / "Message patient" from landing on an empty inbox
    // when the appointment thread was not created for any reason.
    let ensuredThread = null
    if (preselectAppointmentId) {
      try {
        ensuredThread = await api.getMessagingThreadForAppointment(preselectAppointmentId)
      } catch (e) {
        // Best-effort: if messaging isn't enabled yet or API fails, we still load existing threads.
        // (UI will show the normal state.)
        console.warn("Failed to ensure messaging thread:", e?.message || e)
      }
    }

    const res = await api.listMessagingThreads({ limit: 100 })
    const items = res?.items || []
    setThreads(items)

    if (preselectAppointmentId) {
      const hit =
        items.find((x) => String(x.appointmentId) === String(preselectAppointmentId)) ||
        (ensuredThread ? items.find((x) => String(x.id) === String(ensuredThread.id)) : null)

      if (hit) {
        setActiveThread(hit)
      } else if (ensuredThread?.id) {
        // Thread exists but isn't in the list response shape; still allow chat to open.
        setActiveThread({
          id: ensuredThread.id,
          appointmentId: ensuredThread.appointmentId,
          other: ensuredThread.other,
        })
      }
    }

    if (!preselectAppointmentId && !activeThread && items.length) {
      setActiveThread(items[0])
    }
  }

  const loadMessages = async (threadId) => {
    if (!threadId) return
    const res = await api.listThreadMessages(threadId, { limit: 200 })
    setMessages(res?.items || [])
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setThreadsError("")
        await loadThreads()
      } catch (e) {
        if (!mounted) return
        setThreadsError(e?.message || "Failed to load conversations")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [profile?.uid])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!activeThread?.id) {
        setMessages([])
        return
      }
      try {
        await loadMessages(activeThread.id)
      } catch {
        if (!mounted) return
        setMessages([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [activeThread?.id])

  useEffect(() => {
    let socket
    let mounted = true
    const activeThreadId = activeThread?.id ? String(activeThread.id) : ""

    const onMessageNew = (m) => {
      if (!mounted) return
      if (String(m?.threadId || "") !== activeThreadId) return
      upsertMessage(m)
    }

    const onThreadUpdate = () => {
      if (!mounted) return
      loadThreads().catch(() => null)
    }

    ;(async () => {
      socket = await getMessagingSocket()
      if (!socket || !mounted) return
      if (activeThreadId) socket.emit("thread:join", activeThreadId, () => null)
      socket.on("message:new", onMessageNew)
      socket.on("thread:update", onThreadUpdate)
    })()

    return () => {
      mounted = false
      if (socket) {
        socket.off("message:new", onMessageNew)
        socket.off("thread:update", onThreadUpdate)
      }
    }
  }, [activeThread?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length])

  // ✅ Mobile UX: open chat fullscreen on narrow screens
  const selectThread = (t) => {
    setActiveThread(t)
    if (isNarrow) setMobileView("chat")
  }

  // If user lands with preselected thread, open chat on mobile
  useEffect(() => {
    if (activeThread?.id && isNarrow) setMobileView("chat")
  }, [activeThread?.id, isNarrow])

  const onFilesSelected = (e) => {
    const list = Array.from(e.target.files || [])
    if (!list.length) return
    const next = [...files, ...list].slice(0, 5)
    setFiles(next)
    e.target.value = ""
  }

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const uploadAttachments = async () => {
    if (!activeThread?.id) return []
    if (!files.length) return []
    setUploading(true)
    try {
      const res = await api.uploadThreadFiles(activeThread.id, files)
      const items = Array.isArray(res?.items) ? res.items : []
      return items.map((it) => ({
        url: it.url,
        name: it.originalName || it.name || "Attachment",
        mime: it.contentType || "",
        size: it.size || 0,
      }))
    } finally {
      setUploading(false)
    }
  }

  const sendMessage = async () => {
    if (!activeThread?.id) return
    const text = draft.trim()
    if (!text && files.length === 0) return
    if (sending || uploading) return

    setSending(true)
    const clientMessageId = createClientMessageId()

    let attachments = []
    try {
      if (files.length) attachments = await uploadAttachments()
    } catch {
      // ignore
    }

    const optimistic = {
      id: `tmp_${clientMessageId}`,
      threadId: activeThread.id,
      senderUid: "me",
      senderRole: "user",
      kind: "text",
      call: null,
      text,
      attachments,
      clientMessageId,
      createdAt: new Date().toISOString(),
      _optimistic: true,
      _error: false,
    }
    if (text || attachments.length) upsertMessage(optimistic)

    try {
      const socket = await getMessagingSocket()
      const ack = await new Promise((resolve) => {
        socket.emit("message:send", { threadId: activeThread.id, text, attachments, clientMessageId }, (a) =>
          resolve(a),
        )
      })
      if (!ack?.ok) throw new Error(ack?.error || "send_failed")
      if (ack?.message) upsertMessage(ack.message)
      setDraft("")
      setFiles([])
    } catch {
      setMessages((prev) =>
        prev.map((m) => (String(m.clientMessageId) === String(clientMessageId) ? { ...m, _error: true } : m)),
      )
    } finally {
      setSending(false)
    }
  }

  const clearChatHistory = async (threadId) => {
    const id = threadId || activeThread?.id
    if (!id) return
    const ok = window.confirm(
      "Clear chat history? Messages will show as 'This message was deleted' for both you and the doctor.",
    )
    if (!ok) return

    setMessages((prev) => prev.map((m) => ({ ...m, deletedForAll: true, text: "", attachments: [] })))
    try {
      await api.clearThreadHistory(id)
    } catch (e) {
      console.warn(e)
      try {
        const res = await api.listThreadMessages(id, { limit: 200 })
        setMessages(res?.items || [])
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl h-[calc(100dvh-72px)] flex flex-col px-3 sm:px-4 lg:px-6 py-4 sm:py-6 min-h-0">
        <div className="mb-4 sm:mb-6 shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-gray-600">
            Connect with your healthcare providers
          </p>
        </div>

        {threadsError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shrink-0">
            {threadsError}
          </div>
        ) : null}

        {/* ✅ IMPORTANT FIX:
            This container is ALWAYS flex (column on mobile),
            so the visible panel can flex-1 and fill height consistently.
        */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row md:gap-6">
          {/* THREADS */}
          <div
            className={[
              "min-h-0 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col",
              "flex-1 md:flex-none md:w-[340px]",
              isNarrow && mobileView === "chat" ? "hidden" : "flex",
            ].join(" ")}
          >
            <div className="p-4 border-b border-gray-100 shrink-0 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Find a doctor or message..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {filter ? (
                  <button
                    type="button"
                    onClick={() => setFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <div className="p-6 flex items-center justify-center">
                  <div className="text-sm text-gray-600">
                    <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Loading your conversations...
                  </div>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-6 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No conversations yet</p>
                    <p className="text-xs text-gray-500 mt-1">Your messages will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredThreads.map((t) => {
                    const active = String(activeThread?.id || "") === String(t.id)
                    const name = t.other?.name || "Healthcare Provider"
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectThread(t)}
                        className={[
                          "w-full text-left p-4 transition",
                          active ? "bg-blue-50 border-l-4 border-blue-600" : "bg-white hover:bg-blue-50/60",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold shrink-0">
                            {getInitials(name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                              {t.unreadCount ? (
                                <span className="shrink-0 rounded-full bg-blue-600 text-white text-[11px] font-semibold px-2 py-1">
                                  {t.unreadCount}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-xs text-gray-600 line-clamp-1">
                              {t.lastMessageText || "No messages yet"}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CHAT */}
          <div
            className={[
              "min-h-0 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col",
              "flex-1",
              isNarrow && mobileView === "list" ? "hidden" : "flex",
            ].join(" ")}
          >
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gradient-to-r from-white to-blue-50 shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {isNarrow ? (
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition shrink-0"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                  </button>
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {activeThread?.other?.name || "Select a conversation"}
                  </p>
                  {activeThread?.other?.uid ? (
                    <p className="mt-1 text-xs text-gray-600 flex items-center gap-1.5">
                      <span
                        className={[
                          "inline-block w-2 h-2 rounded-full",
                          presence?.online ? "bg-green-500" : "bg-gray-400",
                        ].join(" ")}
                      />
                      {presence?.online ? "Online" : "Offline"}
                    </p>
                  ) : null}
                </div>
              </div>

              {activeThread ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => call?.startCall?.(activeThread.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 sm:px-4 py-2.5 transition shadow-sm"
                  >
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Video call</span>
                  </button>

                  <div className="relative" ref={actionsRef}>
                    <button
                      type="button"
                      onClick={() => setActionsOpen((s) => !s)}
                      className="p-2 text-gray-600 hover:bg-white/70 rounded-lg transition"
                      aria-label="Conversation actions"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {actionsOpen ? (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            setActionsOpen(false)
                            clearChatHistory(activeThread.id)
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          Clear chat history
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
              {!activeThread ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-center max-w-xs">
                    <p className="text-lg font-semibold text-gray-900">No conversation selected</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Choose a doctor from the list to start or continue a conversation
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <Send className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-center max-w-xs">
                    <p className="text-lg font-semibold text-gray-900">Start the conversation</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Share your concerns or ask your doctor a question
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col">
                  {messages.map((m) => {
                    const mine = m.senderRole === "user" || m.senderUid === "me"

                    if (m.deletedForAll) {
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={[
                              "max-w-[88%] sm:max-w-md rounded-2xl px-4 py-3 text-sm",
                              bubbleClass(mine),
                            ].join(" ")}
                          >
                            <p className={`italic ${mine ? "text-white/80" : "text-gray-500"}`}>
                              This message was deleted
                            </p>
                            <p className={`mt-1 text-xs ${mine ? "text-white/60" : "text-gray-400"}`}>
                              {formatTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    }

                    if (m.kind === "call") {
                      return (
                        <div key={m.id} className="flex justify-center">
                          <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
                            {callLine(m)}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={[
                            "relative max-w-[88%] sm:max-w-md rounded-2xl px-4 py-3 text-sm",
                            bubbleClass(mine),
                            m._error ? "opacity-70 ring-2 ring-red-300" : "",
                          ].join(" ")}
                        >
                          {m.text ? <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p> : null}

                          {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
                            <div
                              className={[
                                "mt-3 grid gap-2",
                                m.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1",
                              ].join(" ")}
                            >
                              {m.attachments.map((a, idx) => {
                                const href = assetUrl(a?.url || a?.path || a?.filename || a?.fileName || a?.name)
                                return (
                                  <div
                                    key={`${m.id}_att_${idx}`}
                                    className="rounded-xl overflow-hidden border border-gray-200 bg-white"
                                  >
                                    {isImage(a?.mime) ? (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block hover:opacity-90 transition"
                                      >
                                        <img
                                          src={href}
                                          alt={a.name || "attachment"}
                                          className="w-full h-40 object-cover"
                                        />
                                      </a>
                                    ) : isVideo(a?.mime) ? (
                                      <video src={href} controls className="w-full h-40 object-cover" />
                                    ) : (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 p-3 text-gray-700 hover:bg-gray-50 transition"
                                      >
                                        <FileText className="w-4 h-4 shrink-0" />
                                        <span className="text-xs truncate">{a.name || "Attachment"}</span>
                                      </a>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : null}

                          <p className={`mt-2 text-xs ${mine ? "text-white/60" : "text-gray-500"}`}>
                            {formatTime(m.createdAt)}
                            {m._error ? " · Failed to send" : ""}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-white/95 backdrop-blur p-4 sm:p-5 shrink-0 pb-[calc(env(safe-area-inset-bottom)+16px)]">
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
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                    >
                      <span className="truncate max-w-[140px]">{f.name}</span>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-900 transition"
                        onClick={() => removeFile(idx)}
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !uploading && !sending) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  disabled={!activeThread}
                  rows={1}
                  className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={(!draft.trim() && !files.length) || sending || uploading || !activeThread}
                  className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* end layout */}
      </div>
    </div>
  )
}
