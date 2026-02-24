/**
 * Frontend page: ShasthoAILogoBlack
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

const ShasthoAILogoBlack = () => {
  return (
    <Link to="/" className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full border-2 border-white"></div>
      </div>
      <div>
        <span className="text-lg sm:text-xl font-bold">Shastho</span>
        <span className="text-lg sm:text-xl font-bold text-blue-400">AI</span>
      </div>
    </Link>
  );
};

export default ShasthoAILogoBlack;
