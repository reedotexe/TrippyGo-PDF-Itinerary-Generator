"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AgencySettings } from "@/lib/config/settings";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Percent,
  Receipt,
  FileText,
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
      .catch((err) => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading agency parameters...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-red-500/30 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Failed to load configuration</h2>
          <p className="text-xs text-slate-400 mt-1">{error || "Unknown error occurred"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6 text-red-500" /> Agency Commercials & Compliance Settings
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage global markup floors, tax modes, GSTIN, rounding rules, and TCS compliance.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg shadow transition text-xs"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
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

        {savedSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Settings saved successfully. All future PDF generations and live calculations will use these parameters.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Commercials & Markup Parameters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Percent className="w-4 h-4 text-blue-400" /> Default Markup & Margin Governance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Default Markup Type
                </label>
                <select
                  value={settings.defaultMarkupType}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultMarkupType: e.target.value as "percent" | "flat",
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Rupee Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Default Markup Value {settings.defaultMarkupType === "percent" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.defaultMarkupValue}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultMarkupValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Minimum Margin Floor (%)
                </label>
                <input
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
                  className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg bg-slate-800 border border-slate-700 text-amber-300"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Triggers low-margin warning if salesperson markup falls below this threshold.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Selling Price Rounding Rule
                </label>
                <select
                  value={settings.roundingRule}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      roundingRule: e.target.value as "nearest_rupee" | "nearest_50" | "nearest_100",
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="nearest_rupee">Round to Nearest Rupee (Default)</option>
                  <option value="nearest_50">Round Up to Nearest ₹50</option>
                  <option value="nearest_100">Round Up to Nearest ₹100</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Applied once at final client price calculation. Eliminates odd paise endings.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Quote Validity Duration (Days)
                </label>
                <input
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
                  className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Tax & Statutory Compliance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Receipt className="w-4 h-4 text-emerald-400" /> GST, SAC & TCS Tax Compliance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  GST Display Mode
                </label>
                <select
                  value={settings.gstMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gstMode: e.target.value as "inclusive" | "extra" | "hidden",
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="inclusive">Inclusive (Standard Tour Package 5%)</option>
                  <option value="extra">Extra (Added as line item)</option>
                  <option value="hidden">Hidden (All-inclusive single figure)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  SAC Code
                </label>
                <input
                  type="text"
                  value={settings.sacCode}
                  onChange={(e) => setSettings({ ...settings, sacCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  998552: Tour Operator Services without ITC.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Agency GSTIN
                </label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            {/* TCS Section 206C Switch */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  TCS Disclosure under Section 206C
                </div>
                <div className="text-[11px] text-slate-400">
                  When enabled, adds statutory disclaimer: <em>&quot;TCS @ applicable rates under Sec 206C to be collected separately&quot;</em>.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tcsEnabled}
                  onChange={(e) => setSettings({ ...settings, tcsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>

          {/* 3. Operational Governance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Shield className="w-4 h-4 text-amber-400" /> Sales Governance & Permissions
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Allow Salesperson Markup Overrides
                </div>
                <div className="text-[11px] text-slate-400">
                  Allows sales reps to customize markup per itinerary. Reps cannot bypass margin warning when below floor.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.salespersonCanOverride}
                  onChange={(e) =>
                    setSettings({ ...settings, salespersonCanOverride: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
