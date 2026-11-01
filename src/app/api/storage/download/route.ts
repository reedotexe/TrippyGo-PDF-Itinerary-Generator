import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing 'key' query parameter" }, { status: 400 });
  }

  // Security: prevent path traversal
  const normalizedKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, "");
  const filePath = path.join(process.cwd(), ".uploads", normalizedKey);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === ".pdf" ? "application/pdf" : ext === ".txt" ? "text/plain" : "application/octet-stream";

  const isAttachment = searchParams.get("download") === "1";
  const dispositionType = isAttachment ? "attachment" : "inline";

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${dispositionType}; filename="${path.basename(filePath)}"`,
      "Content-Length": fileBuffer.length.toString(),
    },
  });
}
