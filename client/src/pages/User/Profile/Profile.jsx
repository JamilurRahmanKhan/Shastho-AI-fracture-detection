/**
 * Frontend page: Profile
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/firebase/firebase";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from "lucide-react";

const INPUT_BASE =
  "w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

function safeString(v) {
  return (v ?? "").toString();
}

export default function UserProfile() {
  const { authUser, profile, updateUserProfile, refreshProfile, loading } = useAuth();

  const createdAt = useMemo(() => {
    const raw = profile?.createdAt;
    if (!raw) return null;
    if (raw instanceof Date) return raw;
    if (typeof raw?.toDate === "function") {
      try {
        return raw.toDate();
      } catch {
        return null;
      }
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [profile?.createdAt]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    dob: "",
    location: "",
    address: "",
    photoURL: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: safeString(profile?.name || profile?.displayName || authUser?.displayName || ""),
      phone: safeString(profile?.phone),
      gender: safeString(profile?.gender),
      dob: safeString(profile?.dob),
      location: safeString(profile?.location),
      address: safeString(profile?.address),
      photoURL: safeString(profile?.photoURL || authUser?.photoURL || ""),
      emergencyContactName: safeString(profile?.emergencyContactName),
      emergencyContactPhone: safeString(profile?.emergencyContactPhone),
    }));
  }, [profile, authUser]);

  const onChange = (key) => (e) => {
    const value = e?.target?.value ?? "";
    setForm((p) => ({ ...p, [key]: value }));
  };

  const canSave = useMemo(() => {
    return Boolean(form.name.trim());
  }, [form.name]);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!authUser?.uid) {
      setError("You must be logged in to update your profile.");
      return;
    }

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        dob: form.dob,
        location: form.location.trim(),
        address: form.address.trim(),
        photoURL: form.photoURL.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
      };

      await updateUserProfile(payload);

      // Keep Firebase Auth profile in sync (display name + avatar URL)
      if (auth.currentUser) {
        const updates = {};
        if (payload.name) updates.displayName = payload.name;
        if (payload.photoURL) updates.photoURL = payload.photoURL;
        await updateAuthProfile(auth.currentUser, updates);
      }

      await refreshProfile();
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFF]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
            <p className="mt-2 text-slate-600">
              View and update your personal information.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {form.photoURL ? (
                  <img
                    src={form.photoURL}
                    alt="avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <User className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {profile?.name || authUser?.displayName || "User"}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Role: {profile?.role || "user"}
                </div>
              </div>
            </div>
          </div>
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

        <form onSubmit={save} className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Account summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900">Account</h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Email</div>
                    <div className="text-sm text-slate-900 break-all">{profile?.email || authUser?.email || ""}</div>
                    <div className="text-xs text-slate-500 mt-1">Email cannot be changed here.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Joined</div>
                    <div className="text-sm text-slate-900">
                      {createdAt ? createdAt.toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-600">Subscription</div>
                    <div className="text-sm text-slate-900">
                      {profile?.isPremium ? "Premium" : "Free"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Profile photo</h2>
              <p className="text-sm text-slate-600 mt-1">
                Add a photo URL (optional). You can host it anywhere (Google Drive shared link won’t work unless it’s a direct image URL).
              </p>

              <label className="block text-sm font-semibold text-slate-900 mt-4 mb-2">Photo URL</label>
              <div className="relative">
                <Camera className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  className={`${INPUT_BASE} pl-10`}
                  value={form.photoURL}
                  onChange={onChange("photoURL")}
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                />
              </div>
            </div>
          </div>

          {/* Right: Editable form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900">Personal information</h2>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Full name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      className={`${INPUT_BASE} pl-10`}
                      value={form.name}
                      onChange={onChange("name")}
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      className={`${INPUT_BASE} pl-10`}
                      value={form.phone}
                      onChange={onChange("phone")}
                      placeholder="e.g., +8801XXXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Gender</label>
                  <select className={INPUT_BASE} value={form.gender} onChange={onChange("gender")}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Date of birth</label>
                  <input
                    className={INPUT_BASE}
                    type="date"
                    value={form.dob}
                    onChange={onChange("dob")}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      className={`${INPUT_BASE} pl-10`}
                      value={form.location}
                      onChange={onChange("location")}
                      placeholder="City, District"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Address</label>
                  <textarea
                    className={`${INPUT_BASE} resize-none`}
                    rows={3}
                    value={form.address}
                    onChange={onChange("address")}
                    placeholder="Street, area, etc."
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Emergency contact (optional)</h2>
              <p className="text-sm text-slate-600 mt-1">
                This can help doctors reach someone quickly if needed.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Contact name</label>
                  <input
                    className={INPUT_BASE}
                    value={form.emergencyContactName}
                    onChange={onChange("emergencyContactName")}
                    placeholder="Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Contact phone</label>
                  <input
                    className={INPUT_BASE}
                    value={form.emergencyContactPhone}
                    onChange={onChange("emergencyContactPhone")}
                    placeholder="Phone"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="submit"
                disabled={!canSave || saving || loading}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
