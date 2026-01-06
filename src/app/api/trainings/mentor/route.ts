import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MENTOR_ROLES = ["MENTOR", "PMP_LEITUNG", "ADMIN"];

// GET /api/trainings/mentor - Get all trainings assigned to the current mentor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (!MENTOR_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden - Only mentors can access this" }, { status: 403 });
    }

    // Find all trainings where this user is a mentor
    const trainings = await prisma.training.findMany({
      where: {
        mentors: {
          some: {
            mentorId: userId,
          },
        },
      },
      include: {
        trainee: {
          select: {
            id: true,
            cid: true,
            name: true,
            email: true,
          },
        },
        sessions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(trainings, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentor trainings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
