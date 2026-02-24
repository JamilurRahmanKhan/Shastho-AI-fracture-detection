/**
 * Frontend: AuthContext
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { api, apiRequest } from "@/services/api";

/**
 * SECURITY MODEL (frontend):
 * - Role is stored in Firestore: users/{uid}.role
 * - Allowed roles: "user" | "doctor" | "pharmacy" | "admin"
 * - Clients are NEVER allowed to self-assign privileged roles.
 *   The app enforces this by:
 *   (1) Forcing client sign-up to always create role="user".
 *   (2) For doctor/pharmacy login, requiring the role doc to already exist and match.
 * - REAL security must be enforced server-side:
 *   - Firestore Security Rules (firestore.rules)
 *   - Backend endpoints MUST verify Firebase ID tokens (when you add Node/MongoDB).
 */

const AuthContext = createContext(null);

function friendlyAuthError(e) {
  const code = e?.code || "";

  // Firebase Auth setup issues
  if (code === "auth/configuration-not-found") {
    return (
      "Firebase Authentication is not enabled or not configured for this project. " +
      "Fix: Firebase Console → Authentication → Sign-in method → enable Email/Password, " +
      "and ensure Authentication → Settings → Authorized domains includes your domain."
    );
  }
  if (code === "auth/unauthorized-domain") {
    return (
      "This domain is not authorized for Firebase Auth. " +
      "Fix: Firebase Console → Authentication → Settings → Authorized domains → add your domain."
    );
  }
  if (code === "auth/invalid-api-key") {
    return (
      "Invalid Firebase API key (or restricted). " +
      "Fix: Google Cloud Console → APIs & Services → Credentials → check API key restrictions and allow Identity Toolkit API."
    );
  }

  // Common user-facing auth errors
  if (code === "auth/email-already-in-use") return "This email is already in use. Please sign in instead.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "Incorrect email or password.";
  if (code === "auth/user-not-found") return "No account found for this email.";
  if (code === "auth/weak-password") return "Password is too weak. Use at least 6 characters.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please try again later.";

  return e?.message || "Authentication failed. Please try again.";
}

function roleLabel(role) {
  if (role === "user") return "User";
  if (role === "doctor") return "Doctor";
  if (role === "pharmacy") return "Pharmacy";
  if (role === "admin") return "Admin";
  return String(role || "Unknown");
}


const PROFILE_CACHE_KEY = "shasthoai_profile_cache_v1";

function readCachedProfile(uid) {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const entry = parsed?.[uid];
    return entry?.data || null;
  } catch {
    return null;
  }
}

function writeCachedProfile(uid, data) {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[uid] = { data, cachedAt: Date.now() };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore cache write errors
  }
}

function isFirestoreOfflineError(e) {
  const code = e?.code || "";
  // Firestore SDK commonly uses these codes for connectivity / offline issues
  if (code === "unavailable" || code === "failed-precondition" || code === "deadline-exceeded") return true;
  const msg = String(e?.message || "").toLowerCase();
  return msg.includes("offline") || msg.includes("network") || msg.includes("timeout");
}

async function getUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function requireUserDoc(uid) {
  const data = await getUserDoc(uid);
  if (!data) throw new Error("Account profile is missing. Please sign up (User) or contact an administrator.");
  return data;
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth changes and keep profile in sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user || null);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserDoc(user.uid);

        // If someone is signed in but has no profile doc, do not keep a half-authenticated session.
        if (!data) {
          console.warn("Auth user has no users/{uid} profile doc; signing out for safety.");
          await signOut(auth);
          setProfile(null);
          return;
        }

        const nextProfile = { uid: user.uid, ...data };
        setProfile(nextProfile);
        writeCachedProfile(user.uid, nextProfile);
      } catch (e) {
        console.error("Failed to load user profile:", e);

        // Graceful offline fallback:
        // - If Firestore is temporarily unreachable, use cached profile (if available).
        // - Otherwise, create a minimal profile so the UI can keep working in a degraded mode.
        if (isFirestoreOfflineError(e)) {
          const cached = readCachedProfile(user.uid);
          if (cached) {
            setProfile({ ...cached, _fromCache: true });
          } else {
            setProfile({
              uid: user.uid,
              role: "user",
              name: user.displayName || "",
              email: user.email || "",
              _offlineProfile: true,
              _roleUnverified: true,
            });
          }
        } else {
          // Non-offline errors should keep current behavior (fail closed).
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  /**
   * Sign-up creates a standard "user" profile, then submits a role request.
   * - The saved users/{uid}.role is always "user" on sign-up (no privilege escalation).
   * - The requested role is stored in role_requests for admins to review.
   */
  const signUp = async ({ email, password, name = "", extra = {}, role = "user", requestedRole }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      if (name) {
        try {
          await updateProfile(cred.user, { displayName: name });
        } catch {
          // non-fatal
        }
      }

      const ref = doc(db, "users", cred.user.uid);
      await setDoc(
        ref,
        {
          role: "user",
          name,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...extra,
        },
        { merge: true }
      );

      // Submit a role request so admins get notified in the Admin Panel.
      // IMPORTANT: During sign-up, auth.currentUser might not be available immediately.
      // So we attach the ID token from the newly-created user explicitly.
      const desired = String(requestedRole || role || "user").trim().toLowerCase() || "user";
      const roleReqPayload = {
        requestedRole: desired,
        fullName: name,
        organization: extra?.organization || extra?.hospital || extra?.clinic || "",
        licenseNumber: extra?.licenseNumber || extra?.license || "",
        phone: extra?.phone || "",
        source: "signup",
      };

      try {
        const token = await cred.user.getIdToken(true);
        await apiRequest("/role-requests", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: roleReqPayload,
        });
      } catch (err) {
        // One quick retry helps in rare timing cases.
        try {
          await new Promise((r) => setTimeout(r, 300));
          await api.createRoleRequest(roleReqPayload);
        } catch (e2) {
          console.warn("Role request submission failed (non-fatal):", e2?.message || e2);
        }
      }

      const data = await requireUserDoc(cred.user.uid);
      setProfile({ uid: cred.user.uid, ...data });
      return { user: cred.user, profile: { uid: cred.user.uid, ...data } };
    } catch (e) {
      throw new Error(friendlyAuthError(e));
    }
  };

  /**
   * Standard sign-in (used by User login).
   * Requires the profile doc to exist (prevents cross-panel fallback + ensures consistent state).
   */
  const signIn = async ({ email, password }) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const data = await requireUserDoc(cred.user.uid);
      setProfile({ uid: cred.user.uid, ...data });
      return { user: cred.user, profile: { uid: cred.user.uid, ...data } };
    } catch (e) {
      // If auth succeeded but profile missing, we want to end session.
      if (String(e?.message || "").includes("Account profile is missing")) {
        try { await signOut(auth); } catch {}
        setProfile(null);
        throw e;
      }
      throw new Error(friendlyAuthError(e));
    }
  };

  /**
   * Sign-in with strict role enforcement.
   * - Requires users/{uid} to exist.
   * - If expectedRole doesn't match users/{uid}.role → sign out immediately and error.
   */
  const signInWithRole = async ({ email, password, expectedRole }) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const data = await requireUserDoc(cred.user.uid);

      const actualRole = data?.role || null;
      if (!actualRole) {
        await signOut(auth);
        setProfile(null);
        throw new Error("Account role is missing. Please contact an administrator.");
      }

      if (expectedRole && actualRole !== expectedRole) {
        await signOut(auth);
        setProfile(null);
        throw new Error(
          `This account is registered as ${roleLabel(actualRole)}. Please sign in from the ${roleLabel(actualRole)} login page.`
        );
      }

      setProfile({ uid: cred.user.uid, ...data });
      return { user: cred.user, profile: { uid: cred.user.uid, ...data } };
    } catch (e) {
      const msg = String(e?.message || "");
      if (msg.includes("registered as") || msg.includes("profile is missing") || msg.includes("role is missing")) {
        throw e;
      }
      throw new Error(friendlyAuthError(e));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      throw new Error(friendlyAuthError(e));
    }
  };

  const updateUserProfile = async (partial) => {
    if (!authUser) throw new Error("Not authenticated");
    const ref = doc(db, "users", authUser.uid);
    await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() });
    const fresh = await getDoc(ref);
    if (fresh.exists()) setProfile({ uid: authUser.uid, ...fresh.data() });
  };

  const value = useMemo(
    () => ({
      authUser,
      profile,
      role: profile?.role || null,
      loading,
      signUp,
      signIn,
      signInWithRole,
      logout,
      resetPassword,
      updateUserProfile,
    }),
    [authUser, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
