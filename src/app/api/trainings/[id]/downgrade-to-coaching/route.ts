import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/trainings/[id]/downgrade-to-coaching
 * Downgrade a STANDARD training to ONLINE_COACHING.
 * Only the assigned mentor, leadership, or admin may perform this action.
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

    if (training.trainingType !== "STANDARD") {
      return NextResponse.json(
        { error: "Only STANDARD trainings can be downgraded to coaching" },
        { status: 400 }
      );
    }

    if (training.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active trainings can be downgraded" },
        { status: 400 }
      );
    }

    const isLeadership = ["ADMIN", "PMP_LEITUNG"].includes(userRole);
    const isAssignedMentor = training.mentors.some((mentor) => mentor.mentorId === userId);

    if (!isLeadership && !isAssignedMentor) {
      return NextResponse.json(
        { error: "Only assigned mentors can downgrade training" },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      return tx.training.update({
        where: { id },
        data: {
          trainingType: "ONLINE_COACHING",
          readyForCheckride: false,
          checkrideRequestText: null,
          checkrideRequestedAt: null,
        },
      });
    });

    return NextResponse.json({ training: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Error downgrading training to coaching:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}