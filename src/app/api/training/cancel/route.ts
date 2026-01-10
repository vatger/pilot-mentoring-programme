import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/cancel
 * Cancel a training (set status to ABGEBROCHEN)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Only MENTOR, PMP_LEITUNG, and ADMIN can cancel trainings
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { trainingId } = await request.json();

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId is required" },
        { status: 400 }
      );
    }

    // Get the training
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { mentors: true, trainee: true },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    // Check if requester is a mentor or admin
    const isMentor = training.mentors.some((m) => m.mentorId === userId);
    if (!isMentor && !["ADMIN", "PMP_LEITUNG"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only mentors and admins can cancel trainings" },
        { status: 403 }
      );
    }

    // Update training status
    const updated = await prisma.training.update({
      where: { id: trainingId },
      data: { status: "ABGEBROCHEN" },
      include: {
        mentors: {
          include: { mentor: { select: { id: true, name: true } } },
        },
      },
    });

    // Update trainee userStatus to "Cancelled Trainee" and set role to VISITOR
    await prisma.user.update({
      where: { id: training.traineeId },
      data: { 
        userStatus: "Cancelled Trainee",
        role: "VISITOR"
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error cancelling training:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
