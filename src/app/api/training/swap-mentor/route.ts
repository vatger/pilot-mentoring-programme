import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/swap-mentor
 * Replace one mentor assignment with another mentor on the same training.
 */
export async function POST(request: NextRequest) {
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

    const { trainingId, oldMentorId, newMentorId } = await request.json();

    if (!trainingId || !oldMentorId || !newMentorId) {
      return NextResponse.json(
        { error: "trainingId, oldMentorId and newMentorId are required" },
        { status: 400 }
      );
    }

    if (oldMentorId === newMentorId) {
      return NextResponse.json(
        { error: "oldMentorId and newMentorId must be different" },
        { status: 400 }
      );
    }

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { mentors: true },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const requesterIsMentor = training.mentors.some((m) => m.mentorId === userId);
    if (!requesterIsMentor && !["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only mentors and admins can swap mentors" },
        { status: 403 }
      );
    }

    const oldAssigned = training.mentors.some((m) => m.mentorId === oldMentorId);
    if (!oldAssigned) {
      return NextResponse.json(
        { error: "Old mentor is not assigned to this training" },
        { status: 404 }
      );
    }

    const newAlreadyAssigned = training.mentors.some((m) => m.mentorId === newMentorId);
    if (newAlreadyAssigned) {
      return NextResponse.json(
        { error: "New mentor is already assigned to this training" },
        { status: 409 }
      );
    }

    const newMentor = await prisma.user.findUnique({
      where: { id: newMentorId },
      select: { id: true, role: true },
    });

    if (!newMentor || !["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(newMentor.role)) {
      return NextResponse.json({ error: "New mentor not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.trainingMentor.deleteMany({
        where: { trainingId, mentorId: oldMentorId },
      });

      await tx.trainingMentor.create({
        data: {
          trainingId,
          mentorId: newMentorId,
        },
      });
    });

    const updatedTraining = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        mentors: {
          include: {
            mentor: { select: { id: true, name: true, cid: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedTraining, { status: 200 });
  } catch (error) {
    console.error("Error swapping mentor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
