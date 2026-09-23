import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/cancel/approve
 * PMP_LEITUNG approves a cancellation and either archives the training or
 * reactivates it. Training data is only deleted through the GDPR endpoint.
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

    if (!["archive", "reactivate"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'archive' or 'reactivate'" },
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

    if (action === "archive") {
      await prisma.$transaction(async (tx) => {
        await tx.trainingMentor.deleteMany({
          where: { trainingId },
        });

        await tx.user.update({
          where: { id: training.traineeId },
          data: {
            role: "VISITOR",
            userStatus: "Cancelled Trainee",
          },
        });
      });

      return NextResponse.json(
        { success: true, message: "Training archived and account marked as cancelled" },
        { status: 200 }
      );
    } else if (action === "reactivate") {
      await prisma.$transaction(async (tx) => {
        await tx.training.update({
          where: { id: trainingId },
          data: {
            status: "ACTIVE",
            cancellationReason: null,
            cancellationAt: null,
          },
        });

        await tx.user.update({
          where: { id: training.traineeId },
          data: {
            role: "PENDING_TRAINEE",
            userStatus: null,
          },
        });
      });

      return NextResponse.json(
        {
          success: true,
          message: "Training reactivated and trainee set to PENDING_TRAINEE",
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
