import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EXAMINER_ROLES = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR"];

// GET /api/checkrides/examiner
// Returns ready trainees without checkride and active/recent checkrides.
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role;
    if (!EXAMINER_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Keep cleanup for stale checkrides from legacy slot-booking flow.
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    await prisma.checkride.deleteMany({
      where: {
        result: "INCOMPLETE",
        scheduledDate: { lt: twoDaysAgo },
      },
    });

    const checkrides = await prisma.checkride.findMany({
      where: {
        result: { not: "PASSED" },
      },
      include: {
        availability: {
          include: {
            examiner: { select: { id: true, cid: true, name: true } },
          },
        },
        trainee: { select: { id: true, cid: true, name: true } },
        assessment: true,
      },
      orderBy: { scheduledDate: "asc" },
    });

    const readyRequests = await prisma.training.findMany({
      where: {
        readyForCheckride: true,
        status: "ACTIVE",
        mentors: {
          some: {},
        },
        checkrides: {
          none: {},
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        trainee: {
          select: { id: true, cid: true, name: true },
        },
        mentors: {
          include: {
            mentor: {
              select: { id: true, cid: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ checkrides, readyRequests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching examiner data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
