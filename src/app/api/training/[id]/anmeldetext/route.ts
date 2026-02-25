import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/training/[id]/anmeldetext
 * Updates the direct-invite registration text for a trainee.
 * Allowed: assigned mentor, PMP_LEITUNG, ADMIN
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trainingId } = await params;
    const userId = (session.user as any).id as string;
    const userRole = (session.user as any).role as string;

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        trainee: {
          select: {
            cid: true,
          },
        },
        mentors: {
          select: {
            mentorId: true,
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const isAssignedMentor = training.mentors.some((entry) => entry.mentorId === userId);
    const isLeitungOrAdmin = userRole === "PMP_LEITUNG" || userRole === "ADMIN";

    if (!isAssignedMentor && !isLeitungOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const traineeCid = String(training.trainee.cid || "").trim();
    if (!traineeCid) {
      return NextResponse.json({ error: "Trainee CID missing" }, { status: 400 });
    }

    const body = await request.json();
    const anmeldetext = String(body?.anmeldetext || "").trim();

    if (!anmeldetext) {
      return NextResponse.json({ error: "anmeldetext is required" }, { status: 400 });
    }

    const registration = await prisma.registration.findUnique({
      where: { cid: traineeCid },
      select: {
        id: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const updatedRegistration = await prisma.registration.update({
      where: { cid: traineeCid },
      data: {
        experience: anmeldetext,
        other: `Anmeldetext (Mentor-Link):\n${anmeldetext}`,
      },
      select: {
        cid: true,
        experience: true,
        other: true,
        category: true,
      },
    });

    return NextResponse.json({ success: true, registration: updatedRegistration }, { status: 200 });
  } catch (error) {
    console.error("Error updating direct anmeldetext:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
