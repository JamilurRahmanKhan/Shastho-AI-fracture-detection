/**
 * Frontend API client: api
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side API wrapper for calling ShasthoAI backend endpoints.
 *
 * Project-specific notes:
 * - (none)
 */

import { auth } from "@/firebase/firebase";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

function parseFilenameFromDisposition(disposition) {
  if (!disposition) return null;
  // Handles: attachment; filename="..." OR filename*=UTF-8''...
  const mStar = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (mStar?.[1]) return decodeURIComponent(mStar[1].replace(/"/g, ''));
  const m = /filename="?([^";]+)"?/i.exec(disposition);
  if (m?.[1]) return decodeURIComponent(m[1]);
  return null;
}

export async function apiRequestBlob(path, { method = 'GET', headers = {}, body } = {}) {
  const token = await getIdToken();
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body,
  });

  if (!res.ok) {
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');
    const msg = (data && data.error) ? data.error : `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const blob = await res.blob();
  const filename = parseFilenameFromDisposition(res.headers.get('content-disposition'));
  return { blob, filename, contentType: res.headers.get('content-type') || blob.type || '' };
}

export async function apiRequest(path, { method = "GET", headers = {}, body } = {}) {
  const token = await getIdToken();
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;

  let finalBody = body;
  // Automatically JSON-encode plain objects (except FormData)
  if (body && !(body instanceof FormData)) {
    h["Content-Type"] = h["Content-Type"] || "application/json";
    finalBody = typeof body === "string" ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: finalBody,
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  health: () => apiRequest("/health"),

  // Admin: Analytics + Settings (Firestore + MongoDB)
  adminAnalyticsSummary: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/admin/analytics/summary${qs}`);
  },
  getAdminSettings: () => apiRequest('/admin/settings'),
  updateAdminSettings: (payload) => apiRequest('/admin/settings', { method: 'PUT', body: payload }),

  // Admin: Subscriptions (MongoDB)
  adminSubscriptionsSummary: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/admin/subscriptions/summary${qs}`);
  },
  adminListPlans: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/admin/subscriptions/plans${qs}`);
  },
  adminListTrials: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/admin/subscriptions/trials${qs}`);
  },
  adminSubscriptionActivity: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/admin/subscriptions/activity${qs}`);
  },
  adminGrantPlan: (payload) => apiRequest('/admin/subscriptions/grant/plan', { method: 'POST', body: payload }),
  adminCancelPlan: (planId, payload = {}) => apiRequest(`/admin/subscriptions/plans/${encodeURIComponent(String(planId))}/cancel`, { method: 'POST', body: payload }),
  adminGrantPack: (payload) => apiRequest('/admin/subscriptions/grant/pack', { method: 'POST', body: payload }),
  adminListUserEpisodes: (userUid) => apiRequest(`/admin/subscriptions/user/${encodeURIComponent(String(userUid))}/episodes`),

  // Role requests (Firestore via backend)
  createRoleRequest: (payload) => apiRequest('/role-requests', { method: 'POST', body: payload }),
  listMyRoleRequests: () => apiRequest('/role-requests/me'),
  roleRequestSummary: () => apiRequest('/role-requests/summary'),
  listRoleRequests: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/role-requests${qs}`);
  },
  markRoleRequestSeen: (id, seen) => apiRequest(`/role-requests/${encodeURIComponent(id)}/seen`, { method: 'PATCH', body: { seen } }),
  approveRoleRequest: (id, notes = '') => apiRequest(`/role-requests/${encodeURIComponent(id)}/approve`, { method: 'PATCH', body: { notes } }),
  rejectRoleRequest: (id, reason = '') => apiRequest(`/role-requests/${encodeURIComponent(id)}/reject`, { method: 'PATCH', body: { reason } }),

  // Doctors (from Firebase/Firestore via backend)
  listDoctors: () => apiRequest('/doctors'),

  // Subscriptions + Episodes (additive; used by new entitlement system)
  getSubscriptionPlans: () => apiRequest('/subscriptions/plans'),
  getMySubscriptionState: (episodeId = null) => {
    const qs = episodeId ? `?episodeId=${encodeURIComponent(String(episodeId))}` : '';
    return apiRequest(`/subscriptions/me${qs}`);
  },
  activateFreeThreeDays: () => apiRequest('/subscriptions/trial/activate', { method: 'POST' }),
  purchaseEpisodePlan: (payload) => apiRequest('/subscriptions/episode/plan', { method: 'POST', body: payload }),

  listEpisodes: (params = {}) => {
    const p = params || {};
    const sp = new URLSearchParams();
    if (p.status) sp.set('status', String(p.status));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/episodes${qs}`);
  },
  getDefaultEpisode: () => apiRequest('/episodes/default'),
  createEpisode: (payload) => apiRequest('/episodes', { method: 'POST', body: payload }),
  closeEpisode: (episodeId) => apiRequest(`/episodes/${encodeURIComponent(String(episodeId))}/close`, { method: 'POST' }),

  // X-ray upload (optionally attach to an episode)
  uploadXray: async (file, episodeId = null) => {
    const fd = new FormData();
    fd.append("file", file);
    if (episodeId) fd.append('episodeId', String(episodeId));
    return apiRequest("/xrays/upload", { method: "POST", body: fd });
  },

  // Chat-only X-ray upload (runs the integrated ML model).
  // This keeps the rest of the platform unchanged.
  uploadChatXray: async (file, episodeId = null) => {
    const fd = new FormData();
    fd.append('file', file);
    if (episodeId) fd.append('episodeId', String(episodeId));
    return apiRequest('/chat/xrays/upload', { method: 'POST', body: fd });
  },
  listXrays: (params = {}) => {
    const p = typeof params === 'string' ? { episodeId: params } : (params || {});
    const sp = new URLSearchParams();
    if (p.episodeId) sp.set('episodeId', String(p.episodeId));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/xrays${qs}`);
  },
  getXray: (id) => apiRequest(`/xrays/${id}`),

  getDefaultChatSession: () => apiRequest("/chat/sessions/default"),
  listMessages: (sessionId) => apiRequest(`/chat/sessions/${sessionId}/messages`),
  sendMessage: (sessionId, payload) => apiRequest(`/chat/sessions/${sessionId}/messages`, { method: "POST", body: payload }),

  // Medications (MongoDB)
  listMedications: () => apiRequest("/medications"),
  createMedication: (payload) => apiRequest('/medications', { method: 'POST', body: payload }),
  updateMedication: (id, payload) => apiRequest(`/medications/${id}`, { method: 'PATCH', body: payload }),
  deleteMedication: (id) => apiRequest(`/medications/${id}`, { method: 'DELETE' }),
  markMedication: (id, action, note = '') => apiRequest(`/medications/${id}`, { method: 'PATCH', body: { action, note } }),
  // Appointments (Requests + Scheduling)
  listAppointments: () => apiRequest("/appointments"),
  getAppointment: (id) => apiRequest(`/appointments/${encodeURIComponent(id)}`),
  createAppointment: (payload) => apiRequest('/appointments', { method: 'POST', body: payload }),
  updateAppointment: (id, payload) => apiRequest(`/appointments/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),
  deleteAppointment: (id) => apiRequest(`/appointments/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Doctor-facing appointment management
  listDoctorAppointments: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/appointments/doctor${qs}`);
  },
  decideAppointmentRequest: (appointmentId, action, reason = '') =>
    apiRequest(`/appointments/${encodeURIComponent(appointmentId)}/decision`, {
      method: 'PATCH',
      body: { action, reason },
    }),

  // Doctor availability (Phase: Calendar scheduling)
  getDoctorAvailabilityMe: () => apiRequest('/availability/me'),
  updateDoctorAvailabilityMe: (payload) => apiRequest('/availability/me', { method: 'PUT', body: payload }),
  addDoctorTimeOff: (payload) => apiRequest('/availability/me/timeoff', { method: 'POST', body: payload }),
  removeDoctorTimeOff: (timeOffId) => apiRequest(`/availability/me/timeoff/${encodeURIComponent(timeOffId)}`, { method: 'DELETE' }),

  // Doctor <-> User messaging (Socket.IO + REST)
  listMessagingThreads: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/messaging/threads${qs}`);
  },
  getMessagingThreadForAppointment: (appointmentId) =>
    apiRequest(`/messaging/appointments/${encodeURIComponent(appointmentId)}/thread`),
  listThreadMessages: (threadId, params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/messaging/threads/${encodeURIComponent(threadId)}/messages${qs}`);
  },
  uploadThreadFiles: (threadId, files = []) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('files', f));
    return apiRequest(`/messaging/threads/${encodeURIComponent(threadId)}/uploads`, { method: 'POST', body: fd });
  },
  sendThreadMessage: (threadId, payload) =>
    apiRequest(`/messaging/threads/${encodeURIComponent(threadId)}/messages`, { method: 'POST', body: payload }),
  deleteThreadMessage: (threadId, messageId) =>
    apiRequest(`/messaging/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' }),
  deleteMessagingThread: (threadId) =>
    apiRequest(`/messaging/threads/${encodeURIComponent(threadId)}`, { method: 'DELETE' }),
  getPresence: (uid) =>
    apiRequest(`/messaging/presence/${encodeURIComponent(uid)}`),
  markThreadRead: (threadId) =>
    apiRequest(`/messaging/threads/${encodeURIComponent(threadId)}/read`, { method: 'POST' }),
  clearThreadHistory: (threadId) =>
    apiRequest(`/messaging/threads/${encodeURIComponent(threadId)}/clear`, { method: 'POST' }),

  // Doctor panel dynamic data
  getDoctorDashboard: () => apiRequest('/doctor/dashboard'),
  listDoctorPatients: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/doctor/patients${qs}`);
  },
  getDoctorPatient: (uid) => apiRequest(`/doctor/patients/${encodeURIComponent(uid)}`),
  // Medical Records (GridFS)
  listMedicalRecords: () => apiRequest('/medical-records'),
  uploadMedicalRecord: (formData) => apiRequest('/medical-records', { method: 'POST', body: formData }),
  updateMedicalRecord: (id, payload) => apiRequest(`/medical-records/${id}`, { method: 'PATCH', body: payload }),
  deleteMedicalRecord: (id) => apiRequest(`/medical-records/${id}`, { method: 'DELETE' }),
  downloadMedicalRecord: (id, inline = false) => apiRequestBlob(`/medical-records/${id}/download?inline=${inline ? '1' : '0'}`),

  // Backward-compatible alias (metadata only)
  listRecords: () => apiRequest('/records'),

  // Pharmacy Inventory (MongoDB)
  listPharmacyInventory: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/pharmacy/inventory${qs}`);
  },
  getPharmacyInventoryItem: (id) => apiRequest(`/pharmacy/inventory/${encodeURIComponent(id)}`),
  createPharmacyInventoryItem: (payload) => apiRequest('/pharmacy/inventory', { method: 'POST', body: payload }),
  updatePharmacyInventoryItem: (id, payload) =>
    apiRequest(`/pharmacy/inventory/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),
  deletePharmacyInventoryItem: (id) => apiRequest(`/pharmacy/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getPharmacyInventoryImage: (id) => apiRequestBlob(`/pharmacy/inventory/${encodeURIComponent(id)}/image`),

  // Pharmacy Orders (fulfillment)
  listPharmacyOrders: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/pharmacy/orders${qs}`);
  },
  getPharmacyOrder: (idOrNo) => apiRequest(`/pharmacy/orders/${encodeURIComponent(idOrNo)}`),
  downloadPharmacyOrderPrescription: (idOrNo) =>
    apiRequestBlob(`/pharmacy/orders/${encodeURIComponent(idOrNo)}/prescription`),
  updatePharmacyOrder: (idOrNo, payload) =>
    apiRequest(`/pharmacy/orders/${encodeURIComponent(idOrNo)}`, { method: 'PATCH', body: payload }),
  updatePharmacyOrderPrescription: (idOrNo, payload) =>
    apiRequest(`/pharmacy/orders/${encodeURIComponent(idOrNo)}/prescription`, { method: 'PATCH', body: payload }),
  updatePharmacyOrderPaymentStatus: (idOrNo, payload) =>
    apiRequest(`/pharmacy/orders/${encodeURIComponent(idOrNo)}/payment`, { method: 'PATCH', body: payload }),

  // Pharmacy Deliveries (Phase 9)
  listPharmacyDeliveries: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/pharmacy/deliveries${qs}`);
  },
  listDeliveryRiders: () => apiRequest('/pharmacy/deliveries/riders'),
  createDeliveryRider: (payload) => apiRequest('/pharmacy/deliveries/riders', { method: 'POST', body: payload }),
  updateDeliveryRider: (id, payload) =>
    apiRequest(`/pharmacy/deliveries/riders/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),
  deleteDeliveryRider: (id) => apiRequest(`/pharmacy/deliveries/riders/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  assignDeliveryRider: (idOrNo, payload) =>
    apiRequest(`/pharmacy/deliveries/${encodeURIComponent(idOrNo)}/assign`, { method: 'POST', body: payload }),
  updateDeliveryStatus: (idOrNo, payload) =>
    apiRequest(`/pharmacy/deliveries/${encodeURIComponent(idOrNo)}/status`, { method: 'PATCH', body: payload }),

  // Pharmacy Reports & Analytics (Phase 10)
  getPharmacyReportsOverview: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/pharmacy/reports/overview${qs}`);
  },

  // Pharmacy Settings (Phase 11)
  getPharmacySettings: () => apiRequest('/pharmacy/settings'),
  updatePharmacySettings: (payload) => apiRequest('/pharmacy/settings', { method: 'PUT', body: payload }),
  uploadPharmacyLicenseDocument: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiRequest('/pharmacy/settings/license-document', { method: 'POST', body: fd });
  },
  downloadPharmacyLicenseDocument: () => apiRequestBlob('/pharmacy/settings/license-document'),

// ----------------------------
  // Medical Store (User-facing)
  // ----------------------------
  listStoreProducts: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/store/products${qs}`);
  },
  getStoreProduct: (id) => apiRequest(`/store/products/${id}`),
  getStoreProductImage: (id) => apiRequestBlob(`/store/products/${id}/image`),

  // Store Pricing Config (Phase 7)
  getStorePricingConfig: () => apiRequest('/store/pricing-config'),
  updateStorePricingConfig: (payload) => apiRequest('/store/pricing-config', { method: 'PUT', body: payload }),
  getStoreProductReviews: (id, params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/store/products/${id}/reviews${qs}`);
  },
  createStoreProductReview: (id, payload) => apiRequest(`/store/products/${id}/reviews`, { method: 'POST', body: payload }),

  // Cart (requires user auth)
  getCart: () => apiRequest('/store/cart'),
  addCartItem: (productId, quantity = 1) => apiRequest('/store/cart/items', { method: 'POST', body: { productId, quantity } }),
  setCartItemQty: (productId, quantity) => apiRequest(`/store/cart/items/${productId}`, { method: 'PATCH', body: { quantity } }),
  removeCartItem: (productId) => apiRequest(`/store/cart/items/${productId}`, { method: 'DELETE' }),
  clearCart: () => apiRequest('/store/cart/clear', { method: 'POST' }),
  syncCart: (items) => apiRequest('/store/cart/sync', { method: 'POST', body: { items } }),

  // Checkout (COD, requires user auth)
  uploadStorePrescription: (file, doctorNote = '') => {
    const fd = new FormData();
    fd.append('file', file);
    if (doctorNote) fd.append('doctorNote', doctorNote);
    return apiRequest('/store/prescriptions', { method: 'POST', body: fd });
  },
  // Upload a prescription for an existing order (e.g. after pharmacy rejection)
  reuploadStoreOrderPrescription: (idOrNo, file, doctorNote = '') => {
    const fd = new FormData();
    fd.append('file', file);
    if (doctorNote) fd.append('doctorNote', doctorNote);
    return apiRequest(`/store/orders/${encodeURIComponent(idOrNo)}/prescription`, { method: 'POST', body: fd });
  },

  checkoutCOD: (payload) => apiRequest('/store/checkout', { method: 'POST', body: payload }),

  // Address book (requires user auth)
  listStoreAddresses: () => apiRequest('/store/addresses'),
  createStoreAddress: (payload) => apiRequest('/store/addresses', { method: 'POST', body: payload }),
  updateStoreAddress: (id, payload) => apiRequest(`/store/addresses/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),
  deleteStoreAddress: (id) => apiRequest(`/store/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  setDefaultStoreAddress: (id) => apiRequest(`/store/addresses/${encodeURIComponent(id)}/default`, { method: 'POST' }),

  // Prescription downloads
  downloadStoreOrderPrescription: (idOrNo) => apiRequestBlob(`/store/orders/${idOrNo}/prescription`),
  downloadPharmacyOrderPrescription: (idOrNo) => apiRequestBlob(`/pharmacy/orders/${encodeURIComponent(idOrNo)}/prescription`),
  updatePharmacyOrderPrescriptionStatus: (idOrNo, payload) => apiRequest(`/pharmacy/orders/${encodeURIComponent(idOrNo)}/prescription`, { method: 'PATCH', body: payload }),

  // Orders (requires user auth)
  getStoreOrders: () => apiRequest('/store/orders'),
  getStoreOrder: (idOrNo) => apiRequest(`/store/orders/${idOrNo}`),
  downloadStoreOrderPrescription: (idOrNo) => apiRequestBlob(`/store/orders/${idOrNo}/prescription`),
  listMyStoreOrders: () => apiRequest('/store/orders'),
  getMyStoreOrder: (idOrNo) => apiRequest(`/store/orders/${idOrNo}`),

  // ----------------------------
  // Notifications (Phase 9)
  // ----------------------------
  listNotifications: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/notifications${qs}`);
  },
  getUnreadNotificationCount: () => apiRequest('/notifications/unread-count'),
  markNotificationRead: (id) => apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read', { method: 'POST' }),
  deleteNotification: (id) => apiRequest(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ----------------------------
  // Admin - Store Orders (Phase 9)
  // ----------------------------
  adminListStoreOrders: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined' || v === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest(`/admin/store/orders${qs}`);
  },
  adminGetStoreOrder: (idOrNo) => apiRequest(`/admin/store/orders/${encodeURIComponent(idOrNo)}`),
  adminCancelStoreOrder: (idOrNo, payload = {}) => apiRequest(`/admin/store/orders/${encodeURIComponent(idOrNo)}/cancel`, { method: 'POST', body: payload }),


  // ----------------------------
  // Subscription-linked actions (PDF / Share / Compare / Rehab)
  // ----------------------------
  exportXrayPdf: (xrayId) => apiRequestBlob(`/xrays/${encodeURIComponent(xrayId)}/export/pdf`, { method: 'POST' }),
  createXrayShareLink: (xrayId) => apiRequest(`/xrays/${encodeURIComponent(xrayId)}/share`, { method: 'POST' }),
  revokeShareLink: (token) => apiRequest(`/share/revoke/${encodeURIComponent(token)}`, { method: 'POST' }),
  compareXrays: (leftId, rightId, notes = '') => apiRequest(`/xrays/compare`, { method: 'POST', body: { leftId, rightId, notes } }),
  listComparisons: (episodeId) => {
    const qs = episodeId ? `?episodeId=${encodeURIComponent(episodeId)}` : '';
    return apiRequest(`/xrays/comparisons${qs}`);
  },
  getEpisodeRehab: (episodeId) => apiRequest(`/episodes/${encodeURIComponent(episodeId)}/rehab`),
  listRehabCheckins: (episodeId) => apiRequest(`/episodes/${encodeURIComponent(episodeId)}/rehab/checkins`),
  saveRehabCheckin: (episodeId, payload = {}) => apiRequest(`/episodes/${encodeURIComponent(episodeId)}/rehab/checkins`, { method: 'POST', body: payload }),
  listRehabChecklist: (episodeId) => apiRequest(`/episodes/${encodeURIComponent(episodeId)}/rehab/checklist`),
  toggleRehabChecklist: (episodeId, taskKey) => apiRequest(`/episodes/${encodeURIComponent(episodeId)}/rehab/checklist/toggle`, { method: 'POST', body: { taskKey } }),
};

// Default export for legacy imports (some pages import `api` as default)
export default api;