/**
 * Frontend page: Overview
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck,
  Scan,
  Building2,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import useRoleRequestSummary from "@/hooks/useRoleRequestSummary";

export default function AdminOverview() {
  const { summary, loading } = useRoleRequestSummary({ pollMs: 20000 });

  const stats = useMemo(
    () => [
      {
        icon: UserCheck,
        label: "Pending Role Requests",
        value: loading ? "—" : String(summary?.pending ?? 0),
        trend: "Review queue",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        href: "/admin/role-requests",
      },
      {
        icon: Scan,
        label: "X-ray Cases",
        value: "—",
        trend: "Coming from backend",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        href: "/admin/xray-cases",
      },
      {
        icon: Building2,
        label: "Hospitals",
        value: "—",
        trend: "Coming from backend",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        href: "/admin/hospitals",
      },
      {
        icon: MessageSquare,
        label: "Consultations",
        value: "—",
        trend: "Coming from backend",
        color: "text-teal-600",
        bgColor: "bg-teal-50",
        href: "/admin/consultations",
      },
    ],
    // Recompute when role-request summary updates
    [loading, summary?.pending]
  );

  // Light demo placeholders (replace with real activity collection later)
  const pendingActions = useMemo(
    () => [
      { title: "Review pending role requests", time: "Now", href: "/admin/role-requests" },
      { title: "Review X-ray cases (stub)", time: "Soon", href: "/admin/xray-cases" },
    ],
    []
  );

  const recentActivity = useMemo(
    () => [
      { action: "Admin panel integrated", time: "Just now", icon: CheckCircle2, color: "text-green-600" },
      { action: "Role requests are live from Firestore", time: "Just now", icon: UserCheck, color: "text-orange-600" },
      { action: "Other modules can be connected later", time: "Soon", icon: AlertCircle, color: "text-gray-600" },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-600 mt-1">System health and action queue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.href} className="block">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Needs Attention</h2>
            <span className="text-sm text-gray-500">{pendingActions.length} items</span>
          </div>
          <div className="space-y-3">
            {pendingActions.map((action, idx) => (
              <Link key={idx} to={action.href} className="block">
                <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{action.title}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {action.time}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">Review</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">System Health</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Admin UI</span>
                <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role Requests</span>
                <span className="text-sm font-medium text-gray-900">Live (Firestore)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Other modules</span>
                <span className="text-sm text-gray-600">Ready to connect</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => {
                const Icon = activity.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
