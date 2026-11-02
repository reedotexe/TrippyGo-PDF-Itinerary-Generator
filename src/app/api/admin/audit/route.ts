import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, toAuthResponse } from "@/lib/auth/guard";
import { queryAuditLogs } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const actorId = searchParams.get("actorId") || undefined;
    const targetType = searchParams.get("targetType") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const logs = await queryAuditLogs({
      action,
      actorId,
      targetType,
      limit,
    });

    return NextResponse.json({ logs });
  } catch (err: any) {
    if (err?.status) return toAuthResponse(err);
    return NextResponse.json(
      { error: "Failed to query audit logs", details: err?.message },
      { status: 500 }
    );
  }
}
