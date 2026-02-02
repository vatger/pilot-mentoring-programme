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
    console.log(`[Assessment GET] userId=${userId}, role=${role}`);

    const checkrideId = request.nextUrl.searchParams.get("checkrideId");
    if (!checkrideId) {
      return NextResponse.json({ error: "checkrideId is required" }, { status: 400 });
    }

    const checkride = await db.checkride.findUnique({
      where: { id: checkrideId },
      include: {
        assessment: true,
        availability: true,
        training: {
          include: { mentors: true },
        },
      },
    });
    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    // Permission: examiner, admin/le/w PMP_PRÜFER, mentor of training, trainee (but only after release)
    const training = checkride.training;
    const isMentor = training.mentors?.some((m: any) => m.mentorId === userId) ?? false;
    const isTrainee = training.traineeId === userId;
    const isExaminerUser = checkride.availability.examinerId === userId || isExaminer(role);
    console.log(`[Assessment GET] isMentor=${isMentor}, isTrainee=${isTrainee}, isExaminerUser=${isExaminerUser}, examinerId=${checkride.availability.examinerId}`);

    if (!isMentor && !isTrainee && !isExaminerUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Trainee cannot see draft (but mentors and examiners can)
    if (isTrainee && !isMentor && !isExaminerUser && checkride.isDraft) {
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

    const checkrideUpdate: any = {
      result: (overallResult as any) || "INCOMPLETE",
    };

    if (release === true) {
      checkrideUpdate.isDraft = false;
      checkrideUpdate.releasedAt = new Date();
    } else if (release === false) {
      checkrideUpdate.isDraft = true;
      checkrideUpdate.releasedAt = null;
    }

    const updatedCheckride = await db.checkride.update({
      where: { id: checkrideId },
      data: checkrideUpdate,
      include: { assessment: true, availability: true, training: true },
    });

    // If checkride passed and released, update trainee status
    if (release === true && overallResult === "PASSED") {
      const training = await db.training.findUnique({
        where: { id: checkride.trainingId },
        select: { traineeId: true },
      });
      
      if (training) {
        // Update training status to COMPLETED
        await db.training.update({
          where: { id: checkride.trainingId },
          data: { status: "COMPLETED" },
        });
        
        // Update trainee userStatus and role
        await db.user.update({
          where: { id: training.traineeId },
          data: { 
            userStatus: "Completed Trainee",
            role: "COMPLETED_TRAINEE"
          },
        });
      }
    }

    // If checkride failed and released, remove readyForCheckride flag
    if (release === true && overallResult === "FAILED") {
      await db.training.update({
        where: { id: checkride.trainingId },
        data: { readyForCheckride: false },
      });
    }

    return NextResponse.json({ assessment, checkride: updatedCheckride }, { status: 200 });
  } catch (error) {
    console.error("Error saving assessment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
