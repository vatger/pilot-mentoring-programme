import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const TRAINEE_ROLES = ["TRAINEE", "PENDING_TRAINEE"];

// GET /api/trainings/trainee - Get all trainings for the current trainee
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Allow trainees and admins to fetch
    if (!TRAINEE_ROLES.includes(role) && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Only trainees can access this" }, { status: 403 });
    }

    // Find all trainings for this trainee
    const trainings = await prisma.training.findMany({
      where: {
        traineeId: userId,
      },
      include: {
        mentors: {
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                cid: true,
              },
            },
          },
        },
        sessions: {
          where: { isDraft: false },
          select: {
            id: true,
            topics: {
              select: {
                topic: true,
                checked: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(trainings, { status: 200 });
  } catch (error) {
    console.error("Error fetching trainee trainings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
