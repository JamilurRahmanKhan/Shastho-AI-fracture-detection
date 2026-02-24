/**
 * Frontend page: StoreAddresses
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// import React, { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { api } from "@/services/api";

// const emptyForm = {
//   label: "Home",
//   fullName: "",
//   phone: "",
//   line1: "",
//   line2: "",
//   city: "",
//   state: "",
//   postalCode: "",
//   country: "Bangladesh",
//   isDefault: false,
// };

// function Modal({ open, title, children, onClose }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/40" onClick={onClose} />
//       {/*
//         Keep the modal fully usable on small screens.
//         - max-h prevents it from going off-screen
//         - flex layout keeps header fixed
//         - body becomes scrollable
//       */}
//       <div className="relative w-[95vw] max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
//         <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
//           <h2 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h2>
//           <button
//             onClick={onClose}
//             className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
//           >
//             ✕
//           </button>
//         </div>
//         <div className="p-5 sm:p-6 flex-1 overflow-y-auto relative">{children}</div>
//       </div>
//     </div>
//   );
// }

// export default function StoreAddresses() {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [modalOpen, setModalOpen] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [form, setForm] = useState({ ...emptyForm });

//   const defaultId = useMemo(() => items.find((a) => a.isDefault)?.id || "", [items]);

//   const load = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await api.listStoreAddresses();
//       setItems(Array.isArray(res?.items) ? res.items : []);
//     } catch (e) {
//       setError(e?.message || "Failed to load addresses");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const openCreate = () => {
//     setEditingId(null);
//     setForm({ ...emptyForm, isDefault: items.length === 0 });
//     setModalOpen(true);
//   };

//   const openEdit = (addr) => {
//     setEditingId(addr.id);
//     setForm({
//       label: addr.label || "Home",
//       fullName: addr.fullName || "",
//       phone: addr.phone || "",
//       line1: addr.line1 || "",
//       line2: addr.line2 || "",
//       city: addr.city || "",
//       state: addr.state || "",
//       postalCode: addr.postalCode || "",
//       country: addr.country || "Bangladesh",
//       isDefault: Boolean(addr.isDefault),
//     });
//     setModalOpen(true);
//   };

//   const save = async () => {
//     if (!form.line1.trim()) {
//       setError("Address line 1 is required.");
//       return;
//     }
//     setSaving(true);
//     setError("");
//     try {
//       if (editingId) {
//         await api.updateStoreAddress(editingId, form);
//       } else {
//         await api.createStoreAddress(form);
//       }
//       setModalOpen(false);
//       await load();
//     } catch (e) {
//       setError(e?.message || "Failed to save address");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const setDefault = async (id) => {
//     setError("");
//     try {
//       await api.setDefaultStoreAddress(id);
//       await load();
//     } catch (e) {
//       setError(e?.message || "Failed to set default");
//     }
//   };

//   const remove = async (id) => {
//     if (!confirm("Delete this address?")) return;
//     setError("");
//     try {
//       await api.deleteStoreAddress(id);
//       await load();
//     } catch (e) {
//       setError(e?.message || "Failed to delete address");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#FCFDFF]">
//       <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
//         <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
//           <div>
//             <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Addresses</h1>
//             <p className="text-slate-600 mt-1">Save multiple shipping addresses and choose a default for faster checkout.</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <Link
//               to="/store"
//               className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-900"
//             >
//               Back to store
//             </Link>
//             <button
//               onClick={openCreate}
//               className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
//             >
//               + Add Address
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
//             {error}
//           </div>
//         )}

//         <div className="mt-6">
//           {loading ? (
//             <div className="text-slate-600">Loading addresses...</div>
//           ) : items.length === 0 ? (
//             <div className="p-8 rounded-2xl border border-slate-200 bg-white">
//               <div className="text-slate-900 font-bold text-lg">No addresses saved</div>
//               <div className="text-slate-600 mt-1">Add an address to autofill your checkout next time.</div>
//               <button
//                 onClick={openCreate}
//                 className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
//               >
//                 Add your first address
//               </button>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {items.map((a) => (
//                 <div key={a.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
//                   <div className="flex items-start justify-between gap-3">
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <div className="text-slate-900 font-extrabold">{a.label || "Address"}</div>
//                         {a.isDefault && (
//                           <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
//                             Default
//                           </span>
//                         )}
//                       </div>
//                       <div className="text-slate-700 font-semibold mt-2">{a.fullName || ""}</div>
//                       <div className="text-slate-600 text-sm">{a.phone || ""}</div>
//                       <pre className="mt-3 whitespace-pre-wrap text-slate-700 text-sm font-medium">
//                         {a.formatted || ""}
//                       </pre>
//                     </div>
//                     <div className="flex flex-col gap-2">
//                       <button
//                         onClick={() => openEdit(a)}
//                         className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-900"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => remove(a.id)}
//                         className="px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 font-semibold text-red-700"
//                       >
//                         Delete
//                       </button>
//                       <button
//                         onClick={() => setDefault(a.id)}
//                         disabled={a.id === defaultId}
//                         className={`px-3 py-2 rounded-lg font-semibold ${
//                           a.id === defaultId
//                             ? "bg-slate-100 text-slate-400 cursor-not-allowed"
//                             : "bg-blue-600 hover:bg-blue-700 text-white"
//                         }`}
//                       >
//                         Set Default
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <Modal
//           open={modalOpen}
//           title={editingId ? "Edit Address" : "Add Address"}
//           onClose={() => setModalOpen(false)}
//         >
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">Label</label>
//               <input
//                 value={form.label}
//                 onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 placeholder="Home / Office"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
//               <input
//                 value={form.fullName}
//                 onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 placeholder="Receiver name"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
//               <input
//                 value={form.phone}
//                 onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 placeholder="01XXXXXXXXX"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
//               <input
//                 value={form.country}
//                 onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//               />
//             </div>

//             <div className="sm:col-span-2">
//               <label className="block text-sm font-bold text-slate-700 mb-1">Address Line 1 *</label>
//               <input
//                 value={form.line1}
//                 onChange={(e) => setForm((s) => ({ ...s, line1: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 placeholder="House / Road / Area"
//               />
//             </div>

//             <div className="sm:col-span-2">
//               <label className="block text-sm font-bold text-slate-700 mb-1">Address Line 2</label>
//               <input
//                 value={form.line2}
//                 onChange={(e) => setForm((s) => ({ ...s, line2: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                 placeholder="Apartment / Landmark"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
//               <input
//                 value={form.city}
//                 onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">State / District</label>
//               <input
//                 value={form.state}
//                 onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-bold text-slate-700 mb-1">Postal Code</label>
//               <input
//                 value={form.postalCode}
//                 onChange={(e) => setForm((s) => ({ ...s, postalCode: e.target.value }))}
//                 className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//               />
//             </div>

//             <div className="flex items-center gap-2 mt-2 sm:col-span-2">
//               <input
//                 id="isDefault"
//                 type="checkbox"
//                 checked={form.isDefault}
//                 onChange={(e) => setForm((s) => ({ ...s, isDefault: e.target.checked }))}
//               />
//               <label htmlFor="isDefault" className="text-sm font-semibold text-slate-700">
//                 Set as default address
//               </label>
//             </div>
//           </div>

//           {/* Sticky footer so actions remain reachable even when the form is long */}
//           <div className="mt-6 flex items-center justify-end gap-3 sticky bottom-0 bg-white pt-4 pb-2 -mx-5 sm:-mx-6 px-5 sm:px-6 border-t border-slate-100">
//             <button
//               onClick={() => setModalOpen(false)}
//               className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-900"
//               disabled={saving}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={save}
//               className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
//               disabled={saving}
//             >
//               {saving ? "Saving..." : "Save"}
//             </button>
//           </div>
//         </Modal>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { api } from "@/services/api";

const emptyForm = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Bangladesh",
  isDefault: false,
};

function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [locked]);
}

function validateAddressForm(f) {
  const errors = {};
  if (!String(f.label || "").trim()) errors.label = "Label is required.";
  if (!String(f.fullName || "").trim()) errors.fullName = "Full name is required.";
  if (!String(f.phone || "").trim()) errors.phone = "Phone number is required.";
  if (!String(f.line1 || "").trim()) errors.line1 = "Address line 1 is required.";
  if (!String(f.city || "").trim()) errors.city = "City is required.";
  if (!String(f.state || "").trim()) errors.state = "State/District is required.";
  if (!String(f.country || "").trim()) errors.country = "Country is required.";

  // Light phone sanity check (BD-friendly but not strict)
  const phone = String(f.phone || "").trim();
  if (phone && phone.length < 8) errors.phone = "Phone looks too short.";

  return errors;
}

function formatPreview(f) {
  const parts = [
    f.fullName,
    f.phone,
    f.line1,
    f.line2,
    [f.city, f.state, f.postalCode].filter(Boolean).join(", "),
    f.country,
  ].filter((x) => String(x || "").trim());
  return parts.join("\n");
}

function Modal({ open, title, subtitle, children, footer, onClose }) {
  const panelRef = useRef(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => panelRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      {/* wrapper */}
      <div className="relative h-full w-full flex items-end sm:items-center justify-center sm:p-4">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className="
            w-full sm:w-[min(900px,95vw)]
            bg-white border border-slate-200 shadow-2xl
            rounded-t-2xl sm:rounded-2xl
            max-h-[calc(100dvh-12px)] sm:max-h-[90dvh]
            flex flex-col overflow-hidden
          "
        >
          {/* mobile handle */}
          <div className="sm:hidden pt-3 pb-1 flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>

          {/* header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 bg-white">
            {children}
            <div className="h-[calc(env(safe-area-inset-bottom)+10px)]" />
          </div>

          {/* footer (fixed) */}
          <div className="border-t border-slate-100 bg-white/95 backdrop-blur px-4 sm:px-6 py-4">
            {footer}
            <div className="h-[calc(env(safe-area-inset-bottom)+6px)]" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-800 mb-1.5">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 " +
  "placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 " +
  "transition";

function ToggleRow({ checked, onChange, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition"
    >
      <div className="text-left">
        <div className="text-sm font-extrabold text-slate-900">{title}</div>
        {subtitle ? <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div> : null}
      </div>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-emerald-600" : "bg-slate-300"
        }`}
        aria-hidden="true"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function StoreAddresses() {
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");

  const defaultId = useMemo(() => items.find((a) => a.isDefault)?.id || "", [items]);

  const errors = useMemo(() => validateAddressForm(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;

  const load = async () => {
    setLoading(true);
    setPageError("");
    try {
      const res = await api.listStoreAddresses();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setPageError(e?.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // close modal on route change
  useEffect(() => {
    setModalOpen(false);
    setSubmitError("");
    setTouched({});
  }, [location.pathname, location.search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, isDefault: items.length === 0 });
    setTouched({});
    setSubmitError("");
    setModalOpen(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "Bangladesh",
      isDefault: Boolean(addr.isDefault),
    });
    setTouched({});
    setSubmitError("");
    setModalOpen(true);
  };

  const save = async () => {
    setSubmitError("");
    setTouched({
      label: true,
      fullName: true,
      phone: true,
      line1: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    });

    const v = validateAddressForm(form);
    if (Object.keys(v).length) {
      setSubmitError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) await api.updateStoreAddress(editingId, form);
      else await api.createStoreAddress(form);

      setModalOpen(false);
      await load();
    } catch (e) {
      setSubmitError(e?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => {
    setPageError("");
    try {
      await api.setDefaultStoreAddress(id);
      await load();
    } catch (e) {
      setPageError(e?.message || "Failed to set default");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this address?")) return;
    setPageError("");
    try {
      await api.deleteStoreAddress(id);
      await load();
    } catch (e) {
      setPageError(e?.message || "Failed to delete address");
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              My Addresses
            </h1>
            <p className="text-slate-600 mt-1 max-w-2xl">
              Save multiple shipping addresses and pick a default for faster checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Link
              to="/store"
              className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-900"
            >
              Back to store
            </Link>
            <button
              onClick={openCreate}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              + Add Address
            </button>
          </div>
        </div>

        {pageError && (
          <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
            {pageError}
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="text-slate-600">Loading addresses...</div>
          ) : items.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 bg-white">
              <div className="text-slate-900 font-bold text-lg">No addresses saved</div>
              <div className="text-slate-600 mt-1">
                Add an address to autofill checkout next time.
              </div>
              <button
                onClick={openCreate}
                className="mt-4 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Add your first address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((a) => (
                <div
                  key={a.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-slate-900 font-extrabold">
                          {a.label || "Address"}
                        </div>
                        {a.isDefault && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="text-slate-800 font-semibold mt-2">{a.fullName || ""}</div>
                      <div className="text-slate-600 text-sm">{a.phone || ""}</div>

                      <div className="mt-3 text-slate-700 text-sm font-medium whitespace-pre-wrap break-words">
                        {a.formatted || ""}
                      </div>
                    </div>

                    <div className="shrink-0 grid grid-cols-2 sm:grid-cols-1 gap-2">
                      <button
                        onClick={() => openEdit(a)}
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 font-semibold text-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDefault(a.id)}
                        disabled={a.id === defaultId}
                        className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-lg font-semibold ${
                          a.id === defaultId
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        Set Default
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <Modal
          open={modalOpen}
          title={editingId ? "Edit Address" : "Add Address"}
          subtitle="Fill the details carefully to avoid delivery issues."
          onClose={() => !saving && setModalOpen(false)}
          footer={
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-900"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Address"}
              </button>
            </div>
          }
        >
          {submitError ? (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
              {submitError}
            </div>
          ) : null}

          {/* Layout: form + preview (desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Form */}
            <div className="lg:col-span-8 space-y-5">
              {/* Contact */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                <div className="text-sm font-extrabold text-slate-900 mb-4">
                  Contact details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Label" required error={touched.label ? errors.label : ""} hint="Example: Home / Office">
                    <input
                      value={form.label}
                      onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, label: true }))}
                      className={`${inputBase} ${touched.label && errors.label ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}
                      placeholder="Home"
                      autoComplete="off"
                    />
                  </Field>

                  <Field label="Full Name" required error={touched.fullName ? errors.fullName : ""}>
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                      className={`${inputBase} ${touched.fullName && errors.fullName ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}
                      placeholder="Receiver name"
                      autoComplete="name"
                    />
                  </Field>

                  <Field label="Phone" required error={touched.phone ? errors.phone : ""} hint="Use an active number for delivery calls">
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      className={`${inputBase} ${touched.phone && errors.phone ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}
                      placeholder="01XXXXXXXXX"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="Country" required error={touched.country ? errors.country : ""}>
                    <input
                      value={form.country}
                      onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, country: true }))}
                      className={`${inputBase} ${touched.country && errors.country ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}
                      placeholder="Bangladesh"
                      autoComplete="country-name"
                    />
                  </Field>
                </div>
              </div>

              {/* Address */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="text-sm font-extrabold text-slate-900 mb-4">
                  Address lines
                </div>

                <div className="space-y-4">
                  <Field
                    label="Address Line 1"
                    required
                    error={touched.line1 ? errors.line1 : ""}
                    hint="Example: House 12, Road 5, Dhanmondi"
                  >
                    <input
                      value={form.line1}
                      onChange={(e) => setForm((s) => ({ ...s, line1: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, line1: true }))}
                      className={`${inputBase} ${touched.line1 && errors.line1 ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}
                      placeholder="House / Road / Area"
                      autoComplete="address-line1"
                    />
                  </Field>

                  <Field label="Address Line 2" hint="Apartment / Floor / Landmark (optional)">
                    <input
                      value={form.line2}
                      onChange={(e) => setForm((s) => ({ ...s, line2: e.target.value }))}
                      className={`${inputBase} border-slate-200`}
                      placeholder="Apartment / Landmark"
                      autoComplete="address-line2"
                    />
                  </Field>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="text-sm font-extrabold text-slate-900 mb-4">
                  Location
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="City" required error={touched.city ? errors.city : ""}>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                      className={`${inputBase} ${touched.city && errors.city ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}
                      placeholder="Dhaka"
                      autoComplete="address-level2"
                    />
                  </Field>

                  <Field label="State / District" required error={touched.state ? errors.state : ""}>
                    <input
                      value={form.state}
                      onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                      className={`${inputBase} ${touched.state && errors.state ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}
                      placeholder="Dhaka"
                      autoComplete="address-level1"
                    />
                  </Field>

                  <Field label="Postal Code" hint="Optional (but helps couriers)">
                    <input
                      value={form.postalCode}
                      onChange={(e) => setForm((s) => ({ ...s, postalCode: e.target.value }))}
                      className={`${inputBase} border-slate-200`}
                      placeholder="1207"
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <ToggleRow
                    checked={form.isDefault}
                    onChange={(v) => setForm((s) => ({ ...s, isDefault: v }))}
                    title="Set as default address"
                    subtitle="This address will be selected automatically during checkout."
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="text-sm font-extrabold text-slate-900">
                  Live preview
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  This is how your delivery address will look.
                </p>

                <div className="mt-4 rounded-xl bg-white border border-slate-200 p-4">
                  <div className="text-xs font-bold text-slate-500 mb-2">
                    {form.label || "Address"}
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-sm font-semibold text-slate-900 leading-6">
                    {formatPreview(form) || "Start filling the form to see preview…"}
                  </pre>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Tip: Add a landmark in Address Line 2 for faster delivery.
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
