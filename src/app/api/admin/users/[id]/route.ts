import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, toAuthResponse } from "@/lib/auth/guard";
import { updateStaffUser } from "@/lib/db/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser } = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const { role, banned, banReason } = body;

    const updated = await updateStaffUser({
      userId: id,
      role,
      banned,
      banReason,
      adminUser,
      req,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    if (err?.status) return toAuthResponse(err);
    const isSafetyRule = err?.message && err.message.includes("last remaining active administrator");
    const isNotFound = err?.message && err.message.includes("not found");
    return NextResponse.json(
      { error: err?.message || "Failed to update user" },
      { status: isSafetyRule || isNotFound ? 400 : 500 }
    );
  }
}
