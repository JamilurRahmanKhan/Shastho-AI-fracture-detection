/**
 * Frontend component: doctor-sidebar
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorRealtime } from "@/contexts/DoctorRealtimeContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function DoctorSidebar({ isOpen, open, onClose }) {
  const sidebarOpen = open ?? isOpen;
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useDoctorRealtime();
  const { logout, profile, authUser } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/doctor/dashboard" },
    { id: "patients", label: "Patients", icon: "👥", path: "/doctor/patients" },
    { id: "appointments", label: "Appointments", icon: "📅", path: "/doctor/appointments" },
    { id: "availability", label: "Availability", icon: "🕒", path: "/doctor/availability" },
    { id: "messages", label: "Messages", icon: "✉️", path: "/doctor/messages" },
    { id: "notifications", label: "Notifications", icon: "🔔", path: "/doctor/notifications" },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/doctor/settings" },
  ];

  const handleItemClick = (path) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/doctor/login");
  };

  const name = profile?.name || authUser?.displayName || "Doctor";

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigate("/doctor/dashboard")} className="text-left">
              <h1 className="text-xl font-bold text-gray-900 hover:text-blue-700 transition-colors">Doctor Panel</h1>
              <p className="text-sm text-gray-600 hover:text-blue-700 transition-colors">ShasthoAI</p>
            </button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
          {menuItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const showBadge = item.id === "notifications" && unreadCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium flex-1">{item.label}</span>
                {showBadge ? (
                  <span className="min-w-[20px] h-[20px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-[20px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{name}</p>
              <p className="text-xs text-gray-600">Doctor</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        </div>
      </div>
    </>
  );
}
