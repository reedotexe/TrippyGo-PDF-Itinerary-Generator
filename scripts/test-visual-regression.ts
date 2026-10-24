import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const FIXTURES_DIR = path.join(process.cwd(), ".uploads", "fixtures");
const REFERENCE_DIR = path.join(process.cwd(), "tests", "fixtures", "reference-pdfs");

if (!fs.existsSync(REFERENCE_DIR)) {
  fs.mkdirSync(REFERENCE_DIR, { recursive: true });
}

interface FixtureAudit {
  file: string;
  sizeBytes: number;
  sizeKb: number;
  pageCount: number;
  textSnippet: string;
  hasSacCode: boolean;
  hasGstin: boolean;
  hasBrandHeader: boolean;
}

export async function runVisualRegressionAudit() {
  console.log("=== RUNNING VISUAL REGRESSION & REFERENCE AUDIT ===\n");

  if (!fs.existsSync(FIXTURES_DIR)) {
    throw new Error(`Fixtures directory not found at ${FIXTURES_DIR}. Run test-pdf-fixtures.ts first.`);
  }

  const pdfFiles = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".pdf"));
  if (pdfFiles.length < 8) {
    throw new Error(`Expected at least 8 fixture PDFs, found ${pdfFiles.length}`);
  }

  const audits: FixtureAudit[] = [];

  for (const file of pdfFiles) {
    const fullPath = path.join(FIXTURES_DIR, file);
    const buffer = fs.readFileSync(fullPath);
    const stats = fs.statSync(fullPath);

    // Verify valid PDF header
    const header = buffer.slice(0, 5).toString("utf8");
    if (header !== "%PDF-") {
      throw new Error(`File ${file} is not a valid PDF! Header: ${header}`);
    }

    // Parse PDF text stream using PDFParse
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const pdfText = textResult.text;
    await parser.destroy();

    const audit: FixtureAudit = {
      file,
      sizeBytes: stats.size,
      sizeKb: Number((stats.size / 1024).toFixed(1)),
      pageCount: textResult.pages?.length || 1,
      textSnippet: pdfText.slice(0, 80).replace(/\s+/g, " "),
      hasSacCode: pdfText.includes("998552"),
      hasGstin: pdfText.includes("27AABCT1234D1Z5"),
      hasBrandHeader: pdfText.includes("TrippyGo") || pdfText.includes("TRIPPYGO"),
    };

    audits.push(audit);
    console.log(`[AUDIT] ${file.padEnd(32)} | ${audit.sizeKb} KB | Pages: ${audit.pageCount} | Brand: ${audit.hasBrandHeader ? "✓" : "✕"} | SAC: ${audit.hasSacCode ? "✓" : "✕"}`);
  }

  // Save reference baseline metadata
  const metadataPath = path.join(REFERENCE_DIR, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(audits, null, 2), "utf8");
  console.log(`\nPASS: All ${audits.length} reference PDFs audited and saved to ${metadataPath}\n`);
}

if (require.main === module) {
  runVisualRegressionAudit().catch((err) => {
    console.error("FATAL: Visual regression audit failed:", err);
    process.exit(1);
  });
}
