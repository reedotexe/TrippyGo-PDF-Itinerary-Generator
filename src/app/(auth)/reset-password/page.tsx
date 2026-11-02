"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { Lock, AlertCircle, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password requirements
  const isMinLength = password.length >= 12;
  const isMatching = password !== "" && password === confirmPassword;
  const isFormValid = isMinLength && isMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage("No verification token found in the URL. Please use the link provided in your email.");
      return;
    }

    if (!isFormValid) {
      setErrorMessage("Please ensure your password meets all complexity requirements.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (res.error) {
        if (res.error.message?.toLowerCase().includes("invalid") || res.error.message?.toLowerCase().includes("expired")) {
          setErrorMessage("This password reset link is invalid or has expired. Please request a new one.");
        } else {
          setErrorMessage(res.error.message || "Failed to reset password. Please try again.");
        }
      } else {
        setIsSuccess(true);
      }
    } catch {
      setErrorMessage("An unexpected error occurred while resetting your password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 p-8 sm:p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#091c3e] mb-2">Invalid Reset Link</h2>
        <p className="text-sm text-slate-500 mb-6">
          This password reset link is missing a valid token or has expired. Please request a new link from the sign in page.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#091c3e] text-white text-sm font-semibold hover:bg-[#1556a6] transition"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 p-8 sm:p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#091c3e] mb-2">Password Reset Successful</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Your password has been securely updated. Any existing sessions have been terminated. You can now sign in with your new credentials.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-3 px-4 rounded-xl bg-[#091c3e] hover:bg-[#1556a6] text-white text-sm font-semibold transition flex items-center justify-center gap-2"
        >
          <span>Proceed to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 p-8 sm:p-10">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security Verification</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#091c3e] mb-2">
          Set New Password
        </h1>
        <p className="text-sm text-slate-500 font-sans leading-relaxed">
          Create a secure password for your TrippyGo Operations account.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="font-medium leading-relaxed">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 12 characters"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-[#091c3e] rounded-xl text-slate-900 placeholder:text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/15"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-[#091c3e] rounded-xl text-slate-900 placeholder:text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/15"
            />
          </div>
        </div>

        {/* Policy Checklist */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className={`flex items-center gap-2 ${isMinLength ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
            <CheckCircle2 className={`w-3.5 h-3.5 ${isMinLength ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Minimum 12 characters ({password.length}/12)</span>
          </div>
          <div className={`flex items-center gap-2 ${isMatching ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
            <CheckCircle2 className={`w-3.5 h-3.5 ${isMatching ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Passwords match</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full py-3 px-4 rounded-xl bg-[#091c3e] hover:bg-[#1556a6] disabled:opacity-50 text-white text-sm font-semibold tracking-wide transition shadow-sm flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Password...</span>
            </>
          ) : (
            <span>Save & Set Password</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 p-12 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#091c3e]" />
        <span className="text-sm font-medium">Verifying reset token...</span>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
