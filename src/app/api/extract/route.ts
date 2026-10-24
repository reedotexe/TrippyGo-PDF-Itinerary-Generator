import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadToStorage } from "@/lib/storage/s3";
import { extractItinerary } from "@/lib/extraction/client";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/security/rate-limit";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB strict limit

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting (10 requests/hour per client; relaxed in test/dev)
    const clientId = getClientIdentifier(req);
    const maxRequests = process.env.NODE_ENV === "production" ? 10 : 50;
    const rateCheck = checkRateLimit(`extract_${clientId}`, {
      maxRequests,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.resetInSeconds);
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. Handle JSON input (Pasted supplier text)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const text = body.text;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return NextResponse.json(
          { error: "Bad Request: 'text' field is required and cannot be empty." },
          { status: 400 }
        );
      }

      const fileUuid = randomUUID();
      const storageKey = `uploads/${fileUuid}.txt`;

      // Store raw text in S3 / local fallback
      await uploadToStorage({
        key: storageKey,
        data: text,
        contentType: "text/plain",
      });

      const extractionResult = await extractItinerary({
        text,
        filename: "pasted_supplier_text.txt",
        sourceFileKey: storageKey,
      });

      return NextResponse.json(extractionResult);
    }

    // 2. Handle Multipart Form Data (Uploaded PDF or Text file)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "Bad Request: No file attached. Use key 'file'." },
          { status: 400 }
        );
      }

      // 10 MB size limit validation
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            error: `Payload Too Large: File size exceeds the 10 MB limit (${(
              file.size /
              (1024 * 1024)
            ).toFixed(2)} MB).`,
          },
          { status: 413 }
        );
      }

      const mimeType = file.type;
      const fileName = file.name || "supplier_quote";
      const fileExtension =
        fileName.split(".").pop()?.toLowerCase() ||
        (mimeType === "application/pdf" ? "pdf" : "txt");

      // Validate MIME type
      const isPdf = mimeType === "application/pdf" || fileExtension === "pdf";
      const isText = mimeType.startsWith("text/") || fileExtension === "txt";

      if (!isPdf && !isText) {
        return NextResponse.json(
          {
            error: `Unsupported Media Type: Only PDF and text files are supported. Received '${
              mimeType || fileExtension
            }'.`,
          },
          { status: 415 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Server-side magic bytes verification for PDF
      if (isPdf) {
        const header = buffer.slice(0, 5).toString("utf8");
        if (header !== "%PDF-") {
          return NextResponse.json(
            { error: "Bad Request: File signature mismatch. Expected valid PDF with %PDF- header." },
            { status: 400 }
          );
        }
      }

      const fileUuid = randomUUID();
      const storageKey = `uploads/${fileUuid}.${fileExtension}`;

      // Store raw file in S3 / local fallback
      await uploadToStorage({
        key: storageKey,
        data: buffer,
        contentType: isPdf ? "application/pdf" : "text/plain",
      });

      if (isPdf) {
        const base64Data = buffer.toString("base64");
        const extractionResult = await extractItinerary({
          pdfBase64: base64Data,
          filename: fileName,
          sourceFileKey: storageKey,
        });
        return NextResponse.json(extractionResult);
      } else {
        const textContent = buffer.toString("utf8");
        const extractionResult = await extractItinerary({
          text: textContent,
          filename: fileName,
          sourceFileKey: storageKey,
        });
        return NextResponse.json(extractionResult);
      }
    }

    return NextResponse.json(
      { error: "Unsupported Content-Type. Expected 'application/json' or 'multipart/form-data'." },
      { status: 415 }
    );
  } catch (error) {
    console.error("[POST /api/extract] Internal server error:", error);
    return NextResponse.json(
      { error: "Internal server error during extraction.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
