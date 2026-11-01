"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AgencySettings } from "@/lib/config/settings";
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Percent,
  Receipt,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSavedSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      const data = await res.json();
      setSettings(data.settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-700">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="w-5 h-5 border-2 border-[#c92229] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold">Loading agency settings...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#091c3e]">Failed to load configuration</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">{error || "Unknown error occurred"}</p>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#c92229] selection:text-white pb-16">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Return to Dashboard"
              title="Return to Dashboard"
              className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#091c3e]">
                  Agency Settings
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Global Policy
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Markup rules, GSTIN, tax modes, and compliance defaults
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            aria-label="Save settings changes"
            className="min-h-[38px] px-4 py-2 rounded-lg bg-[#c92229] hover:bg-[#b01d23] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#c92229] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Settings updated successfully. All future proposals and live calculations will apply
              these parameters.
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Commercials & Margin Governance */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#091c3e]">
                  Commercials & Margin Governance
                </h2>
                <p className="text-xs text-slate-500">
                  Configure default markup parameters, minimum margin floor, and rounding precision
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label
                  htmlFor="setting-markup-type"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Default Markup Type
                </label>
                <select
                  id="setting-markup-type"
                  value={settings.defaultMarkupType}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultMarkupType: e.target.value as "percent" | "flat",
                    })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#091c3e] text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Rupee Amount (₹)</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Applied automatically to newly imported quotes.
                </span>
              </div>

              <div>
                <label
                  htmlFor="setting-markup-val"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Default Markup Value {settings.defaultMarkupType === "percent" ? "(%)" : "(₹)"}
                </label>
                <input
                  id="setting-markup-val"
                  type="number"
                  min={0}
                  step={settings.defaultMarkupType === "percent" ? "0.5" : "500"}
                  value={settings.defaultMarkupValue}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultMarkupValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#091c3e] text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Standard baseline markup for tours.
                </span>
              </div>

              <div>
                <label
                  htmlFor="setting-min-margin"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Minimum Margin Floor (%)
                </label>
                <input
                  id="setting-min-margin"
                  type="number"
                  min={0}
                  max={50}
                  value={settings.minMarginPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minMarginPercent: parseFloat(e.target.value) || 8,
                    })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#091c3e] text-amber-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Triggers low-margin warning if sales markup falls below this threshold.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
              <div>
                <label
                  htmlFor="setting-rounding-rule"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Selling Price Rounding Rule
                </label>
                <select
                  id="setting-rounding-rule"
                  value={settings.roundingRule}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      roundingRule: e.target.value as "nearest_rupee" | "nearest_50" | "nearest_100",
                    })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#091c3e] text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
                >
                  <option value="nearest_rupee">Round to Nearest Rupee (Default)</option>
                  <option value="nearest_50">Round Up to Nearest ₹50</option>
                  <option value="nearest_100">Round Up to Nearest ₹100</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Applied once at final client price calculation to eliminate odd paise endings.
                </span>
              </div>

              <div>
                <label
                  htmlFor="setting-validity-days"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Quote Validity Duration (Days)
                </label>
                <input
                  id="setting-validity-days"
                  type="number"
                  min={1}
                  max={60}
                  value={settings.quoteValidityDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      quoteValidityDays: parseInt(e.target.value, 10) || 7,
                    })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#091c3e] text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Default validity disclaimer printed in client proposal footer.
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Tax & Statutory Compliance */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#091c3e]">
                  GST, SAC & TCS Tax Compliance
                </h2>
                <p className="text-xs text-slate-500">
                  Statutory credentials printed on client proposals and tax breakdown mode
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label
                  htmlFor="setting-gst-mode"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  GST Display Mode
                </label>
                <select
                  id="setting-gst-mode"
                  value={settings.gstMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gstMode: e.target.value as "inclusive" | "extra" | "hidden",
                    })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#091c3e] text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
                >
                  <option value="inclusive">Inclusive (Standard Tour Package 5%)</option>
                  <option value="extra">Extra (Added as separate line item)</option>
                  <option value="hidden">Hidden (Single lump-sum figure)</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Determines how tax is displayed on the pricing schedule.
                </span>
              </div>

              <div>
                <label
                  htmlFor="setting-sac-code"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  SAC Code
                </label>
                <input
                  id="setting-sac-code"
                  type="text"
                  value={settings.sacCode}
                  onChange={(e) => setSettings({ ...settings, sacCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#091c3e] text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  998552: Tour Operator Services without ITC.
                </span>
              </div>

              <div>
                <label
                  htmlFor="setting-gstin"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Agency GSTIN
                </label>
                <input
                  id="setting-gstin"
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#091c3e] text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Included on formal payment and remittance schedule.
                </span>
              </div>
            </div>

            {/* TCS Section 206C Switch */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-800">
                  TCS Disclosure under Section 206C
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  When enabled, prints statutory disclaimer:{" "}
                  <em>&ldquo;TCS @ applicable rates under Sec 206C to be collected separately&rdquo;</em>.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  id="setting-tcs-switch"
                  type="checkbox"
                  checked={settings.tcsEnabled}
                  aria-label="Toggle TCS Disclosure under Section 206C"
                  onChange={(e) => setSettings({ ...settings, tcsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c92229]"></div>
              </label>
            </div>
          </section>

          {/* Section 3: Operational Governance & Permissions */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#091c3e]">
                  Sales Governance & Permissions
                </h2>
                <p className="text-xs text-slate-500">
                  Controls permissions and limits for sales representatives
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-800">
                  Allow Salesperson Markup Overrides
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Allows sales reps to customize markup per proposal. Safety floor warning will
                  still trigger if below minimum margin.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  id="setting-override-switch"
                  type="checkbox"
                  checked={settings.salespersonCanOverride}
                  aria-label="Toggle salesperson markup overrides"
                  onChange={(e) =>
                    setSettings({ ...settings, salespersonCanOverride: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#091c3e]"></div>
              </label>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
