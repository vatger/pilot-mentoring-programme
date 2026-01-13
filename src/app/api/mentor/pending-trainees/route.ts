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
    const userId = (session.user as any).id;

    if (!["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get users with PENDING_TRAINEE or TRAINEE role who don't have an active training
    // Also include the current user if they have no training (for single-account testing)
    const trainees = await prisma.user.findMany({
      where: {
        OR: [
          {
            role: { in: ["PENDING_TRAINEE", "TRAINEE"] },
            trainingsAsTrainee: {
              none: {
                status: { in: ["ACTIVE", "COMPLETED"] },
              },
            },
          },
          // Include current user for testing (if they have no active/completed training)
          {
            id: userId,
            trainingsAsTrainee: {
              none: {
                status: { in: ["ACTIVE", "COMPLETED"] },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        cid: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Fetch registration data for each trainee
    const traineesWithRegistration = await Promise.all(
      trainees.map(async (trainee) => {
        const registration = await prisma.registration.findUnique({
          where: { cid: trainee.cid },
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
          },
        });
        return {
          ...trainee,
          registration,
        };
      })
    );

    return NextResponse.json(traineesWithRegistration, { status: 200 });
  } catch (error) {
    console.error("Error fetching pending trainees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
