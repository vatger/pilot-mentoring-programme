import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/trainings/[id]/finish-coaching
 * Mark a coaching training as completed and trainee as COMPLETED_TRAINEE
 * Only available for mentors/leadership for ONLINE_COACHING trainings
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Only mentors, leadership can finish coaching
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        trainee: { select: { id: true } },
        mentors: { select: { mentorId: true } },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    // Check if it's a coaching training
    if (training.trainingType !== "ONLINE_COACHING") {
      return NextResponse.json(
        { error: "This endpoint is only for ONLINE_COACHING trainings" },
        { status: 400 }
      );
    }

    // Check if user is a mentor for this training or is leadership
    const isLeadership = ["ADMIN", "PMP_LEITUNG"].includes(userRole);
    const isMentor = training.mentors.some((m: any) => m.mentorId === userId);

    if (!isLeadership && !isMentor) {
      return NextResponse.json(
        { error: "Only assigned mentors can finish coaching" },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTraining = await tx.training.update({
        where: { id },
        data: {
          status: "COMPLETED",
        },
      });

      await tx.user.update({
        where: { id: training.trainee.id },
        data: {
          userStatus: "Completed Trainee",
          role: "COMPLETED_TRAINEE",
        },
      });

      return updatedTraining;
    });

    return NextResponse.json({ training: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Error finishing coaching training:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
