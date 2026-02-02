import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const db = prisma as any;

/**
 * POST /api/checkrides/book
 * Body: { trainingId, availabilityId }
 * Trainee books an available slot after mentor marks readyForCheckride.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const { trainingId, availabilityId } = await request.json();
    if (!trainingId || !availabilityId) {
      return NextResponse.json({ error: "trainingId and availabilityId are required" }, { status: 400 });
    }

    const training = await db.training.findUnique({
      where: { id: trainingId },
      select: { id: true, traineeId: true, readyForCheckride: true },
    });
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }
    if (training.traineeId !== userId && !["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!training.readyForCheckride) {
      return NextResponse.json({ error: "Training not marked ready for checkride" }, { status: 400 });
    }

    // Check if trainee has already passed a checkride for this training
    const passedCheckride = await db.checkride.findFirst({
      where: {
        trainingId,
        result: "PASSED",
      },
    });
    if (passedCheckride) {
      return NextResponse.json({ error: "Cannot rebook - checkride already passed" }, { status: 400 });
    }

    const availability = await db.checkrideAvailability.findUnique({
      where: { id: availabilityId },
    });
    if (!availability || availability.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Slot not available" }, { status: 400 });
    }

    // Ensure no existing booking for this training
    const existing = await db.checkride.findFirst({ where: { trainingId } });
    if (existing) {
      return NextResponse.json({ error: "Checkride already scheduled" }, { status: 400 });
    }

    const checkride = await db.checkride.create({
      data: {
        traineeId: training.traineeId,
        trainingId: training.id,
        availabilityId,
        scheduledDate: availability.startTime,
        result: "INCOMPLETE",
        isDraft: true,
      },
      include: { availability: true },
    });

    await db.checkrideAvailability.update({
      where: { id: availabilityId },
      data: { status: "BOOKED" },
    });

    return NextResponse.json(checkride, { status: 201 });
  } catch (error) {
    console.error("Error booking checkride:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
