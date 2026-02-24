/**
 * Frontend page: TabNavigation
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// import React from "react";
// import { Link } from "react-router-dom";

// const TabNavigation = ({ activeTab, setActiveTab, cartItemsCount = 0 }) => {
//   const baseItem =
//     "relative w-full rounded-xl border text-sm sm:text-base font-semibold transition-all duration-200 " +
//     "h-12 sm:h-14 px-3 sm:px-4 flex items-center justify-center gap-2 " +
//     "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
//     "active:scale-[0.99]";

//   const inactive =
//     "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900";

//   const activeProducts =
//     "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-blue-500";

//   const activeCart =
//     "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border-emerald-500";

//   const IconBox = ({ active, children }) => (
//     <span
//       className={[
//         "inline-flex items-center justify-center rounded-lg w-8 h-8 sm:w-9 sm:h-9",
//         active ? "bg-white/15" : "bg-slate-100 group-hover:bg-slate-200",
//       ].join(" ")}
//       aria-hidden="true"
//     >
//       {children}
//     </span>
//   );

//   return (
//     <div className="w-full bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-lg rounded-2xl p-3 sm:p-4">
//       {/* ✅ Correct responsive layout:
//           xs: 1 column
//           sm: 2 columns
//           lg: 4 columns
//       */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
//         {/* Products */}
//         <button
//           type="button"
//           onClick={() => setActiveTab("products")}
//           className={[
//             "group",
//             baseItem,
//             activeTab === "products" ? activeProducts : inactive,
//           ].join(" ")}
//           aria-pressed={activeTab === "products"}
//           aria-label="Browse Products"
//         >
//           {/* Active dot */}
//           {activeTab === "products" && (
//             <span
//               className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-white"
//               aria-hidden="true"
//             />
//           )}

//           <IconBox active={activeTab === "products"}>
//             <svg
//               className={[
//                 "w-4 h-4 sm:w-5 sm:h-5",
//                 activeTab === "products" ? "text-white" : "text-slate-600",
//               ].join(" ")}
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
//               />
//             </svg>
//           </IconBox>

//           <span className="truncate">Browse Products</span>
//         </button>

//         {/* Cart */}
//         <button
//           type="button"
//           onClick={() => setActiveTab("cart")}
//           className={[
//             "group",
//             baseItem,
//             activeTab === "cart" ? activeCart : inactive,
//           ].join(" ")}
//           aria-pressed={activeTab === "cart"}
//           aria-label={`Shopping Cart ${cartItemsCount > 0 ? `with ${cartItemsCount} items` : ""}`}
//         >
//           {/* Active dot */}
//           {activeTab === "cart" && (
//             <span
//               className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-blue-300 ring-2 ring-white"
//               aria-hidden="true"
//             />
//           )}

//           {/* Badge (placed slightly lower so it never fights with the dot) */}
//           {cartItemsCount > 0 && (
//             <span
//               className={[
//                 "absolute -top-2 -right-2 min-w-[1.4rem] h-5 px-1 rounded-full text-xs font-bold",
//                 "flex items-center justify-center border-2 border-white shadow-sm",
//                 activeTab === "cart"
//                   ? "bg-white text-emerald-700"
//                   : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
//               ].join(" ")}
//               aria-label={`${cartItemsCount} items in cart`}
//             >
//               {cartItemsCount}
//             </span>
//           )}

//           <IconBox active={activeTab === "cart"}>
//             <svg
//               className={[
//                 "w-4 h-4 sm:w-5 sm:h-5",
//                 activeTab === "cart" ? "text-white" : "text-slate-600",
//               ].join(" ")}
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
//               />
//             </svg>
//           </IconBox>

//           <span className="truncate">Shopping Cart</span>
//         </button>

//         {/* Orders */}
//         <Link
//           to="/store/orders"
//           className={["group", baseItem, inactive].join(" ")}
//           aria-label="My Orders"
//         >
//           <IconBox active={false}>
//             <svg
//               className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               aria-hidden="true"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M9 12h6m-6 4h6m2 6H7a2 2 0 01-2-2V4a2 2 0 012-2h7l5 5v13a2 2 0 01-2 2z"
//               />
//             </svg>
//           </IconBox>

//           <span className="truncate">My Orders</span>
//         </Link>

//         {/* Addresses */}
//         <Link
//           to="/store/addresses"
//           className={["group", baseItem, inactive].join(" ")}
//           aria-label="My Addresses"
//         >
//           <IconBox active={false}>
//             <svg
//               className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               aria-hidden="true"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
//               />
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
//               />
//             </svg>
//           </IconBox>

//           <span className="truncate">Addresses</span>
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default TabNavigation;


import React from "react";
import { Link } from "react-router-dom";

const TabNavigation = ({ activeTab, setActiveTab, cartItemsCount = 0 }) => {
  const base =
    "relative rounded-xl font-semibold text-sm sm:text-base py-3 sm:py-4 transition-all duration-200 " +
    "flex items-center justify-center gap-2 border w-full";

  const activeBlue =
    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-blue-500";
  const activeGreen =
    "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border-emerald-500";
  const inactive =
    "text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300";

  return (
    <div className="w-full bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-lg rounded-2xl p-3 sm:p-4">
      {/* 4 items => make it 2 cols on mobile, 4 cols on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Products */}
        <button
          onClick={() => setActiveTab("products")}
          className={`${base} ${activeTab === "products" ? activeBlue : inactive}`}
          aria-pressed={activeTab === "products"}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="whitespace-nowrap">Browse</span>
        </button>

        {/* Cart */}
        <button
          onClick={() => setActiveTab("cart")}
          className={`${base} ${activeTab === "cart" ? activeGreen : inactive}`}
          aria-pressed={activeTab === "cart"}
          aria-label={`Shopping Cart ${cartItemsCount > 0 ? `with ${cartItemsCount} items` : ""}`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="whitespace-nowrap">Cart</span>

          {/* Badge inline (NOT top-right) */}
          {cartItemsCount > 0 ? (
            <span className={`ml-1 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-xs font-bold ${
              activeTab === "cart" ? "bg-white text-emerald-700" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            }`}>
              {cartItemsCount}
            </span>
          ) : null}
        </button>

        {/* Orders */}
        <Link to="/store/orders" className={`${base} ${inactive}`} aria-label="My Orders">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 6H7a2 2 0 01-2-2V4a2 2 0 012-2h7l5 5v13a2 2 0 01-2 2z" />
          </svg>
          <span className="whitespace-nowrap">Orders</span>
        </Link>

        {/* Addresses */}
        <Link to="/store/addresses" className={`${base} ${inactive}`} aria-label="My Addresses">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="whitespace-nowrap">Addresses</span>
        </Link>
      </div>
    </div>
  );
};

export default TabNavigation;
