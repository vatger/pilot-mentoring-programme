import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/add-mentor
 * Add a co-mentor to an existing training (max 3 mentors)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Only MENTOR, PMP_LEITUNG, and ADMIN can add mentors
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { trainingId, newMentorId } = await request.json();

    if (!trainingId || !newMentorId) {
      return NextResponse.json(
        { error: "trainingId and newMentorId are required" },
        { status: 400 }
      );
    }

    // Verify the training exists and the requester is a mentor
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { mentors: true },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    // Check if requester is one of the mentors
    const isMentor = training.mentors.some((m) => m.mentorId === userId);
    if (!isMentor && !["ADMIN", "PMP_LEITUNG"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only mentors and admins can add co-mentors" },
        { status: 403 }
      );
    }

    // Check mentor limit (max 3)
    if (training.mentors.length >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 mentors per trainee" },
        { status: 409 }
      );
    }

    // Check if new mentor already assigned
    const alreadyAssigned = training.mentors.some(
      (m) => m.mentorId === newMentorId
    );
    if (alreadyAssigned) {
      return NextResponse.json(
        { error: "Mentor already assigned to this training" },
        { status: 409 }
      );
    }

    // Add the mentor
    const mentorRecord = await prisma.trainingMentor.create({
      data: {
        trainingId,
        mentorId: newMentorId,
      },
      include: {
        mentor: { select: { id: true, name: true, cid: true } },
      },
    });

    return NextResponse.json(mentorRecord, { status: 201 });
  } catch (error) {
    console.error("Error adding mentor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
