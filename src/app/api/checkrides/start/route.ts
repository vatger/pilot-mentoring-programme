import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EXAMINER_ROLES = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (!EXAMINER_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { trainingId } = await request.json();
    if (!trainingId) {
      return NextResponse.json({ error: "trainingId is required" }, { status: 400 });
    }

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        checkrides: {
          where: { result: "INCOMPLETE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    if (!training.readyForCheckride || training.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Training is not ready for checkride" },
        { status: 400 }
      );
    }

    if (training.checkrides.length > 0) {
      return NextResponse.json(
        { checkrideId: training.checkrides[0].id, reused: true },
        { status: 200 }
      );
    }

    const now = new Date();
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const created = await prisma.$transaction(async (tx) => {
      const availability = await tx.checkrideAvailability.create({
        data: {
          examinerId: userId,
          startTime: now,
          endTime: end,
          status: "BOOKED",
        },
      });

      const checkride = await tx.checkride.create({
        data: {
          traineeId: training.traineeId,
          trainingId: training.id,
          availabilityId: availability.id,
          scheduledDate: now,
          result: "INCOMPLETE",
          isDraft: true,
        },
      });

      return checkride;
    });

    return NextResponse.json({ checkrideId: created.id, reused: false }, { status: 201 });
  } catch (error) {
    console.error("Error starting checkride:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
