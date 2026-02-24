/**
 * Frontend page: ResetPassword
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function PharmacyResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">{emailSent ? "Check your email" : "Enter your email to reset your password"}</p>
        </div>

        {!emailSent ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@pharmacy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              onClick={handleSend}
              disabled={loading || !email}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-teal-50 rounded-lg">
              <p className="text-teal-900">
                We&apos;ve sent a password reset link to your email. Please check your inbox and follow the
                instructions.
              </p>
            </div>
            <Button onClick={() => setEmailSent(false)} variant="outline" className="w-full">
              Resend Email
            </Button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link to="/pharmacy/login" className="text-teal-700 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
