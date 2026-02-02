import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EXAMINER_ROLES = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR"];
const db = prisma as any;

function isExaminer(role?: string) {
  return role ? EXAMINER_ROLES.includes(role) : false;
}

/**
 * DELETE /api/checkrides/[id]
 * Cancel a planned checkride (examiner can cancel any INCOMPLETE checkride)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (!isExaminer(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checkrideId = params.id;

    // Get the checkride
    const checkride = await db.checkride.findUnique({
      where: { id: checkrideId },
      include: { availability: true },
    });

    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    // Only allow cancelling INCOMPLETE checkrides
    if (checkride.result !== "INCOMPLETE") {
      return NextResponse.json(
        { error: "Can only cancel incomplete checkrides" },
        { status: 400 }
      );
    }

    // Delete the checkride
    await db.checkride.delete({
      where: { id: checkrideId },
    });

    // Set availability back to AVAILABLE
    await db.checkrideAvailability.update({
      where: { id: checkride.availabilityId },
      data: { status: "AVAILABLE" },
    });

    return NextResponse.json(
      { success: true, message: "Checkride cancelled" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling checkride:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
