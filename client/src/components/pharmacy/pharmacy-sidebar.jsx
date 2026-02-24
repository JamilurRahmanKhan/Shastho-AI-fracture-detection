/**
 * Frontend component: pharmacy-sidebar
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Pill,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  Bot,
  Bell,
  LogOut,
} from "lucide-react";

/**
 * Pharmacy sidebar (mobile drawer + desktop fixed).
 * Keeps the existing API: <PharmacySidebar open onClose />
 */
export default function PharmacySidebar({ isOpen, open, onClose }) {
  const sidebarOpen = open ?? isOpen;
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, profile, authUser } = useAuth();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/pharmacy/dashboard" },
    { label: "Inventory", icon: Package, path: "/pharmacy/medicines" },
    { label: "Orders", icon: ShoppingCart, path: "/pharmacy/orders" },
    { label: "Deliveries", icon: Truck, path: "/pharmacy/deliveries" },
    { label: "Notifications", icon: Bell, path: "/pharmacy/notifications" },
    { label: "AI Recommendations", icon: Bot, path: "/pharmacy/ai-recommendations" },
    { label: "Reports", icon: BarChart3, path: "/pharmacy/reports" },
    { label: "Settings", icon: Settings, path: "/pharmacy/settings" },
  ];

  const handleItemClick = (path) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/pharmacy/login");
  };

  const name = profile?.pharmacyName || profile?.name || authUser?.displayName || "Pharmacy";
  const initials = (name || "P").trim().slice(0, 1).toUpperCase();

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full w-full bg-gradient-to-b from-teal-900 to-teal-800 text-white flex flex-col shadow-xl">
          {/* Header / brand */}
          <div className="p-6 border-b border-teal-700">
            <button
              type="button"
              onClick={() => handleItemClick("/pharmacy/dashboard")}
              className="flex items-center gap-3 w-full text-left"
            >
              <div className="w-10 h-10 bg-teal-400 rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-teal-900" />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">ShasthoAI</p>
                <p className="text-xs text-teal-200">Pharmacy Panel</p>
              </div>
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left",
                    active ? "bg-teal-600 text-white shadow-lg" : "text-teal-100 hover:bg-teal-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-teal-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-teal-950 font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{name}</p>
                <p className="text-xs text-teal-200">Pharmacy</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full bg-transparent border-teal-600 text-teal-100 hover:bg-teal-700 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
