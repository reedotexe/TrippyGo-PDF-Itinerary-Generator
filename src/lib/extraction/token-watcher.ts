export interface TokenUsageReport {
  provider: "OpenAI" | "Google Gemini" | "Anthropic" | "Heuristic";
  model: string;
  sourceFile?: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  costInr: number;
  durationMs?: number;
}

// Pricing per 1 Million tokens ($)
const PRICING_MAP: Record<string, { promptPerM: number; completionPerM: number }> = {
  // OpenAI
  "gpt-6-luna": { promptPerM: 0.1, completionPerM: 0.5 },
  "gpt-4o-mini": { promptPerM: 0.15, completionPerM: 0.6 },
  "gpt-4o": { promptPerM: 2.5, completionPerM: 10.0 },
  "o3-mini": { promptPerM: 1.1, completionPerM: 4.4 },
  "o1": { promptPerM: 15.0, completionPerM: 60.0 },

  // Google Gemini
  "gemini-2.5-flash": { promptPerM: 0.075, completionPerM: 0.3 },
  "gemini-2.0-flash": { promptPerM: 0.1, completionPerM: 0.4 },
  "gemini-2.5-pro": { promptPerM: 1.25, completionPerM: 5.0 },

  // Anthropic
  "claude-3-7-sonnet": { promptPerM: 3.0, completionPerM: 15.0 },
  "claude-3-5-haiku": { promptPerM: 0.8, completionPerM: 4.0 },
};

const USD_TO_INR_RATE = 86.5;

/**
 * Computes estimated cost in USD and INR for token counts
 */
export function calculateTokenCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): { costUsd: number; costInr: number } {
  const matchKey = Object.keys(PRICING_MAP).find((k) => model.toLowerCase().includes(k));
  const rate = matchKey ? PRICING_MAP[matchKey] : { promptPerM: 0.15, completionPerM: 0.6 };

  const costUsd =
    (promptTokens * rate.promptPerM) / 1_000_000 + (completionTokens * rate.completionPerM) / 1_000_000;
  const costInr = costUsd * USD_TO_INR_RATE;

  return {
    costUsd: Number(costUsd.toFixed(6)),
    costInr: Number(costInr.toFixed(4)),
  };
}

/**
 * Formats and prints an eye-catching token & cost watcher summary box to the dev terminal
 */
export function logTokenWatcher(report: TokenUsageReport): void {
  const boxWidth = 54;
  const padLine = (label: string, value: string): string => {
    const content = `  ${label.padEnd(16)} ${value}`;
    const fill = Math.max(0, boxWidth - 2 - content.length);
    return `│${content}${" ".repeat(fill)}│`;
  };

  const costDisplay = `$${report.costUsd.toFixed(6)} (~₹${report.costInr.toFixed(3)} INR)`;

  console.log("\n┌" + "─".repeat(boxWidth - 2) + "┐");
  console.log("│  🪙 TRIPPYGO TOKEN & COST WATCHER" + " ".repeat(boxWidth - 36) + "│");
  console.log("├" + "─".repeat(boxWidth - 2) + "┤");
  console.log(padLine("Provider:", report.provider));
  console.log(padLine("Model:", report.model));
  if (report.sourceFile) {
    const filename = report.sourceFile.split(/[\/\\]/).pop() || report.sourceFile;
    console.log(padLine("File:", filename.length > 30 ? filename.slice(0, 27) + "..." : filename));
  }
  console.log(padLine("Input Tokens:", report.promptTokens.toLocaleString()));
  console.log(padLine("Output Tokens:", report.completionTokens.toLocaleString()));
  console.log(padLine("Total Tokens:", report.totalTokens.toLocaleString()));
  if (typeof report.durationMs === "number") {
    const durationStr =
      report.durationMs >= 1000
        ? `${(report.durationMs / 1000).toFixed(2)}s`
        : `${Math.round(report.durationMs)}ms`;
    console.log(padLine("Time Taken:", durationStr));
  }
  console.log("├" + "─".repeat(boxWidth - 2) + "┤");
  console.log(padLine("Est. Task Cost:", costDisplay));
  console.log("└" + "─".repeat(boxWidth - 2) + "┘\n");
}
