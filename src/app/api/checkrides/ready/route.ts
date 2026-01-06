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
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    const { trainingId, ready } = await request.json();
    if (!trainingId) {
      return NextResponse.json({ error: "trainingId is required" }, { status: 400 });
    }

    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { mentors: true },
    });
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const isMentor = training.mentors.some((m) => m.mentorId === userId);
    if (!isMentor && !["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.training.update({
      where: { id: trainingId },
      data: { readyForCheckride: ready === false ? false : true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error setting ready for checkride:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
