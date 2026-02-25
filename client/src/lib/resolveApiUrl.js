// client/src/lib/resolveApiUrl.js
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// If API_BASE is absolute (https://backend.../api), get its origin (https://backend...)
const API_ORIGIN = API_BASE.startsWith("http") ? new URL(API_BASE).origin : "";

export function resolveApiUrl(url) {
  if (!url) return "";
  // If backend returns "/api/....", make it absolute to backend origin
  if (API_ORIGIN && url.startsWith("/api/")) return `${API_ORIGIN}${url}`;
  return url;
}