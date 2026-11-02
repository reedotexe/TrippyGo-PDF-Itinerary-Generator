import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, toAuthResponse } from "@/lib/auth/guard";
import { listStaffUsers, inviteStaffUser } from "@/lib/db/admin";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const users = await listStaffUsers();
    return NextResponse.json({ users });
  } catch (err: any) {
    if (err?.status) return toAuthResponse(err);
    return NextResponse.json(
      { error: "Failed to list users", details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: adminUser } = await requireAdmin(req);
    const body = await req.json();

    const { name, email, role } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const result = await inviteStaffUser({
      name: name.trim(),
      email: email.trim(),
      role: role === "admin" ? "admin" : "salesperson",
      adminUser,
      req,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err: any) {
    if (err?.status) return toAuthResponse(err);
    const isValidation = err?.message && err.message.includes("already exists");
    return NextResponse.json(
      { error: err?.message || "Failed to invite user" },
      { status: isValidation ? 400 : 500 }
    );
  }
}
