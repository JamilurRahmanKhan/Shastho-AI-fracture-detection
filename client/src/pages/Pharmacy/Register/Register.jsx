/**
 * Frontend page: Register
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function PharmacyRegister() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    pharmacyName: "",
    licenseNumber: "",
    address: "",
    phone: "",
    adminName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const canStep1 = useMemo(
    () => form.pharmacyName && form.licenseNumber && form.address && form.phone,
    [form.pharmacyName, form.licenseNumber, form.address, form.phone]
  );
  const canStep2 = useMemo(
    () => form.adminName && form.adminEmail && form.password && form.confirmPassword,
    [form.adminName, form.adminEmail, form.password, form.confirmPassword]
  );

  const handleCreate = async () => {
    setError("");

    if (!form.terms) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        email: form.adminEmail,
        password: form.password,
        role: "pharmacy",
        name: form.adminName,
        extra: {
          pharmacyName: form.pharmacyName,
          licenseNumber: form.licenseNumber,
          address: form.address,
          phone: form.phone,
          panel: "pharmacy",
        },
      });
      navigate("/pharmacy/dashboard", { replace: true });
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pharmacy Registration</h1>
          <p className="text-gray-600">Register your pharmacy - Step {step} of 2</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  s <= step ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className={`flex-1 h-1 mx-2 ${s < step ? "bg-teal-600" : "bg-gray-200"}`}></div>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pharmacyName">Pharmacy Name</Label>
              <Input
                id="pharmacyName"
                placeholder="MediCare Pharmacy"
                value={form.pharmacyName}
                onChange={(e) => setForm((p) => ({ ...p, pharmacyName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="licenseNumber">Pharmacy License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="PH-123456789"
                value={form.licenseNumber}
                onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Medical Street, City, State"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+8801XXXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              onClick={() => (canStep1 ? setStep(2) : setError("Please fill in all fields."))}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminName">Admin Name</Label>
              <Input
                id="adminName"
                placeholder="John Smith"
                value={form.adminName}
                onChange={(e) => setForm((p) => ({ ...p, adminName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@medicare.com"
                value={form.adminEmail}
                onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1"
                checked={form.terms}
                onChange={(e) => setForm((p) => ({ ...p, terms: e.target.checked }))}
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the <Link to="/terms" className="underline">Terms of Service</Link> and{" "}
                <Link to="/privacy" className="underline">Privacy Policy</Link>
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={handleCreate}
                disabled={loading || !canStep2}
              >
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/pharmacy/login" className="text-teal-600 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
