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

    const isLeadership = ["PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(userRole);

    // Only show ACTIVE trainings in mentor dashboard.
    // Leadership can see all active trainings; mentors only their own assignments.
    const trainings = await prisma.training.findMany({
      where: {
        status: "ACTIVE",
        ...(isLeadership
          ? {}
          : {
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
            }),
      },
      include: {
        trainee: {
          select: {
            id: true,
            cid: true,
            name: true,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
