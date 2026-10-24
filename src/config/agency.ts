export const agencyDefaults = {
  brand: {
    name: "TrippyGo",
    tagline: "By Friends Travel",
    logoPath: "/brand/trippygo-logo.png",
    colors: {
      primaryRed: "#c92229",
      primaryBlue: "#1556a6",
      navy: "#091c3e",
      gold: "#f59e0b",
      textDark: "#0f172a",
      textBody: "#334155",
      textMuted: "#64748b",
      bgLight: "#f8fafc",
      bgWhite: "#ffffff",
    },
    fonts: {
      display: "'Plus Jakarta Sans', sans-serif",
      body: "'Inter', sans-serif",
      script: "'Caveat', cursive",
    },
  },
  tax: {
    gstScheme: "5% inclusive (no ITC)",
    gstRate: 0.05,
    gstMode: "inclusive" as const,
    sacCode: "998552",
    gstin: "27AABCT1234D1Z5",
    supplierNetIncludesGst: true,
  },
  pricing: {
    defaultBasis: "per_person_twin_sharing" as const,
    childWithBedFactor: 0.7,
    childNoBedFactor: 0.4,
    infantFactor: 0.0,
    defaultMarkupPercent: 15,
    minMarginPercent: 8,
    overrideRules: {
      salespersonCanOverride: true,
      salespersonMarginRange: [8, 30] as [number, number],
      adminOverrideRequiredBelow: 8,
    },
    quoteValidityDays: 7,
  },
  pdf: {
    deliveryChannels: ["download", "whatsapp_link"],
    language: "en",
    showSalespersonContact: true,
    companyDetails: {
      phone: "+91-9871597736",
      email: "info@trippygo.in",
      website: "https://trippygo.in",
      address: "Office 402, Trade Hub, Mumbai, Maharashtra 400001",
    },
    paymentDetails: {
      upiId: "7982578247@okbizaxis",
      bankName: "HDFC Bank",
      accountHolder: "TrippyGo Holidays LLP",
      accountNumber: "50200069970250",
      ifscCode: "HDFC0000280",
    },
    socialProof: {
      googleRating: "4.7/5",
      googleReviewsCount: "2000+ reviews",
      instagramFollowers: "250k+",
      awardTitle: "The Best International Holiday Brand in India",
      trustedTravellers: "100k+ travellers",
    },
  },
  auth: {
    system: "shared_jwt_session",
    sessionSchema: {
      id: "uuid",
      name: "string",
      email: "string",
      phone: "string",
      role: "admin | sales",
    },
  },
  infrastructure: {
    claudeModel: "claude-3-7-sonnet-20250219",
    s3Bucket: "trippygo-itineraries-dev",
    s3Region: "ap-south-1",
    databaseUrl: "postgresql://postgres:postgres@localhost:5432/trippygo_dev",
  },
};

export default agencyDefaults;
