/**
 * Frontend page: UserNotifications
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Trash2, CheckCheck, Loader2 } from "lucide-react"
import api from "@/services/api"

function timeAgo(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return `${days}d ago`
}

export default function UserNotifications() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [items, setItems] = useState([])

  const refresh = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await api.listNotifications({ limit: 100 })
      setItems(Array.isArray(res?.items) ? res.items : [])
    } catch (e) {
      setError(e?.message || "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items])

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)))
    } catch {
      // non-blocking
    }
  }

  const markAll = async () => {
    try {
      await api.markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() })))
    } catch {
      // non-blocking
    }
  }

  const remove = async (id) => {
    try {
      await api.deleteNotification(id)
      setItems((prev) => prev.filter((n) => n.id !== id))
    } catch {
      // non-blocking
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          </div>
          <p className="text-slate-600 ml-11">Stay updated on orders, prescriptions, and important system messages</p>
        </div>

        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button onClick={markAll} disabled={!unreadCount} variant="outline" className="sm:w-auto bg-transparent">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
            <Button onClick={refresh} variant="outline" className="sm:w-auto bg-transparent">
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="w-fit">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-600">Loading notifications...</p>
          </div>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((n) => (
              <Card
                key={n.id}
                className={`p-4 sm:p-5 transition-all hover:shadow-md hover:border-slate-300 ${
                  !n.isRead ? "border-l-4 border-l-blue-500 bg-blue-50" : "bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-base leading-tight">{n.title}</h3>
                      {!n.isRead && <Badge className="bg-blue-600 text-white text-xs flex-shrink-0">New</Badge>}
                    </div>
                    <p className="text-slate-600 text-sm mb-3">{n.message}</p>
                    <p className="text-xs text-slate-500">{timeAgo(n.createdAt)}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:flex-shrink-0">
                    {!n.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-transparent"
                        onClick={() => markRead(n.id)}
                      >
                        <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                        Mark read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-600 hover:bg-red-50 bg-transparent"
                      onClick={() => remove(n.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Improved empty state design */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">All caught up!</h2>
            <p className="text-slate-600">You have no notifications right now</p>
          </div>
        )}
      </div>
    </div>
  )
}
