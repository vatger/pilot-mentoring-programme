import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EXAMINER_ROLES = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR"];
const db = prisma as any;

function isExaminer(role?: string) {
  return role ? EXAMINER_ROLES.includes(role) : false;
}

// GET /api/checkrides/assessment?checkrideId=...
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const checkrideId = request.nextUrl.searchParams.get("checkrideId");
    if (!checkrideId) {
      return NextResponse.json({ error: "checkrideId is required" }, { status: 400 });
    }

    const checkride = await db.checkride.findUnique({
      where: { id: checkrideId },
      include: {
        assessment: true,
        availability: true,
        training: true,
      },
    });
    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    // Permission: examiner, admin/le/w PMP_PRÜFER, mentor of training, trainee (but only after release)
    const training = await prisma.training.findUnique({
      where: { id: checkride.trainingId },
      include: { mentors: true },
    });
    const isMentor = training?.mentors.some((m) => m.mentorId === userId) ?? false;
    const isTrainee = training?.traineeId === userId;
    const isExaminerUser = checkride.availability.examinerId === userId || isExaminer(role);

    if (!isMentor && !isTrainee && !isExaminerUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Trainee cannot see draft
    if (isTrainee && checkride.isDraft) {
      return NextResponse.json({ error: "Assessment not released yet" }, { status: 403 });
    }

    return NextResponse.json(checkride, { status: 200 });
  } catch (error) {
    console.error("Error fetching assessment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/checkrides/assessment
// Body: { checkrideId, release?: boolean, ...assessmentFields }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const body = await request.json();
    const { checkrideId, release, overallResult, examinernotes, ...rest } = body;
    if (!checkrideId) {
      return NextResponse.json({ error: "checkrideId is required" }, { status: 400 });
    }

    const checkride = await db.checkride.findUnique({
      where: { id: checkrideId },
      include: { availability: true, training: { include: { mentors: true } } },
    });
    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    const isExaminerUser = checkride.availability.examinerId === userId || isExaminer(role);
    if (!isExaminerUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Upsert assessment
    const assessment = await db.checkrideAssessment.upsert({
      where: { checkrideId },
      create: {
        checkrideId,
        overallResult: (overallResult as any) || "INCOMPLETE",
        examinernotes: examinernotes || null,
        ...rest,
      },
      update: {
        overallResult: (overallResult as any) || "INCOMPLETE",
        examinernotes: examinernotes || null,
        ...rest,
      },
    });

    const updatedCheckride = await db.checkride.update({
      where: { id: checkrideId },
      data: {
        isDraft: release === true ? false : true,
        releasedAt: release === true ? new Date() : null,
        result: (overallResult as any) || "INCOMPLETE",
      },
      include: { assessment: true, availability: true },
    });

    return NextResponse.json({ assessment, checkride: updatedCheckride }, { status: 200 });
  } catch (error) {
    console.error("Error saving assessment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
