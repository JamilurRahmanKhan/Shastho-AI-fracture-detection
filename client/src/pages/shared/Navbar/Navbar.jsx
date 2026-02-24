/**
 * Frontend page: Navbar
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ChevronDown, Home, Info, CreditCard, Phone } from "lucide-react";

import ShasthoAILogoWhitePublic from "../ShasthoAILogo/ShasthoAILogoWhitePublic";
import DashboardHeader from "../../Dashboard/DashboardHeader/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_LINKS = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: Info },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
  { name: "Contact", href: "/contact", icon: Phone },
];

function useClickOutside(ref, handler, enabled) {
  useEffect(() => {
    if (!enabled) return;
    const onMouseDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) handler();
    };
    document.addEventListener("mousedown", onMouseDown, true);
    return () => document.removeEventListener("mousedown", onMouseDown, true);
  }, [ref, handler, enabled]);
}

const Navbar = () => {
  const { authUser, profile, role, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPanelsOpen, setIsPanelsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const panelsRef = useRef(null);
  const profileRef = useRef(null);

  const isAuthed = !!authUser && !!role;
  const displayName = profile?.name || authUser?.displayName || authUser?.email || "User";

  // Decide when to render DashboardHeader.
  // We show it for any authenticated account when the user-panel routes are active.
  // This keeps "User Panel" navigation consistent even when switching roles.
  const shouldShowDashboardHeader = useMemo(() => {
    if (!isAuthed) return false;
    const p = location.pathname;
    return (
      p.startsWith("/dashboard") ||
      p.startsWith("/chat") ||
      p.startsWith("/upload") ||
      p.startsWith("/reports") ||
      p.startsWith("/history") ||
      p.startsWith("/notifications") ||
      p.startsWith("/profile") ||
      p.startsWith("/settings")
    );
  }, [isAuthed, role, location.pathname]);

  // Panel targets
  // User panel is available for any authenticated account so you can switch between panels.
  const userTarget = "/dashboard";
  const doctorTarget = isAuthed && role === "doctor" ? "/doctor/dashboard" : "/doctor/login";
  const pharmacyTarget = isAuthed && role === "pharmacy" ? "/pharmacy/dashboard" : "/pharmacy/login";

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsPanelsOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useClickOutside(
    panelsRef,
    useCallback(() => setIsPanelsOpen(false), []),
    isPanelsOpen
  );
  useClickOutside(
    profileRef,
    useCallback(() => setIsProfileOpen(false), []),
    isProfileOpen
  );

  const togglePanels = useCallback(() => setIsPanelsOpen((v) => !v), []);
  const toggleProfile = useCallback(() => setIsProfileOpen((v) => !v), []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      setIsProfileOpen(false);
      navigate("/", { replace: true });
    }
  }, [logout, navigate]);

  const desktopLinks = useMemo(() => PUBLIC_LINKS, []);

  // If authenticated user is in user area, show your dashboard-style header
  if (shouldShowDashboardHeader) {
    return <DashboardHeader user={{ name: displayName, email: authUser?.email, role }} />;
  }

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-gray-100 sticky top-0 z-[1000] shadow-sm" role="navigation">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <ShasthoAILogoWhitePublic />
          </div>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {desktopLinks.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
              >
                {l.name}
              </Link>
            ))}

            {/* Panels dropdown */}
            <div className="relative" ref={panelsRef}>
              <button
                type="button"
                onClick={togglePanels}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition inline-flex items-center gap-1"
                aria-expanded={isPanelsOpen}
              >
                Panels <ChevronDown className={`h-4 w-4 transition-transform ${isPanelsOpen ? "rotate-180" : ""}`} />
              </button>
              {isPanelsOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-[10000] overflow-hidden">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    Panels
                  </div>
                  <Link
                    to={userTarget}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsPanelsOpen(false)}
                  >
                    User Panel
                  </Link>
                  <Link
                    to={doctorTarget}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
                    onClick={() => setIsPanelsOpen(false)}
                  >
                    Doctor Panel
                  </Link>
                  <Link
                    to={pharmacyTarget}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50"
                    onClick={() => setIsPanelsOpen(false)}
                  >
                    Pharmacy Panel
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-2">
            {loading ? null : isAuthed ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={toggleProfile}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  aria-expanded={isProfileOpen}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm">
                    <span className="text-sm font-semibold">{String(displayName).charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-sm font-semibold text-gray-900 max-w-[160px] truncate">{displayName}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-[10000] overflow-hidden">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white py-2">
            <div className="flex flex-col px-2">
              {desktopLinks.map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {l.name}
                </Link>
              ))}

              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Panels</p>
                <Link to={userTarget} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  User Panel
                </Link>
                <Link to={doctorTarget} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-blue-50">
                  Doctor Panel
                </Link>
                <Link to={pharmacyTarget} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-teal-50">
                  Pharmacy Panel
                </Link>
              </div>

              <div className="mt-2 border-t border-gray-100 pt-2">
                {loading ? null : isAuthed ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                ) : (
                  <div className="flex gap-2 px-3">
                    <Link to="/login" className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 text-center">
                      Login
                    </Link>
                    <Link to="/signup" className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 text-center">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
