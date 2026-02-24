/**
 * Frontend page: Settings
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useEffect, useMemo, useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

import DoctorSidebar from "@/components/doctor/doctor-sidebar";
import DoctorNavbar from "@/components/doctor/DoctorNavbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/firebase/firebase";

function initials(name) {
  const safe = (name || "Doctor").trim();
  const parts = safe.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "D";
  const b = (parts[1]?.[0] || parts[0]?.[1] || "").toUpperCase();
  return (a + b).toUpperCase();
}

export default function DoctorSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, authUser, updateUserProfile } = useAuth();

  // Profile form
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    setName(profile?.name || authUser?.displayName || "");
    setSpecialty(profile?.specialty || "");
    setPhone(profile?.phone || "");
    setBio(profile?.bio || "");
  }, [profile, authUser]);

  const avatar = useMemo(() => initials(profile?.name || authUser?.displayName || "Doctor"), [profile, authUser]);

  const saveProfile = async () => {
    try {
      setProfileSaving(true);
      setProfileMsg({ type: "", text: "" });
      await updateUserProfile({
        name: name.trim(),
        specialty: specialty.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      });
      setProfileMsg({ type: "success", text: "Profile updated." });
    } catch (e) {
      setProfileMsg({ type: "error", text: e?.message || "Failed to update profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      setPwSaving(true);
      setPwMsg({ type: "", text: "" });

      if (!currentPassword || !newPassword) {
        throw new Error("Please fill in all fields.");
      }
      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirmation do not match.");
      }

      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Not authenticated.");

      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ type: "success", text: "Password changed successfully." });
    } catch (e) {
      setPwMsg({ type: "error", text: e?.message || "Failed to change password" });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <DoctorNavbar onMenuClick={() => setSidebarOpen(true)} title="Settings" showSearch={false} />

        <main className="p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your profile and account security.</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {avatar}
              </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>

                  {profileMsg.text ? (
                    <div
                      className={`mb-4 rounded-lg border p-3 text-sm ${
                        profileMsg.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {profileMsg.text}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Name" />
                    </div>

                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Orthopedics" />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880..." />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={profile?.email || authUser?.email || ""} disabled />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Bio</Label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short professional bio" className="min-h-[110px]" />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={saveProfile} disabled={profileSaving}>
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    For your security, confirm your current password before setting a new one.
                  </p>

                  {pwMsg.text ? (
                    <div
                      className={`mb-4 rounded-lg border p-3 text-sm ${
                        pwMsg.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {pwMsg.text}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Current password</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>New password</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Confirm new password</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={changePassword} disabled={pwSaving}>
                      {pwSaving ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
