import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/training/pending-cancellations
 * Get all trainings with ABGEBROCHEN status waiting for PMP_LEITUNG approval
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    // Only PMP_LEITUNG and ADMIN can view pending cancellations
    if (!["PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get all trainings with ABGEBROCHEN status
    const pendingCancellations = await prisma.training.findMany({
      where: { status: "ABGEBROCHEN" },
      include: {
        trainee: {
          select: { id: true, name: true, cid: true },
        },
      },
      orderBy: { cancellationAt: "desc" },
    });

    return NextResponse.json(pendingCancellations, { status: 200 });
  } catch (error) {
    console.error("Error fetching pending cancellations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
