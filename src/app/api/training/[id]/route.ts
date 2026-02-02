import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/training/[id]
 * Fetch a specific training record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trainingId = id;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Fetch training
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
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
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    // Check if user is trainee, mentor, admin/leitung, or assigned examiner
    const isMentor = training.mentors.some((m) => m.mentorId === userId);
    const isTrainee = training.traineeId === userId;
    const isAdmin = ["ADMIN", "PMP_LEITUNG"].includes(userRole);

    let examinerHasPlannedCheckride = false;
    if (userRole === "PMP_PRÜFER") {
      const checkride = await prisma.checkride.findFirst({
        where: {
          trainingId,
          availability: { examinerId: userId },
        },
      });
      examinerHasPlannedCheckride = !!checkride;
    }

    if (!isMentor && !isTrainee && !isAdmin && !examinerHasPlannedCheckride) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    return NextResponse.json(
      {
        ...training,
        trainee: {
          ...training.trainee,
          registration,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching training:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
