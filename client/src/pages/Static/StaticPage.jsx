/**
 * Frontend page: StaticPage
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";

const CONTENT = {
  "/about": {
    title: "About ShasthoAI",
    body:
      "ShasthoAI is an AI-powered healthcare platform focused on fast, accessible bone fracture detection and better patient journeys.",
  },
  "/services": {
    title: "Services",
    body:
      "We provide AI-assisted X-ray analysis, telemedicine-style consultations, and connected workflows for doctors and pharmacies.",
  },
  "/blog": { title: "Blog", body: "Articles and updates will appear here soon." },
  "/careers": { title: "Careers", body: "Open positions and hiring info will appear here soon." },
  "/help": { title: "Help Center", body: "Help articles and guides will appear here soon." },
  "/contact": {
    title: "Contact",
    body: "For support, please email support@shasthoai.com (placeholder).",
  },
  "/faq": { title: "FAQ", body: "Frequently asked questions will appear here soon." },
  "/privacy": { title: "Privacy Policy", body: "Privacy policy content will appear here soon." },
  "/terms": { title: "Terms of Service", body: "Terms of service content will appear here soon." },
  "/cookies": { title: "Cookies", body: "Cookie policy content will appear here soon." },
  "/accessibility": { title: "Accessibility", body: "Accessibility statement will appear here soon." },
};

export default function StaticPage() {
  const { pathname } = useLocation();
  const page = CONTENT[pathname] || {
    title: "Page",
    body: "This page is under construction.",
  };

  return (
    <div className="min-h-screen bg-[#FCFDFF]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
          <p className="mt-3 text-slate-600">{page.body}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Coming soon</h2>
          <p className="mt-2 text-slate-600">
            This is a placeholder page so your navbar/footer links don’t 404. Replace this with real content later.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Home
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
