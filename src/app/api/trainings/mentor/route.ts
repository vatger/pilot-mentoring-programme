import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTopicCoverage } from "@/lib/topicCoverage";
import { NextRequest, NextResponse } from "next/server";

const MENTOR_ROLES = ["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"];

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
        status: {
          not: "COMPLETED",
        },
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
                coverageMode: true,
                theoryCovered: true,
                practiceCovered: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const trainingsWithRegistration = await Promise.all(
      trainings.map(async (training) => {
        const registration = training.trainee.cid
          ? await prisma.registration.findUnique({
              where: { cid: training.trainee.cid },
              select: {
                cid: true,
                name: true,
                rating: true,
                fir: true,
                simulator: true,
                aircraft: true,
                client: true,
                clientSetup: true,
                experience: true,
                charts: true,
                airac: true,
                category: true,
                topics: true,
                schedule: true,
                communication: true,
                personal: true,
                other: true,
              },
            })
          : null;

        return {
          ...training,
          sessions: (training.sessions || []).map((session: any) => ({
            ...session,
            topics: (session.topics || []).map((topic: any) => normalizeTopicCoverage(topic)),
          })),
          trainee: {
            ...training.trainee,
            registration,
          },
        };
      })
    );

    return NextResponse.json(trainingsWithRegistration, { status: 200 });
  } catch (error) {
    console.error("Error fetching mentor trainings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
