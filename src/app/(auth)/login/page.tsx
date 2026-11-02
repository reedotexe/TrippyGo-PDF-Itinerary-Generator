"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password flow state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        if (res.error.status === 429) {
          setErrorMessage("Too many login attempts. For security, please wait 15 minutes before trying again.");
        } else if (res.error.message?.toLowerCase().includes("banned")) {
          setErrorMessage("This account has been deactivated. Please contact an agency administrator.");
        } else {
          // Uniform generic message to prevent email enumeration
          setErrorMessage("Invalid email or password. Please verify your credentials or contact an administrator.");
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setIsForgotLoading(true);
    setForgotError(null);

    try {
      const res = await authClient.requestPasswordReset({
        email: forgotEmail.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (res.error) {
        if (res.error.status === 429) {
          setForgotError("Too many password reset requests. Please wait a few minutes.");
        } else {
          // Uniform response regardless of whether email exists
          setForgotSuccess(true);
        }
      } else {
        setForgotSuccess(true);
      }
    } catch {
      setForgotError("Unable to process reset request. Please check your network or try again.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 p-8 sm:p-10 transition-all">
      {!showForgot ? (
        <div>
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#091c3e] mb-2">
              Agency Sign In
            </h1>
            <p className="text-sm text-slate-500 font-sans leading-relaxed">
              Enter your agency credentials to access the TrippyGo proposal workbench.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50/90 border border-red-200 text-red-900 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Agency Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="advisor@trippygo.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-[#091c3e] rounded-xl text-slate-900 placeholder:text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/15"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotEmail(email);
                    setForgotSuccess(false);
                    setForgotError(null);
                  }}
                  className="text-xs text-[#091c3e] hover:text-[#c92229] font-medium transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-[#091c3e] rounded-xl text-slate-900 placeholder:text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#091c3e] hover:bg-[#1556a6] disabled:opacity-50 text-white text-sm font-semibold tracking-wide transition shadow-sm hover:shadow flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setShowForgot(false)}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#091c3e] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </button>

          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#091c3e] mb-2">
              Reset Password
            </h2>
            <p className="text-sm text-slate-500 font-sans leading-relaxed">
              Enter your agency email to receive a single-use password reset link.
            </p>
          </div>

          {forgotSuccess ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 font-bold text-emerald-800 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reset Link Dispatched</span>
              </div>
              <p className="leading-relaxed text-emerald-900">
                If an account with that email exists, a password reset link has been sent. Please check your inbox (or server console in development).
              </p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Agency Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="advisor@trippygo.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 focus:bg-white border border-slate-200 focus:border-[#091c3e] rounded-xl text-slate-900 placeholder:text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isForgotLoading || !forgotEmail}
                className="w-full py-2.5 px-4 rounded-xl bg-[#c92229] hover:bg-[#b01d23] disabled:opacity-50 text-white text-sm font-semibold tracking-wide transition shadow-sm flex items-center justify-center gap-2"
              >
                {isForgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
