/**
 * Frontend page: RoleRequests
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

function fmtTime(ts) {
  if (!ts) return "";
  const d = ts?.toDate?.() || (ts instanceof Date ? ts : new Date(ts));
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function rolePill(role) {
  const r = String(role || '').toLowerCase();
  const map = {
    doctor: { cls: 'bg-blue-100 text-blue-700', label: 'Doctor' },
    pharmacy: { cls: 'bg-teal-100 text-teal-700', label: 'Pharmacy' },
    user: { cls: 'bg-gray-100 text-gray-700', label: 'User' },
    admin: { cls: 'bg-purple-100 text-purple-700', label: 'Admin' },
  };
  const m = map[r] || { cls: 'bg-gray-100 text-gray-700', label: r || 'Role' };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${m.cls}`}>{m.label}</span>
  );
}

export default function RoleRequestsPage() {
  const { authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState({ open: false, type: null, reason: "" });

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await api.listRoleRequests({ status: activeTab, limit: 200 });
      const list = Array.isArray(resp?.items) ? resp.items : [];
      setRows(list);
    } catch (e) {
      console.error(e);
      setError("Failed to load role requests.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== "all" && r.requestedRole !== roleFilter) return false;
      if (!s) return true;
      const hay = `${r.fullName || ""} ${r.email || ""} ${r.licenseNumber || ""} ${r.organization || ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [rows, search, roleFilter]);

  const pendingCount = useMemo(() => (activeTab === "pending" ? rows.length : null), [activeTab, rows.length]);

  const onApprove = async (req) => {
    if (!authUser) return;
    setError("");
    try {
      await api.approveRoleRequest(req.id, confirm.reason || "");

      setSelectedRequest(null);
      setConfirm({ open: false, type: null, reason: "" });
      await reload();
    } catch (e) {
      console.error(e);
      setError("Approve failed. Please check server logs / admin permissions.");
    }
  };

  const onReject = async (req) => {
    if (!authUser) return;
    setError("");
    try {
      await api.rejectRoleRequest(req.id, confirm.reason || "");
      setSelectedRequest(null);
      setConfirm({ open: false, type: null, reason: "" });
      await reload();
    } catch (e) {
      console.error(e);
      setError("Reject failed. Please check server logs / admin permissions.");
    }
  };

  const openRequest = (req) => {
    setSelectedRequest(req);
    // Mark as seen when opened (so notifications clear)
    if (req?.id && req?.seen === false) {
      api.markRoleRequestSeen(req.id, true).catch(() => {});
      setRows((prev) => prev.map((r) => (r.id === req.id ? { ...r, seen: true } : r)));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Requests</h1>
          <p className="text-gray-600 mt-1">Review and approve role change requests</p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent" type="button" disabled>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "pending" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Pending
          {activeTab === "pending" && (
            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
              {pendingCount ?? 0}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "approved" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Approved
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "rejected" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Rejected
        </button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, name, or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctor</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="user">User</option>
          </select>
          <Button variant="outline" className="gap-2 bg-transparent" type="button" disabled>
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </Card>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-sm text-gray-600">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-sm text-gray-600">
                    No requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {(request.fullName || request.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center gap-2">
                            {request.status === "pending" && request.seen === false && (
                              <span className="w-2 h-2 rounded-full bg-blue-600" title="Unseen" />
                            )}
                            <p className="text-sm font-medium text-gray-900">{request.fullName || "(No name)"}</p>
                          </div>
                          <p className="text-xs text-gray-500">{request.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.email || ""}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rolePill(request.requestedRole)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.organization || ""}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmtTime(request.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.status === "pending" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-orange-600">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : request.status === "approved" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-transparent"
                        type="button"
                        onClick={() => openRequest(request)}
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

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedRequest(null)}>
          <div className="w-full max-w-2xl bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedRequest.fullName || "(No name)"}</h2>
                  {selectedRequest.status === "pending" && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                      <Clock className="w-3 h-3" />
                      Pending Review
                    </span>
                  )}
                  {selectedRequest.status === "approved" && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Approved
                    </span>
                  )}
                  {selectedRequest.status === "rejected" && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              {selectedRequest.status === "pending" && (
                <div className="flex gap-3 mt-4">
                  <Button
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    type="button"
                    onClick={() => setConfirm({ open: true, type: "approve", reason: "" })}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 text-red-600 hover:bg-red-50 bg-transparent"
                    type="button"
                    onClick={() => setConfirm({ open: true, type: "reject", reason: "" })}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Applicant Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Full Name:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.fullName || ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.email || ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.phone || ""}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Professional Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Requested Role:</span>
                    {rolePill(selectedRequest.requestedRole)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Organization:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.organization || ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">License No:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRequest.licenseNumber || ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Submitted:</span>
                    <span className="text-sm font-medium text-gray-900">{fmtTime(selectedRequest.createdAt)}</span>
                  </div>
                </div>
              </div>

              {selectedRequest.documents?.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Documents</h3>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((d, idx) => (
                      <a
                        key={idx}
                        href={d.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{d.name || "Document"}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedRequest.status === "rejected" && selectedRequest.rejectReason ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                  <strong>Reject reason:</strong> {selectedRequest.rejectReason}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {confirm.open && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirm({ open: false, type: null, reason: "" })}>
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900">
                {confirm.type === "approve" ? "Approve request" : "Reject request"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {confirm.type === "approve"
                  ? "This will grant panel access by upgrading the user's role."
                  : "Please provide a reason (optional) and confirm rejection."}
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Notes / Reason</label>
                <textarea
                  value={confirm.reason}
                  onChange={(e) => setConfirm((c) => ({ ...c, reason: e.target.value }))}
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder={confirm.type === "approve" ? "Optional internal notes..." : "Why is this request rejected?"}
                />
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => setConfirm({ open: false, type: null, reason: "" })}
                >
                  Cancel
                </button>
                {confirm.type === "approve" ? (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                    onClick={() => onApprove(selectedRequest)}
                  >
                    Approve
                  </button>
                ) : (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                    onClick={() => onReject(selectedRequest)}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
