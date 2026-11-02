import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, toAuthResponse } from "@/lib/auth/guard";
import { sendStaffPasswordReset } from "@/lib/db/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser } = await requireAdmin(req);
    const { id } = await params;

    const result = await sendStaffPasswordReset({
      userId: id,
      adminUser,
      req,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err?.status) return toAuthResponse(err);
    return NextResponse.json(
      { error: err?.message || "Failed to trigger password reset" },
      { status: 500 }
    );
  }
}
