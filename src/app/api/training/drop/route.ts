import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/drop
 * Two use cases:
 * 1. Remove a co-mentor from a training (mentorId provided)
 * 2. Reset a cancelled trainee's old training data when reapplying (userId provided, called from /anmeldung)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    const { trainingId, mentorId, resetCancelledTrainee } = await request.json();

    // Use case 1: Mentor dropping a co-mentor or trainee
    if (trainingId && !resetCancelledTrainee) {
      // Only MENTOR, PMP_LEITUNG, and ADMIN can drop trainees/mentors
      if (!["MENTOR", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        
        return NextResponse.json(
          { success: true, message: "Mentor removed successfully" },
          { status: 200 }
        );
      } else {
        // No mentorId specified, delete the entire training
        await prisma.training.delete({
          where: { id: trainingId },
        });
        
        return NextResponse.json(
          { success: true, message: "Training dropped successfully" },
          { status: 200 }
        );
      }
    }

    // Use case 2: Cancelled trainee reapplying - reset their old data
    if (resetCancelledTrainee) {
      // Check if user has "Cancelled Trainee" status
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userStatus: true, role: true },
      });

      if (user?.userStatus !== "Cancelled Trainee") {
        return NextResponse.json(
          { error: "User is not a cancelled trainee" },
          { status: 400 }
        );
      }

      // Delete all old training sessions, checkrides for this user's cancelled trainings
      const oldTrainings = await prisma.training.findMany({
        where: { 
          traineeId: userId,
          status: "ABGEBROCHEN"
        },
        select: { id: true },
      });

      // Delete old cancelled trainings (this will cascade delete sessions, checkrides, etc.)
      await prisma.training.deleteMany({
        where: { 
          traineeId: userId,
          status: "ABGEBROCHEN"
        },
      });

      // Reset user status to allow reapplication
      await prisma.user.update({
        where: { id: userId },
        data: { 
          userStatus: null,
          role: "VISITOR" // They'll get PENDING_TRAINEE when registration is approved
        },
      });

      return NextResponse.json(
        { success: true, message: "Old training data reset successfully. You can now reapply." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid request parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in drop route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
