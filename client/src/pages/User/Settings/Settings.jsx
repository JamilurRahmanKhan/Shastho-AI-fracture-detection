/**
 * Frontend page: Settings
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { auth } from "@/firebase/firebase";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Gift,
  Globe,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trash2,
} from "lucide-react";
import { formatPlanCode, formatTimeLeft, getRemaining } from "@/components/subscriptions/subscription-utils";

const INPUT_BASE =
  "w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

function ensureSettingsShape(settings) {
  const s = settings && typeof settings === "object" ? settings : {};
  const notifications = s.notifications && typeof s.notifications === "object" ? s.notifications : {};
  return {
    theme: s.theme || "system",
    language: s.language || "en",
    notifications: {
      email: notifications.email !== undefined ? Boolean(notifications.email) : true,
      inApp: notifications.inApp !== undefined ? Boolean(notifications.inApp) : true,
      marketing: notifications.marketing !== undefined ? Boolean(notifications.marketing) : false,
    },
    privacyShareData: s.privacyShareData !== undefined ? Boolean(s.privacyShareData) : false,
  };
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (theme === "light") root.classList.add("theme-light");
  if (theme === "dark") root.classList.add("theme-dark");
  // "system" = no class (use default)
}

export default function UserSettings() {
  const navigate = useNavigate();
  const { authUser, profile, updateUserProfile, logout } = useAuth();

  const sub = useSubscription();
  const snapshot = sub?.snapshot || null;
  const trial = sub?.trial || null;
  const plan = snapshot && sub?.planMap ? sub.planMap.get(snapshot.code) : null;

  const initial = useMemo(() => ensureSettingsShape(profile?.settings), [profile?.settings]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [dangerBusy, setDangerBusy] = useState(false);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    // Apply immediately for UX; also store in localStorage for faster load.
    try {
      localStorage.setItem("shasthoai_theme", form.theme);
    } catch {}
    applyTheme(form.theme);
  }, [form.theme]);

  const setField = (path, value) => {
    setForm((p) => {
      const next = { ...p };
      if (path === "theme") next.theme = value;
      if (path === "language") next.language = value;
      if (path === "privacyShareData") next.privacyShareData = value;
      if (path.startsWith("notifications.")) {
        const k = path.split(".")[1];
        next.notifications = { ...next.notifications, [k]: value };
      }
      return next;
    });
  };

  const save = async () => {
    setError("");
    setSuccess("");

    if (!authUser?.uid) {
      setError("You must be logged in to update settings.");
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({ settings: form });
      setSuccess("Settings updated successfully.");
    } catch (err) {
      setError(err?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    setSuccess("");

    const email = authUser?.email || profile?.email;
    if (!email) {
      setError("No email found for this account.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err?.message || "Failed to send reset email.");
    }
  };

  const doLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Logout failed.");
    }
  };

  const deleteAccount = async () => {
    const ok = window.confirm(
      "This will permanently delete your account (Firebase Auth). Your data may remain in Firestore for audit/compliance. Continue?"
    );
    if (!ok) return;

    setDangerBusy(true);
    setError("");
    setSuccess("");

    try {
      // Soft-delete marker in Firestore (best-effort)
      await updateUserProfile({ status: "deleted", deletedAt: new Date().toISOString() }).catch(() => {});

      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      setSuccess("Account deleted.");
      navigate("/");
    } catch (err) {
      // Firebase may require recent sign-in for deletion.
      setError(
        err?.message ||
          "Failed to delete account. Firebase may require you to log out and log in again (recent sign-in) before deleting."
      );
    } finally {
      setDangerBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFF]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="mt-2 text-slate-600">Manage your preferences, notifications, and security.</p>
        </div>

        {(success || error) && (
          <div className="mt-6">
            {success ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-900 font-medium text-sm">{success}</p>
              </div>
            ) : null}
            {error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-rose-900 font-medium text-sm">{error}</p>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preferences */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-slate-600" />
                Preferences
              </h2>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Language</label>
                  <select
                    className={INPUT_BASE}
                    value={form.language}
                    onChange={(e) => setField("language", e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Theme</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setField("theme", "light")}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        form.theme === "light"
                          ? "border-blue-200 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setField("theme", "dark")}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        form.theme === "dark"
                          ? "border-blue-200 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setField("theme", "system")}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        form.theme === "system"
                          ? "border-blue-200 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      System
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Theme is stored in your profile settings and localStorage.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-600" />
                Notifications
              </h2>

              <div className="mt-5 space-y-4">
                {[
                  { key: "email", label: "Email notifications", desc: "Receive important updates via email" },
                  { key: "inApp", label: "In-app notifications", desc: "Show alerts inside ShasthoAI" },
                  { key: "marketing", label: "Marketing messages", desc: "Offers, discounts, and store promotions" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                      <div className="text-xs text-slate-600 mt-1">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-blue-600"
                      checked={Boolean(form.notifications?.[item.key])}
                      onChange={(e) => setField(`notifications.${item.key}`, e.target.checked)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-600" />
                Privacy
              </h2>

              <label className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Share anonymized usage data</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Helps improve accuracy and performance. We recommend keeping this off unless required.
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-blue-600"
                  checked={Boolean(form.privacyShareData)}
                  onChange={(e) => setField("privacyShareData", e.target.checked)}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900">Plan & Trial</h2>
              <p className="text-sm text-slate-600 mt-1">Manage your FREE_ThreeDays trial and view current usage.</p>

              {snapshot ? (
                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{formatPlanCode(snapshot.code)}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {snapshot.sourceType === "plan" ? "Episode plan" : snapshot.sourceType === "trial" ? "Trial" : "Free base"}
                        {snapshot.endAt ? ` • ends in ${formatTimeLeft(snapshot.endAt)}` : ""}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 bg-slate-50">
                      {snapshot.sourceType?.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-600">Scans</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{getRemaining(snapshot, "scans") ?? "—"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-600">PDF exports</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{getRemaining(snapshot, "pdfExports") ?? "—"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-600">Scan chat</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{getRemaining(snapshot, "scanChat") ?? "—"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="text-xs text-slate-600">General chat</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{getRemaining(snapshot, "generalChat") ?? "—"}</div>
                    </div>
                  </div>

                  {trial?.eligible ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await sub?.activateTrial?.();
                          setSuccess("FREE_ThreeDays activated. You can now use trial features for 72 hours.");
                        } catch (e) {
                          setError(e?.message || "Failed to activate trial.");
                        }
                      }}
                      disabled={sub?.busy}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 transition-colors"
                    >
                      <Gift className="w-4 h-4" />
                      {sub?.busy ? "Activating..." : "Activate FREE_ThreeDays"}
                    </button>
                  ) : (
                    <div className="mt-4 text-xs text-slate-600">
                      Trial eligibility: {trial?.cooldownReason ? trial.cooldownReason : "Not eligible right now."}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-600">Loading subscription status...</div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900">Security</h2>
              <p className="text-sm text-slate-600 mt-1">Password and session controls.</p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={resetPassword}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Send password reset email
                </button>

                <button
                  type="button"
                  onClick={doLogout}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-rose-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger zone
              </h2>
              <p className="text-sm text-rose-800 mt-2">
                Deleting your account is permanent. Firebase may require recent sign-in.
              </p>

              <button
                type="button"
                onClick={deleteAccount}
                disabled={dangerBusy}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {dangerBusy ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
