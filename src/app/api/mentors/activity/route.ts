import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface MentorActivity {
  id: string;
  name: string | null;
  cid: string | null;
  role: string;
  traineeCount: number;
  lastSessionDate: string | null;
}

/**
 * GET /api/mentors/activity
 * Get all mentors sorted by last activity (last submitted session)
 * Includes: mentor info, trainee count, last session date
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    // Only PMP_LEITUNG and ADMIN can view mentor activity
    if (!["PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get all mentors with their trainings
    const mentors = await prisma.user.findMany({
      where: {
        role: {
          in: ["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"],
        },
      },
      select: {
        id: true,
        name: true,
        cid: true,
        role: true,
      },
    });

    // For each mentor, get their trainings and sessions
    const mentorActivity: MentorActivity[] = await Promise.all(
      mentors.map(async (mentor) => {
        // Get all active trainings for this mentor
        const trainings = await prisma.trainingMentor.findMany({
          where: {
            mentorId: mentor.id,
            training: {
              status: "ACTIVE",
            },
          },
          include: {
            training: {
              include: {
                sessions: {
                  orderBy: {
                    sessionDate: "desc",
                  },
                  take: 1,
                },
              },
            },
          },
        });

        const traineeCount = trainings.length;

        // Find most recent session
        let lastSessionDate: Date | null = null;
        for (const trainingMentor of trainings) {
          if (trainingMentor.training.sessions.length > 0) {
            const session = trainingMentor.training.sessions[0];
            const dateToCompare = session.releasedAt || session.sessionDate;
            if (!lastSessionDate || dateToCompare > lastSessionDate) {
              lastSessionDate = dateToCompare;
            }
          }
        }

        return {
          id: mentor.id,
          name: mentor.name,
          cid: mentor.cid,
          role: mentor.role,
          traineeCount,
          lastSessionDate: lastSessionDate ? lastSessionDate.toISOString() : null,
        };
      })
    );

    // Sort by most recent activity first (nulls last)
    mentorActivity.sort((a, b) => {
      if (!a.lastSessionDate && !b.lastSessionDate) return 0;
      if (!a.lastSessionDate) return 1;
      if (!b.lastSessionDate) return -1;
      return (
        new Date(b.lastSessionDate).getTime() -
        new Date(a.lastSessionDate).getTime()
      );
    });

    return NextResponse.json(mentorActivity, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentor activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
