import assert from "node:assert/strict";

console.log("=== RUNNING FILE UPLOAD & MIME VALIDATION SECURITY SUITE ===\n");

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB strict limit

interface MockUploadFile {
  name: string;
  size: number;
  type: string;
  buffer: Buffer;
}

/**
 * Server-side upload validation logic matching POST /api/extract
 */
function validateUpload(file: MockUploadFile): { status: number; error?: string; ok: boolean } {
  // 1. Size Check
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      status: 413,
      error: `Payload Too Large: File size exceeds the 10 MB limit (${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)} MB).`,
      ok: false,
    };
  }

  const mimeType = file.type;
  const fileName = file.name || "supplier_quote";
  const fileExtension =
    fileName.split(".").pop()?.toLowerCase() ||
    (mimeType === "application/pdf" ? "pdf" : "txt");

  // 2. MIME type & extension check
  const isPdf = mimeType === "application/pdf" || fileExtension === "pdf";
  const isText = mimeType.startsWith("text/") || fileExtension === "txt";

  if (!isPdf && !isText) {
    return {
      status: 415,
      error: `Unsupported Media Type: Only PDF and text files are supported. Received '${
        mimeType || fileExtension
      }'.`,
      ok: false,
    };
  }

  // 3. Server-side magic bytes verification for PDF
  if (isPdf) {
    const header = file.buffer.slice(0, 5).toString("utf8");
    if (header !== "%PDF-") {
      return {
        status: 400,
        error: "Bad Request: File signature mismatch. Expected valid PDF with %PDF- header.",
        ok: false,
      };
    }
  }

  return { status: 200, ok: true };
}

// -------------------------------------------------------------
// Test 1: Reject Files Exceeding 10 MB Limit (HTTP 413)
// -------------------------------------------------------------
console.log("[Test 1] Rejecting files larger than 10 MB (HTTP 413)...");
const oversizedFile: MockUploadFile = {
  name: "huge_supplier_quote.pdf",
  size: 11 * 1024 * 1024, // 11 MB
  type: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 mock content"),
};

const sizeResult = validateUpload(oversizedFile);
assert.equal(sizeResult.status, 413);
assert.equal(sizeResult.ok, false);
assert.ok(sizeResult.error?.includes("Payload Too Large"));
console.log("  -> 11 MB file rejected with HTTP 413.");

// Boundary check: Exactly 10 MB file
const boundaryFile: MockUploadFile = {
  name: "exact_10mb.pdf",
  size: 10 * 1024 * 1024, // Exactly 10 MB
  type: "application/pdf",
  buffer: Buffer.from("%PDF-1.5 valid"),
};
assert.equal(validateUpload(boundaryFile).status, 200);
console.log("  -> Exactly 10 MB file allowed.");

// -------------------------------------------------------------
// Test 2: Reject Unsupported Media Types (HTTP 415)
// -------------------------------------------------------------
console.log("[Test 2] Rejecting unsupported media types (HTTP 415)...");
const pngFile: MockUploadFile = {
  name: "quote_screenshot.png",
  size: 500 * 1024,
  type: "image/png",
  buffer: Buffer.from("\x89PNG\r\n\x1a\n"),
};
const pngResult = validateUpload(pngFile);
assert.equal(pngResult.status, 415);
assert.ok(pngResult.error?.includes("Unsupported Media Type"));

const exeFile: MockUploadFile = {
  name: "quote.exe",
  size: 100 * 1024,
  type: "application/x-msdownload",
  buffer: Buffer.from("MZ"),
};
assert.equal(validateUpload(exeFile).status, 415);
console.log("  -> Images, executables, and non-PDFs rejected with HTTP 415.");

// -------------------------------------------------------------
// Test 3: Magic Bytes Verification (HTTP 400)
// -------------------------------------------------------------
console.log("[Test 3] Rejecting spoofed PDF files with fake extensions (HTTP 400)...");
const spoofedPdf: MockUploadFile = {
  name: "malicious_script.pdf",
  size: 2 * 1024,
  type: "application/pdf",
  buffer: Buffer.from("<script>alert('pwned')</script>"), // Missing %PDF- header
};

const spoofResult = validateUpload(spoofedPdf);
assert.equal(spoofResult.status, 400);
assert.equal(spoofResult.ok, false);
assert.ok(spoofResult.error?.includes("File signature mismatch"));
console.log("  -> Spoofed PDF without %PDF- magic bytes rejected with HTTP 400.");

// -------------------------------------------------------------
// Test 4: Accept Valid PDFs and Valid Text Files (HTTP 200)
// -------------------------------------------------------------
console.log("[Test 4] Accepting authentic PDF and text itineraries...");
const validPdf: MockUploadFile = {
  name: "genuine_kashmir.pdf",
  size: 1.5 * 1024 * 1024,
  type: "application/pdf",
  buffer: Buffer.from("%PDF-1.7 genuine content"),
};
assert.equal(validateUpload(validPdf).status, 200);

const validText: MockUploadFile = {
  name: "whatsapp_quote.txt",
  size: 4 * 1024,
  type: "text/plain",
  buffer: Buffer.from("Day 1: Srinagar arrival..."),
};
assert.equal(validateUpload(validText).status, 200);
console.log("  -> Authentic PDF and text payloads passed successfully.");

console.log("\nPASS: ALL FILE UPLOAD SECURITY VALIDATIONS PASSED 100%!\n");
