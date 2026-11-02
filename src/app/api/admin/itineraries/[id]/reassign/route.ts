import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, toAuthResponse } from "@/lib/auth/guard";
import { reassignItinerary } from "@/lib/db/itineraries";
import { listStaffUsers } from "@/lib/db/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser } = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const { newOwnerId } = body;
    if (!newOwnerId || typeof newOwnerId !== "string") {
      return NextResponse.json({ error: "newOwnerId is required" }, { status: 400 });
    }

    // Verify new owner exists
    const staff = await listStaffUsers();
    const targetStaff = staff.find((u) => u.id === newOwnerId);
    if (!targetStaff) {
      return NextResponse.json(
        { error: `Target user '${newOwnerId}' does not exist` },
        { status: 400 }
      );
    }

    const success = await reassignItinerary(id, newOwnerId, adminUser);
    if (!success) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Proposal reassigned to ${targetStaff.name}`,
      newOwner: { id: targetStaff.id, name: targetStaff.name, email: targetStaff.email },
    });
  } catch (err: any) {
    if (err?.status) return toAuthResponse(err);
    return NextResponse.json(
      { error: "Failed to reassign proposal", details: err?.message },
      { status: 500 }
    );
  }
}
