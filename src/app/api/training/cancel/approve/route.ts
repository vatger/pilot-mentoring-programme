import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/cancel/approve
 * PMP_LEITUNG approves a cancellation and either:
 * 1. Deletes the trainee entirely (with all training data), OR
 * 2. Resets trainee to PENDING_TRAINEE status (available for other mentors)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    // Only PMP_LEITUNG and ADMIN can approve cancellations
    if (!["PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only PMP_LEITUNG and ADMIN can approve cancellations" },
        { status: 403 }
      );
    }

    const { trainingId, action } = await request.json();

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId is required" },
        { status: 400 }
      );
    }

    if (!["delete", "reactivate"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'delete' or 'reactivate'" },
        { status: 400 }
      );
    }

    // Get the training
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { trainee: true },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    if (training.status !== "ABGEBROCHEN") {
      return NextResponse.json(
        { error: "Training is not in ABGEBROCHEN status" },
        { status: 400 }
      );
    }

    if (action === "delete") {
      // Delete the trainee and all associated data
      // Cascade deletes will handle: trainings, sessions, checkrides, etc.
      await prisma.user.delete({
        where: { id: training.traineeId },
      });

      return NextResponse.json(
        { success: true, message: "Trainee and all data deleted" },
        { status: 200 }
      );
    } else if (action === "reactivate") {
      // Reset trainee to PENDING_TRAINEE and make them available for new mentors
      const updated = await prisma.user.update({
        where: { id: training.traineeId },
        data: {
          role: "PENDING_TRAINEE",
          userStatus: null, // Clear any cancelled status
        },
      });

      // Also delete the current training record (since it's being reset)
      await prisma.training.delete({
        where: { id: trainingId },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Trainee reactivated as PENDING_TRAINEE",
          trainee: updated,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error approving cancellation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
