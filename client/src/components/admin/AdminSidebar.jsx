/**
 * Frontend component: AdminSidebar
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Reusable React UI component used across pages and panels.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useRoleRequestSummary from "@/hooks/useRoleRequestSummary";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Building2,
  Scan,
  MessageSquare,
  ShoppingCart,
  Handshake,
  BarChart3,
  CreditCard,
  Settings,
  Layers,
} from "lucide-react";

export default function AdminSidebar() {
  const location = useLocation();
  const { summary } = useRoleRequestSummary();
  const unseen = Number(summary?.unseenPending || 0);

  const menuItems = useMemo(
    () => [
      { icon: LayoutDashboard, label: "Overview", href: "/admin" },
      { icon: UserCheck, label: "Role Requests", href: "/admin/role-requests" },
      { icon: Users, label: "Users", href: "/admin/users" },
      { icon: Building2, label: "Hospitals", href: "/admin/hospitals" },
      { icon: Scan, label: "X-ray Cases", href: "/admin/xray-cases" },
      { icon: MessageSquare, label: "Consultations", href: "/admin/consultations" },
      { icon: ShoppingCart, label: "Store & Orders", href: "/admin/orders" },
      { icon: Handshake, label: "Pharma Partners", href: "/admin/pharma-partners" },
      { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
      { icon: CreditCard, label: "Subscriptions", href: "/admin/subscriptions" },
      { icon: Settings, label: "Settings", href: "/admin/settings" },
    ],
    []
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">ShasthoAI</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={() =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/role-requests" && unseen > 0 && (
                <span className="min-w-[22px] h-[22px] px-1 bg-red-500 text-white text-xs leading-[22px] rounded-full text-center">
                  {unseen > 99 ? "99+" : unseen}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
