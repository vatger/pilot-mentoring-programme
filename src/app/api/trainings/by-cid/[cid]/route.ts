import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/trainings/by-cid/[cid]
 * Get all trainings for a trainee by their CID
 * Only accessible to PMP_PRÜFER, PMP_LEITUNG, and ADMIN
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!["PMP_PRÜFER", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { cid } = await params;
    const traineesCid = String(cid || "").trim();

    if (!traineesCid) {
      return NextResponse.json({ error: "cid is required" }, { status: 400 });
    }

    // Find user by CID
    const trainee = await prisma.user.findUnique({
      where: { cid: traineesCid },
      select: { id: true },
    });

    if (!trainee) {
      return NextResponse.json(
        { error: "Trainee not found" },
        { status: 404 }
      );
    }

    // Get all trainings for this trainee
    const trainings = await prisma.training.findMany({
      where: { traineeId: trainee.id },
      include: {
        trainee: { select: { id: true, cid: true, name: true } },
        sessions: true,
        mentors: { select: { mentorId: true, mentor: { select: { id: true, name: true, cid: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trainings, { status: 200 });
  } catch (error) {
    console.error("Error fetching trainings by CID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
