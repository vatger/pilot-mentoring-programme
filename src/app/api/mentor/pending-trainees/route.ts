import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/mentor/pending-trainees
 * Get all pending trainees (PENDING_TRAINEE role, not assigned to any mentor)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    if (!["MENTOR", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get users with PENDING_TRAINEE role who don't have an active training
    const trainees = await prisma.user.findMany({
      where: {
        role: "PENDING_TRAINEE",
        trainingsAsTrainee: {
          none: {
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
        },
      },
      select: {
        id: true,
        cid: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(trainees, { status: 200 });
  } catch (error) {
    console.error("Error fetching pending trainees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
