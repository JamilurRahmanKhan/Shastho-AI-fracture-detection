/**
 * Frontend page: DashboardHeader
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// import { useEffect, useMemo, useRef, useState } from "react";
// import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
// import { ChevronDown, LogOut, Menu, User2, Settings, Bell } from "lucide-react";
// import { useAuth } from "../../../contexts/AuthContext";
// import api from "@/services/api";

// const navLinkBase =
//   "px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-slate-100";

// function getInitials(name) {
//   const safe = (name || "User").trim();
//   const parts = safe.split(/\s+/).filter(Boolean);
//   const first = parts[0]?.[0] || "U";
//   const second = (parts[1]?.[0] || parts[0]?.[1] || "").toUpperCase();
//   return (first + second).toUpperCase();
// }

// export default function DashboardHeader() {
//   const { authUser, profile, logout } = useAuth();
//   const navigate = useNavigate();
//   const { pathname } = useLocation();

//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [panelsOpen, setPanelsOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);

//   const panelsRef = useRef(null);
//   const profileRef = useRef(null);

//   const userName = profile?.displayName || authUser?.displayName || "User";
//   const userEmail = profile?.email || authUser?.email || "";
//   const initials = useMemo(() => getInitials(userName), [userName]);

//   const panelTargets = useMemo(() => {
//     // Always send to correct login if not on that role.
//     return {
//       doctor: pathname.startsWith("/doctor") ? "/doctor/dashboard" : "/doctor/login",
//       pharmacy: pathname.startsWith("/pharmacy") ? "/pharmacy/dashboard" : "/pharmacy/login",
//     };
//   }, [pathname]);

//   useEffect(() => {
//     const onDocClick = (e) => {
//       if (panelsRef.current && !panelsRef.current.contains(e.target)) setPanelsOpen(false);
//       if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
//     };
//     document.addEventListener("mousedown", onDocClick);
//     return () => document.removeEventListener("mousedown", onDocClick);
//   }, []);


//   useEffect(() => {
//     let alive = true;
//     const load = async () => {
//       try {
//         const res = await api.getUnreadNotificationCount();
//         if (!alive) return;
//         setUnreadCount(Number(res?.count || 0));
//       } catch {
//         // non-blocking
//       }
//     };
//     load();
//     const t = setInterval(load, 30_000);
//     return () => {
//       alive = false;
//       clearInterval(t);
//     };
//   }, []);

//   const onLogout = async () => {
//     await logout();
//     navigate("/login");
//   };

//   const links = [
//     { to: "/dashboard", label: "Dashboard" },
//     { to: "/dashboard/messages", label: "Messages" },
//     { to: "/chat", label: "AI Chat" },
//     { to: "/store", label: "Store" },
//     { to: "/notifications", label: "Notifications" },
//   ];

//   return (
//     <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="h-16 flex items-center justify-between gap-3">
//           {/* Brand */}
//           <Link to="/dashboard" className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
//               {/* Simple colored mark */}
//               <span className="text-white font-black text-lg leading-none">S</span>
//             </div>
//             <div className="hidden sm:block">
//               <div className="text-lg font-extrabold tracking-tight text-slate-900">ShasthoAI</div>
//               <div className="text-[11px] font-semibold tracking-widest text-blue-600">HEALTH DASHBOARD</div>
//             </div>
//           </Link>

//           {/* Desktop nav */}
//           <nav className="hidden lg:flex items-center gap-1">
//             {links.map((l) => (
//               <NavLink
//                 key={l.to}
//                 to={l.to}
//                 className={({ isActive }) =>
//                   `${navLinkBase} ${isActive ? "text-blue-700" : "text-slate-700"}`
//                 }
//               >
//                 {l.label}
//               </NavLink>
//             ))}

//             <div className="relative" ref={panelsRef}>
//               <button
//                 type="button"
//                 onClick={() => setPanelsOpen((s) => !s)}
//                 className={`${navLinkBase} text-slate-700 flex items-center gap-1`}
//               >
//                 Panels <ChevronDown className={`w-4 h-4 transition-transform ${panelsOpen ? "rotate-180" : ""}`} />
//               </button>
//               {panelsOpen && (
//                 <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
//                   <Link
//                     to={panelTargets.doctor}
//                     className="block px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
//                     onClick={() => setPanelsOpen(false)}
//                   >
//                     Doctor Panel
//                   </Link>
//                   <Link
//                     to={panelTargets.pharmacy}
//                     className="block px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
//                     onClick={() => setPanelsOpen(false)}
//                   >
//                     Pharmacy Panel
//                   </Link>
//                 </div>
//               )}
//             </div>
//           </nav>

//           {/* Right side */}
//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50"
//               onClick={() => setMobileOpen((s) => !s)}
//               aria-label="Toggle menu"
//             >
//               <Menu className="w-5 h-5 text-slate-700" />
//             </button>

//             <Link
//               to="/notifications"
//               className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50"
//               aria-label="Notifications"
//             >
//               <Bell className="w-5 h-5 text-slate-700" />
//               {unreadCount > 0 ? (
//                 <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
//                   {unreadCount > 99 ? "99+" : unreadCount}
//                 </span>
//               ) : null}
//             </Link>

//             <div className="relative" ref={profileRef}>
//               <button
//                 type="button"
//                 onClick={() => setProfileOpen((s) => !s)}
//                 className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 hover:bg-slate-50"
//               >
//                 <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold leading-none">
//                   {initials}
//                 </div>
//                 <div className="hidden sm:block text-left">
//                   <div className="text-sm font-semibold text-slate-900 leading-tight">{userName}</div>
//                   <div className="text-xs text-slate-600 leading-tight">{userEmail}</div>
//                 </div>
//                 <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
//               </button>

//               {profileOpen && (
//                 <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
//                   <div className="px-4 py-3 border-b border-slate-100">
//                     <div className="text-sm font-semibold text-slate-900">{userName}</div>
//                     <div className="text-xs text-slate-600 truncate">{userEmail}</div>
//                   </div>
//                   <Link
//                     to="/profile"
//                     className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
//                     onClick={() => setProfileOpen(false)}
//                   >
//                     <User2 className="w-4 h-4" /> Profile
//                   </Link>
//                   <Link
//                     to="/settings"
//                     className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
//                     onClick={() => setProfileOpen(false)}
//                   >
//                     <Settings className="w-4 h-4" /> Settings
//                   </Link>
//                   <button
//                     type="button"
//                     onClick={onLogout}
//                     className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
//                   >
//                     <LogOut className="w-4 h-4" /> Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Mobile nav */}
//         {mobileOpen && (
//           <div className="lg:hidden pb-4">
//             <div className="grid gap-1">
//               {links.map((l) => (
//                 <NavLink
//                   key={l.to}
//                   to={l.to}
//                   onClick={() => setMobileOpen(false)}
//                   className={({ isActive }) =>
//                     `${navLinkBase} ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-700"}`
//                   }
//                 >
//                   {l.label}
//                 </NavLink>
//               ))}
//               <div className="h-px bg-slate-200 my-2" />
//               <Link to={panelTargets.doctor} onClick={() => setMobileOpen(false)} className={navLinkBase + " text-slate-700"}>
//                 Doctor Panel
//               </Link>
//               <Link
//                 to={panelTargets.pharmacy}
//                 onClick={() => setMobileOpen(false)}
//                 className={navLinkBase + " text-slate-700"}
//               >
//                 Pharmacy Panel
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>
//     </header>
//   );
// }


import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, User2, Settings, Bell } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import api from "@/services/api";

const navLinkBase =
  "px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-slate-100 whitespace-nowrap";

function getInitials(name) {
  const safe = (name || "User").trim();
  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = (parts[1]?.[0] || parts[0]?.[1] || "").toUpperCase();
  return (first + second).toUpperCase();
}

export default function DashboardHeader() {
  const { authUser, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);

  const userName =
    profile?.name || profile?.displayName || authUser?.displayName || "User";
  const userEmail = profile?.email || authUser?.email || "";
  const initials = useMemo(() => getInitials(userName), [userName]);

  // Close menus on route change so UI never gets stuck open
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await api.getUnreadNotificationCount();
        if (!alive) return;
        setUnreadCount(Number(res?.count || 0));
      } catch {
        // non-blocking
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/dashboard/messages", label: "Messages" },
    { to: "/chat", label: "AI Chat" },
    { to: "/store", label: "Store" },
    { to: "/notifications", label: "Notifications" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
              {/* Simple colored mark */}
              <span className="text-white font-black text-lg leading-none">S</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-lg font-extrabold tracking-tight text-slate-900 truncate">
                ShasthoAI
              </div>
              <div className="text-[11px] font-semibold tracking-widest text-blue-600 truncate">
                HEALTH DASHBOARD
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0">
            <div className="flex items-center gap-1 min-w-0 max-w-full overflow-x-auto whitespace-nowrap">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `${navLinkBase} ${isActive ? "text-blue-700" : "text-slate-700"}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}

            </div>
          </nav>

          {/* Right side (toggle moved to FAR RIGHT) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((s) => !s)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 hover:bg-slate-50 min-w-0"
                aria-expanded={profileOpen}
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold leading-none shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left min-w-0 max-w-[160px] md:max-w-[220px]">
                  <div className="text-sm font-semibold text-slate-900 leading-tight truncate">
                    {userName}
                  </div>
                  <div className="text-xs text-slate-600 leading-tight truncate">
                    {userEmail}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-600 transition-transform shrink-0 ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-900 truncate">{userName}</div>
                    <div className="text-xs text-slate-600 truncate">{userEmail}</div>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User2 className="w-4 h-4" /> Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle (RIGHTMOST) */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 pt-3 border-t border-slate-200/70">
            <div className="grid gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `${navLinkBase} ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-700"}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
