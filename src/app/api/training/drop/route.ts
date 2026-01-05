import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/drop-trainee
 * Remove a trainee from mentorship or remove a co-mentor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Only MENTOR, PMP_LEITUNG, and ADMIN can drop trainees/mentors
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { trainingId, mentorId } = await request.json();

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId is required" },
        { status: 400 }
      );
    }

    // Get the training
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { mentors: true },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    // Check if requester is a mentor or admin
    const isMentor = training.mentors.some((m) => m.mentorId === userId);
    if (!isMentor && !["ADMIN", "PMP_LEITUNG"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only mentors and admins can drop trainees" },
        { status: 403 }
      );
    }

    if (mentorId) {
      // Remove specific mentor
      await prisma.trainingMentor.deleteMany({
        where: { trainingId, mentorId },
      });
    } else {
      // No mentorId specified, delete the entire training
      await prisma.training.delete({
        where: { id: trainingId },
      });
    }

    return NextResponse.json(
      { success: true, message: "Trainee/mentor dropped successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error dropping trainee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
