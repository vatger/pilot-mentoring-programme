import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/cancel
 * Initiate cancellation of a training (mentor provides reason, PMP_LEITUNG approves)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Only MENTOR, PMP_LEITUNG, and ADMIN can initiate cancellation
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { trainingId, cancellationReason } = await request.json();

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId is required" },
        { status: 400 }
      );
    }

    if (!cancellationReason || cancellationReason.trim().length === 0) {
      return NextResponse.json(
        { error: "cancellationReason is required" },
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
    if (!isMentor && !["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only mentors and admins can cancel trainings" },
        { status: 403 }
      );
    }

    // Update training status to ABGEBROCHEN and store cancellation reason
    const updated = await prisma.training.update({
      where: { id: trainingId },
      data: { 
        status: "ABGEBROCHEN",
        cancellationReason: cancellationReason.trim(),
        cancellationAt: new Date(),
      } as any,
      include: {
        mentors: {
          include: { mentor: { select: { id: true, name: true } } },
        },
        trainee: true,
      },
    });

    // DO NOT update trainee status here - let PMP_LEITUNG decide in approval route
    // The trainee remains in their current state until PMP_LEITUNG takes action

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error cancelling training:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
