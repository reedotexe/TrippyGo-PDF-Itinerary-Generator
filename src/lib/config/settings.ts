import fs from "fs";
import path from "path";
import { agencyDefaults } from "@/config/agency";

export interface AgencySettings {
  brandName: string;
  defaultMarkupType: "percent" | "flat";
  defaultMarkupValue: number;
  minMarginPercent: number;
  gstMode: "inclusive" | "extra" | "hidden";
  gstRate: number;
  sacCode: string;
  gstin: string;
  quoteValidityDays: number;
  roundingRule: "nearest_rupee" | "nearest_50" | "nearest_100";
  tcsEnabled: boolean;
  salespersonCanOverride: boolean;
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), ".data", "agency-settings.json");

export function getAgencySettings(): AgencySettings {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[Settings] Could not read custom settings, using agency defaults:", err);
  }

  // Fallback defaults
  return {
    brandName: agencyDefaults.brand.name,
    defaultMarkupType: "percent",
    defaultMarkupValue: agencyDefaults.pricing.defaultMarkupPercent,
    minMarginPercent: agencyDefaults.pricing.minMarginPercent,
    gstMode: agencyDefaults.tax.gstMode,
    gstRate: agencyDefaults.tax.gstRate,
    sacCode: agencyDefaults.tax.sacCode,
    gstin: agencyDefaults.tax.gstin,
    quoteValidityDays: agencyDefaults.pricing.quoteValidityDays,
    roundingRule: "nearest_rupee",
    tcsEnabled: false,
    salespersonCanOverride: agencyDefaults.pricing.overrideRules.salespersonCanOverride,
  };
}

export function saveAgencySettings(newSettings: Partial<AgencySettings>): AgencySettings {
  const current = getAgencySettings();
  const updated: AgencySettings = {
    ...current,
    ...newSettings,
  };

  const dir = path.dirname(SETTINGS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}
