/**
 * Frontend page: ShasthoAILogoWhitePublic
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React from "react";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

const ShasthoAILogoWhitePublic = () => {
  return (
    <Link to="/" className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full border-2 border-white"></div>
      </div>
      <div>
        <span className="text-lg font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
          ShasthoAI
        </span>
        <div className="text-[11px] font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text tracking-wider">
          HEALTH DASHBOARD
        </div>
      </div>
    </Link>
  );
};

export default ShasthoAILogoWhitePublic;
