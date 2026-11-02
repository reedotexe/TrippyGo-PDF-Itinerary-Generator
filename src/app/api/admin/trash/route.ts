import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, toAuthResponse } from "@/lib/auth/guard";
import { listItineraries } from "@/lib/db/itineraries";
import { listStaffUsers } from "@/lib/db/admin";

export async function GET(req: NextRequest) {
  try {
    const { user: adminUser } = await requireAdmin(req);
    const deletedItins = await listItineraries(adminUser, { deletedOnly: true });
    const staffUsers = await listStaffUsers();
    const userMap = new Map(staffUsers.map((u) => [u.id, u.name]));

    const enriched = deletedItins.map((item) => ({
      ...item,
      ownerName: item.ownerId ? userMap.get(item.ownerId) || "Unknown" : "Unassigned",
    }));

    return NextResponse.json({ itineraries: enriched });
  } catch (err: any) {
    if (err?.status) return toAuthResponse(err);
    return NextResponse.json(
      { error: "Failed to list trash items", details: err?.message },
      { status: 500 }
    );
  }
}
