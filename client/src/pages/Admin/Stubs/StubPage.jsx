/**
 * Frontend page: StubPage
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { Card } from "@/components/ui/card";

export default function StubPage({ title, subtitle, children }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="text-gray-600 mt-1">{subtitle}</p> : null}
      </div>
      {children ? (
        children
      ) : (
        <Card className="p-6">
          <p className="text-gray-700 font-medium">This module is ready to connect.</p>
          <p className="text-sm text-gray-500 mt-1">
            Add Firestore collections or backend APIs when you are ready (hospitals, subscriptions, consultations, store orders,
            analytics, etc.).
          </p>
        </Card>
      )}
    </div>
  );
}
