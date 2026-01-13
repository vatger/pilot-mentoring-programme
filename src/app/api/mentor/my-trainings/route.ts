import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/mentor/my-trainings
 * Get all trainings for the current mentor
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (!["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get trainings where this mentor is assigned OR where they are the trainee
    // (the latter helps with single-account testing)
    const trainings = await prisma.training.findMany({
      where: {
        OR: [
          {
            mentors: {
              some: {
                mentorId: userId,
              },
            },
          },
          {
            traineeId: userId,
          },
        ],
      },
      include: {
        trainee: {
          select: {
            id: true,
            cid: true,
            name: true,
            email: true,
            role: true,
          },
        },
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
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trainings, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentor trainings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
