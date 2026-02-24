/**
 * Frontend page: Dashboard
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import React, { useEffect, useMemo, useState } from "react";

// NOTE: The global <Navbar /> already renders <DashboardHeader /> on dashboard routes.
// Keeping another header here caused a duplicate navbar.
import WelcomeSection from "../WelcomeSection/WelcomeSection";
import StatsCards from "../StatsCards/StatsCards";
import DashboardTabs from "../DashboardTabs/DashboardTabs";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

import { useAuth } from "../../../contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { api } from "@/services/api";

function toJsDate(ts) {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "string" || typeof ts === "number") {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts.toDate === "function") {
    try {
      const d = ts.toDate();
      return d instanceof Date ? d : null;
    } catch {
      return null;
    }
  }
  return null;
}

const Dashboard = () => {
  const { profile, loading } = useAuth();
  const { snapshot } = useSubscription();

  const [remoteLoading, setRemoteLoading] = useState(true);
  const [remoteError, setRemoteError] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  // Local tab state for the dashboard section switcher
  const [activeTab, setActiveTab] = useState("overview");

  const mapAppointmentsForUI = (appts) => {
    if (!Array.isArray(appts)) return [];
    const now = new Date(Date.now() - 60_000);
    return appts
      .map((a) => {
        const d = a.datetime ? new Date(a.datetime) : null;
        return {
          id: a._id || a.id,
          doctorUid: a.doctorUid || '',
          doctorName: a.doctorName || 'Doctor',
          doctorEmail: a.doctorEmail || '',
          specialty: a.department || 'General',
          date: d ? d.toLocaleDateString() : '',
          time: d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          datetime: a.datetime || null,
          type: a.type || 'in-person',
          status: a.status || 'pending',
          messagingEnabled: Boolean(a.messagingEnabled),
          decisionAt: a.decisionAt || null,
          decisionReason: a.decisionReason || '',
          location: a.location || '',
          notes: a.notes || '',
        };
      })
      // Only keep appointments that have not passed yet
      .filter((x) => {
        if (!x.datetime) return true;
        const t = new Date(x.datetime);
        if (Number.isNaN(t.getTime())) return true;
        return t >= now;
      })
      .sort((x, y) => {
        const dx = x.datetime ? new Date(x.datetime).getTime() : 0;
        const dy = y.datetime ? new Date(y.datetime).getTime() : 0;
        // upcoming first
        return dx - dy;
      });
  };

  const refreshAppointments = async () => {
    const appts = await api.listAppointments().catch(() => []);
    setAppointments(mapAppointmentsForUI(appts));
  };

  const mapMedicationsForUI = (meds) => {
    if (!Array.isArray(meds)) return [];
    return meds.map((m) => ({
      id: m._id || m.id,
      name: m.name || "Medication",
      dosage: m.dosage || "",
      // Keep backward compatibility: 'schedule' preferred, fallback to 'frequency'
      schedule: m.schedule || m.frequency || "",
      scheduleType: m.scheduleType || (Array.isArray(m.times) && m.times.length ? "fixed_times" : "interval"),
      timesPerDay: Number(m.timesPerDay ?? 1),
      intervalMinutes: m.intervalMinutes ?? null,
      timezone: m.timezone || null,
      timezoneOffsetMinutes: m.timezoneOffsetMinutes ?? null,
      nextDueAt: m.nextDueAt || (m.computed ? m.computed.nextDueAt : null) || null,
      computed: m.computed || null,
      times: Array.isArray(m.times) ? m.times : [],
      startDate: m.startDate || null,
      endDate: m.endDate || null,
      prescribedBy: m.prescribedBy || "",
      status: m.status || "active",
      instructions: m.instructions || "",
      notes: m.notes || "",
      sideEffects: Array.isArray(m.sideEffects) ? m.sideEffects : [],
      adherence: Array.isArray(m.adherence) ? m.adherence : [],
      createdAt: m.createdAt || null,
      updatedAt: m.updatedAt || null,
    }));
  };

  const refreshMedications = async () => {
    const meds = await api.listMedications().catch(() => []);
    setMedications(mapMedicationsForUI(meds));
  };

  const refreshMedicalRecords = async () => {
    const records = await api.listMedicalRecords().catch(() => []);
    const mappedRecords = Array.isArray(records)
      ? records.map((r) => ({
          id: r._id || r.id,
          title: r.title || r.filename || 'Medical Record',
          recordType: r.recordType || '',
          recordDate: r.recordDate ? new Date(r.recordDate) : null,
          uploadedAt: r.uploadedAt ? new Date(r.uploadedAt) : (r.createdAt ? new Date(r.createdAt) : null),
          filename: r.filename || '',
          mimeType: r.mimeType || '',
          size: r.size || 0,
          description: r.description || '',
          tags: Array.isArray(r.tags) ? r.tags : [],
        }))
      : [];
    setMedicalRecords(mappedRecords);
  };

  // Fetch user panel data from backend
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!profile?.uid) {
        setRemoteLoading(false);
        return;
      }

      try {
        setRemoteLoading(true);
        setRemoteError("");

        const [appts, meds, xrays, records] = await Promise.all([
          api.listAppointments().catch(() => []),
          api.listMedications().catch(() => []),
          api.listXrays().catch(() => []),
          api.listMedicalRecords().catch(() => []),
        ]);

        if (!mounted) return;

        const mappedAppts = mapAppointmentsForUI(appts);

        const mappedMeds = mapMedicationsForUI(meds);

        const mappedXrays = Array.isArray(xrays)
          ? xrays.map((x) => ({
              id: x._id || x.id,
              fileUrl: x.fileUrl || x.imageUrl || '',
              originalName: x.originalName || x.filename || 'X-ray',
              createdAt: x.createdAt ? new Date(x.createdAt) : null,
              analysis: x.analysis || null,
              status: x.status || 'completed',
            }))
          : [];

        const mappedRecords = Array.isArray(records)
          ? records.map((r) => ({
              id: r._id || r.id,
              title: r.title || r.filename || 'Medical Record',
              recordType: r.recordType || '',
              recordDate: r.recordDate ? new Date(r.recordDate) : null,
              uploadedAt: r.uploadedAt ? new Date(r.uploadedAt) : (r.createdAt ? new Date(r.createdAt) : null),
              filename: r.filename || '',
              mimeType: r.mimeType || '',
              size: r.size || 0,
              description: r.description || '',
              tags: Array.isArray(r.tags) ? r.tags : [],
            }))
          : [];

        setAppointments(mappedAppts);
        setMedications(mappedMeds);
        setAnalysisHistory(mappedXrays);
        setMedicalRecords(mappedRecords);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setRemoteError(e?.message || "Failed to load dashboard data");
      } finally {
        if (mounted) setRemoteLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [profile?.uid]);

  const createdAt = toJsDate(profile?.createdAt);

  const uiUser = useMemo(() => {
    const name = profile?.name || profile?.displayName || "User";
    return {
      name,
      email: profile?.email || "",
      joinDate: createdAt || new Date(),
      isPremium: Boolean(profile?.isPremium),
      queryCount: Number(profile?.queryCount || 0),
    };
  }, [profile, createdAt]);

  const healthMetrics = useMemo(() => {
    return {
      score: Number(profile?.healthScore || 94),
      lastUpdated: createdAt || new Date(),
    };
  }, [profile, createdAt]);

  // Compute stats for cards
  // Prefer the new subscription entitlement snapshot (general chat quota),
  // and fall back to the legacy profile-based query limit if snapshot isn't available.
  const entitlementQueryLimit = Number(snapshot?.entitlements?.generalChat);
  const entitlementQueriesUsed = Number(snapshot?.usage?.generalChatUsed);

  const hasEntitlementQuota =
    Number.isFinite(entitlementQueryLimit) &&
    entitlementQueryLimit > 0 &&
    Number.isFinite(entitlementQueriesUsed) &&
    entitlementQueriesUsed >= 0;

  const queryLimit = hasEntitlementQuota ? entitlementQueryLimit : uiUser.isPremium ? 20 : 5;

  const queriesUsed = hasEntitlementQuota
    ? Math.min(entitlementQueriesUsed, queryLimit)
    : Number.isFinite(uiUser.queryCount) && uiUser.queryCount >= 0
      ? Math.min(uiUser.queryCount, queryLimit)
      : Math.min(analysisHistory.length, queryLimit);

  const queryUsagePercentage =
    queryLimit > 0 ? Math.min(100, Math.round((queriesUsed / queryLimit) * 100)) : 0;

  const remainingQueries = hasEntitlementQuota
    ? Math.max(0, queryLimit - queriesUsed)
    : Math.max(0, queryLimit - queriesUsed);
// IMPORTANT:
  // StatsCards renders these values directly inside JSX. If we pass arrays of
  // appointment/medication objects, React will crash with:
  // "Objects are not valid as a React child ..." after the first booking.
  // Keep these as numbers.
  const upcomingAppointmentsCount = useMemo(() => {
    return appointments.filter((a) => {
      const s = String(a?.status || '').toLowerCase();
      return s === 'scheduled' || s === 'pending';
    }).length;
  }, [appointments]);

  const activeMedicationsCount = useMemo(() => {
    return medications.filter((m) => (m?.status || "active") === "active").length;
  }, [medications]);

  if (loading || remoteLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {remoteError ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <div className="font-semibold">Backend not reachable</div>
            <div className="text-sm">{remoteError}</div>
            <div className="text-sm mt-1">
              The UI will still work with placeholder data. Fix your server connection to enable real data.
            </div>
          </div>
        ) : null}

        <WelcomeSection user={uiUser} healthMetrics={healthMetrics} />

        <StatsCards
          user={{ ...uiUser, queryCount: queriesUsed }}
          queryUsagePercentage={queryUsagePercentage}
          remainingQueries={remainingQueries}
          upcomingAppointments={upcomingAppointmentsCount}
          activeMedications={activeMedicationsCount}
        />

        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={uiUser}
          healthMetrics={healthMetrics}
          appointments={appointments}
          onAppointmentsChanged={refreshAppointments}
          medications={medications}
          onMedicationsChanged={refreshMedications}
          analysisHistory={analysisHistory}
          medicalRecords={medicalRecords}
          onMedicalRecordsChanged={refreshMedicalRecords}
        />
      </main>
    </div>
  );
};

export default Dashboard;
