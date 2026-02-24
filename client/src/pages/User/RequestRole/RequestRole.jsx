/**
 * Frontend page: RequestRole
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

function fmtTime(ts) {
  if (!ts) return "";
  const d = ts?.toDate?.() || (ts instanceof Date ? ts : new Date(ts));
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function RequestRolePage() {
  const { authUser, profile } = useAuth();
  const [selectedRole, setSelectedRole] = useState("doctor");
  const [status, setStatus] = useState("loading"); // loading | none | pending | approved | rejected
  const [latest, setLatest] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    licenseNumber: "",
    organization: "",
    documents: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!authUser) return;
      try {
        const resp = await api.listMyRoleRequests();
        const list = Array.isArray(resp?.items) ? resp.items : [];
        const req = list[0] || null;
        if (!mounted) return;
        setLatest(req);
        if (!req) {
          setStatus("none");
          return;
        }
        setSelectedRole(req.requestedRole || "doctor");
        setStatus(req.status || "pending");
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setStatus("none");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authUser]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!form.phone || !form.licenseNumber || !form.organization) return false;
    if (selectedRole === "doctor" && !form.fullName) return false;
    return true;
  }, [form, selectedRole, submitting]);

  const onPickDocs = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    const docs = files.map((f) => ({ name: f.name, size: f.size, type: f.type }));
    setForm((s) => ({ ...s, documents: docs }));
  };

  const submit = async () => {
    if (!authUser) return;
    setError("");
    setSubmitting(true);
    try {
      const resp = await api.createRoleRequest({
        requestedRole: selectedRole,
        fullName: form.fullName || profile?.name || profile?.displayName || "",
        phone: form.phone,
        organization: form.organization,
        licenseNumber: form.licenseNumber,
        documents: form.documents,
        source: 'request_role',
      });
      const req = resp?.roleRequest || null;
      setLatest(req);
      setStatus("pending");
    } catch (e) {
      console.error(e);
      setError("Failed to submit role request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Request Professional Access</h1>
          <p className="text-gray-600 mt-2">Apply for Doctor or Pharmacy panel access</p>
        </div>

        {status !== "none" && status !== "loading" && (
          <Card className="p-6 mb-6">
            {status === "pending" && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Request Under Review</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your request has been submitted and is waiting for an admin review.
                  </p>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>Requested Role:</strong> {selectedRole === "doctor" ? "Doctor" : "Pharmacy"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Submitted:</strong> {fmtTime(latest?.createdAt) || "(processing...)"}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
                      Back to dashboard
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {status === "approved" && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Request Approved!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your account role has been upgraded. Please sign out and sign in again using the {selectedRole === "doctor" ? "Doctor" : "Pharmacy"} panel.
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Link to={`/${selectedRole}/login`}>
                      <Button>Go to {selectedRole === "doctor" ? "Doctor" : "Pharmacy"} Panel</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {status === "rejected" && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Request Rejected</h3>
                  <p className="text-sm text-gray-600 mt-1">Unfortunately, your request was not approved.</p>
                  {latest?.rejectReason ? (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-900">
                        <strong>Reason:</strong> {latest.rejectReason}
                      </p>
                    </div>
                  ) : null}
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => {
                      setLatest(null);
                      setStatus("none");
                    }}
                  >
                    Submit New Request
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {status === "loading" ? (
          <Card className="p-6">
            <p className="text-sm text-gray-600">Loading...</p>
          </Card>
        ) : status === "none" ? (
          <Card className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Select Role Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole("doctor")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedRole === "doctor" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                        selectedRole === "doctor" ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <FileText className={`w-6 h-6 ${selectedRole === "doctor" ? "text-white" : "text-gray-600"}`} />
                    </div>
                    <p className="font-semibold text-gray-900">Doctor</p>
                    <p className="text-xs text-gray-500 mt-1">Medical professional</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("pharmacy")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedRole === "pharmacy" ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                        selectedRole === "pharmacy" ? "bg-teal-600" : "bg-gray-200"
                      }`}
                    >
                      <FileText className={`w-6 h-6 ${selectedRole === "pharmacy" ? "text-white" : "text-gray-600"}`} />
                    </div>
                    <p className="font-semibold text-gray-900">Pharmacy</p>
                    <p className="text-xs text-gray-500 mt-1">Pharmacy store</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {selectedRole === "doctor" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                    placeholder="Dr. John Smith"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+880 1XXXXXXXXX"
                  className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    selectedRole === "doctor" ? "focus:ring-blue-500" : "focus:ring-teal-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedRole === "doctor" ? "Medical License Number" : "Trade License Number"} *
                </label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => setForm((s) => ({ ...s, licenseNumber: e.target.value }))}
                  placeholder={selectedRole === "doctor" ? "MD-2024-5678" : "PH-2024-1234"}
                  className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    selectedRole === "doctor" ? "focus:ring-blue-500" : "focus:ring-teal-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedRole === "doctor" ? "Hospital Name" : "Pharmacy Name"} *
                </label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={(e) => setForm((s) => ({ ...s, organization: e.target.value }))}
                  placeholder={selectedRole === "doctor" ? "City General Hospital" : "MediPlus Pharmacy"}
                  className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    selectedRole === "doctor" ? "focus:ring-blue-500" : "focus:ring-teal-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents (optional)</label>
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer block">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to select files</p>
                  <p className="text-xs text-gray-500 mt-1">PDF/JPG/PNG (stored as filenames in demo)</p>
                  <input type="file" multiple className="hidden" onChange={onPickDocs} />
                </label>
                {form.documents?.length ? (
                  <div className="mt-3 text-xs text-gray-600">
                    Selected: {form.documents.map((d) => d.name).join(", ")}
                  </div>
                ) : null}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

            <div className="mt-6 flex items-center justify-between">
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to dashboard
              </Link>
              <Button onClick={submit} disabled={!canSubmit}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </Card>
        ) : null}

        <p className="text-xs text-gray-500 mt-6 text-center">
          After approval, your role will be upgraded and you should use the correct panel login page.
        </p>
      </div>
    </div>
  );
}
