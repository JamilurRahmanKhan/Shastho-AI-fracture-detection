/**
 * Frontend page: Users
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";
import { Search, Eye, User, Mail, Shield, Calendar, XCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

function fmtTime(ts) {
  if (!ts) return "";
  const d = ts?.toDate?.() || (ts instanceof Date ? ts : new Date(ts));
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function roleBadge(role) {
  const m = {
    user: "bg-gray-100 text-gray-700",
    doctor: "bg-blue-100 text-blue-700",
    pharmacy: "bg-teal-100 text-teal-700",
    admin: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${m[role] || m.user}`}>{role || "user"}</span>
  );
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(200));
      const snap = await getDocs(q);
      setRows(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setRows([]);
      setError("Failed to load users. Ensure admin rules are deployed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (role !== "all" && r.role !== role) return false;
      if (!s) return true;
      const hay = `${r.name || ""} ${r.email || ""} ${r.uid}`.toLowerCase();
      return hay.includes(s);
    });
  }, [rows, search, role]);

  const setRoleForUser = async (uid, nextRole) => {
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "users", uid), { role: nextRole, updatedAt: serverTimestamp() });
      await reload();
      setSelected((s) => (s && s.uid === uid ? { ...s, role: nextRole } : s));
    } catch (e) {
      console.error(e);
      setError("Role update failed. For safety, only admins can change roles (via Firestore rules).");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage accounts and roles</p>
        </div>
        <Button variant="outline" className="bg-transparent" type="button" onClick={reload}>
          Refresh
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, name, uid..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="doctor">Doctor</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </Card>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-gray-600">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-sm text-gray-600">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {(u.name || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{u.name || "(No name)"}</p>
                          <p className="text-xs text-gray-500">{u.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email || ""}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{roleBadge(u.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtTime(u.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-transparent"
                        type="button"
                        onClick={() => setSelected(u)}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.name || "User"}</h2>
                  <p className="text-sm text-gray-600">{selected.email || ""}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Profile</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">{selected.name || ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{selected.email || ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Role:</span>
                    {roleBadge(selected.role)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium text-gray-900">{fmtTime(selected.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Admin Actions</h3>
                <p className="text-xs text-gray-500 mb-3">
                  For safety, only the Admin Panel can change roles. Normal users can never self-assign privileged roles.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="bg-transparent justify-start gap-2"
                    disabled={saving || selected.role === "doctor"}
                    onClick={() => setRoleForUser(selected.uid, "doctor")}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Make Doctor
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent justify-start gap-2"
                    disabled={saving || selected.role === "pharmacy"}
                    onClick={() => setRoleForUser(selected.uid, "pharmacy")}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Make Pharmacy
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent justify-start gap-2"
                    disabled={saving || selected.role === "user"}
                    onClick={() => setRoleForUser(selected.uid, "user")}
                  >
                    <XCircle className="w-4 h-4" />
                    Set as User
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent justify-start gap-2"
                    disabled={saving || selected.role === "admin"}
                    onClick={() => setRoleForUser(selected.uid, "admin")}
                  >
                    <Shield className="w-4 h-4" />
                    Make Admin
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
