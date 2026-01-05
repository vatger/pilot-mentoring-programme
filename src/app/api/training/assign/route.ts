import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/assign
 * Mentor picks a pending trainee to mentor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Only MENTOR, PMP_LEITUNG, and ADMIN can assign trainees
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { traineeId } = await request.json();
    if (!traineeId) {
      return NextResponse.json(
        { error: "traineeId is required" },
        { status: 400 }
      );
    }

    // Get trainee info
    const trainee = await prisma.user.findUnique({
      where: { id: traineeId },
    });

    if (!trainee) {
      return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
    }

    // Check if trainee already has an active training
    const existingTraining = await prisma.training.findFirst({
      where: {
        traineeId,
        status: { not: "ABGEBROCHEN" },
      },
    });

    if (existingTraining) {
      return NextResponse.json(
        { error: "Trainee already assigned to a mentor" },
        { status: 409 }
      );
    }

    // Create new training and assign mentor
    const training = await prisma.training.create({
      data: {
        traineeId,
        mentors: {
          create: {
            mentorId: userId,
          },
        },
      },
      include: {
        mentors: {
          include: { mentor: { select: { id: true, name: true, cid: true } } },
        },
      },
    });

    // Update trainee role to TRAINEE if they were PENDING_TRAINEE
    if (trainee.role === "PENDING_TRAINEE") {
      await prisma.user.update({
        where: { id: traineeId },
        data: { role: "TRAINEE" },
      });
    }

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error("Error assigning trainee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
