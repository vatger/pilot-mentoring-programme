import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const trainingId = searchParams.get("trainingId");

    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId is required" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        mentors: {
          select: { mentorId: true },
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const isTrainee = training.traineeId === userId;
    const isAssignedMentor = training.mentors.some((m) => m.mentorId === userId);
    const isLeadership = ["ADMIN", "PMP_LEITUNG"].includes(userRole);

    if (!isTrainee && !isAssignedMentor && !isLeadership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checkrides = await prisma.checkride.findMany({
      where: { trainingId },
      orderBy: { scheduledDate: "desc" },
      include: {
        availability: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            examiner: {
              select: {
                id: true,
                name: true,
                cid: true,
              },
            },
          },
        },
        assessment: true,
      },
    });

    if (checkrides.length === 0) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    const sanitized = checkrides.map((checkride) => {
      if (isTrainee && checkride.isDraft) {
        return { ...checkride, assessment: null };
      }
      return checkride;
    });

    return NextResponse.json({
      latestCheckride: sanitized[0],
      checkrides: sanitized,
    });
  } catch (error: any) {
    console.error("Error fetching checkride:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
