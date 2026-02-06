import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

    if (!["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get users with PENDING_TRAINEE or TRAINEE role who don't have an active training
    const trainees = await prisma.user.findMany({
      where: {
        role: { in: ["PENDING_TRAINEE", "TRAINEE"] },
        trainingsAsTrainee: {
          none: {
            status: { in: ["ACTIVE", "COMPLETED"] },
          },
        },
      },
      select: {
        id: true,
        cid: true,
        name: true,
        role: true,
      },
    });

    // Fetch registration data for each trainee
    const traineesWithRegistration = await Promise.all(
      trainees.map(async (trainee) => {
        const registration = trainee.cid ? await prisma.registration.findUnique({
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
            other: true,
          },
        }) : null;
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

/**
 * DELETE /api/mentor/pending-trainees
 * Remove a pending trainee request (PMP_LEITUNG, ADMIN only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    if (!["PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only PMP_LEITUNG and ADMIN can delete requests" },
        { status: 403 }
      );
    }

    const { traineeId } = await request.json();

    if (!traineeId) {
      return NextResponse.json(
        { error: "traineeId is required" },
        { status: 400 }
      );
    }

    const trainee = await prisma.user.findUnique({
      where: { id: traineeId },
      select: { id: true, cid: true, role: true },
    });

    if (!trainee) {
      return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
    }

    if (!['PENDING_TRAINEE', 'TRAINEE'].includes(trainee.role)) {
      return NextResponse.json(
        { error: "User is not a pending trainee" },
        { status: 400 }
      );
    }

    const activeTrainings = await prisma.training.count({
      where: {
        traineeId: trainee.id,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
    });

    if (activeTrainings > 0) {
      return NextResponse.json(
        { error: "Trainee has active or completed trainings" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (trainee.cid) {
        await tx.registration.deleteMany({
          where: { cid: trainee.cid },
        });
      }

      await tx.user.update({
        where: { id: trainee.id },
        data: {
          role: "VISITOR",
          userStatus: "Cancelled Trainee",
        },
      });
    });

    return NextResponse.json(
      { success: true, message: "Trainee request deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting pending trainee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
