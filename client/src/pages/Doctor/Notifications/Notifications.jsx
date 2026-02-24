/**
 * Frontend page: Notifications
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState } from "react";
import DoctorSidebar from "@/components/doctor/doctor-sidebar";
import DoctorNavbar from "@/components/doctor/DoctorNavbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";

function timeAgo(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function DoctorNotifications() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const refresh = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.listNotifications({ limit: 100 });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const filteredItems = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((n) => `${n.title || ""} ${n.message || ""}`.toLowerCase().includes(s));
  }, [items, q]);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));
    } catch (e) {
      console.warn(e);
    }
  };

  const markAll = async () => {
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() })));
    } catch (e) {
      console.warn(e);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DoctorNavbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Notifications"
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search notifications…"
        />

        <main className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
                <p className="text-gray-600">
                  Appointment requests, messages, and system updates
                  {unreadCount ? ` • ${unreadCount} unread` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={markAll} disabled={!items.length}>
                  Mark All as Read
                </Button>
                <Button variant="outline" onClick={refresh}>
                  Refresh
                </Button>
              </div>
            </div>

            {error ? (
              <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">{error}</div>
            ) : null}

            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : filteredItems.length ? (
              <div className="grid gap-4">
                {filteredItems.map((n) => (
                  <Card
                    key={n.id}
                    className={`p-6 transition-all hover:shadow-md ${!n.isRead ? "border-l-4 border-l-blue-600 bg-blue-50" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{n.title}</h3>
                            <p className="text-gray-600">{n.message}</p>
                          </div>
                          {!n.isRead ? <Badge className="bg-blue-600 text-white">New</Badge> : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <p className="text-sm text-gray-500">{timeAgo(n.createdAt)}</p>

                          <div className="flex gap-2">
                            {!n.isRead ? (
                              <Button size="sm" variant="outline" className="text-xs bg-transparent" onClick={() => markRead(n.id)}>
                                Mark as Read
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-red-600 hover:text-red-700 bg-transparent"
                              onClick={() => remove(n.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-gray-500">
                  <p className="text-lg font-medium mb-2">
                    {items.length && q.trim() ? `No matching notifications for “${q}”.` : "No notifications yet"}
                  </p>
                  <p className="text-sm">
                    {items.length && q.trim()
                      ? "Try a different search term."
                      : "You’ll see updates here when patients book appointments or send messages."}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
