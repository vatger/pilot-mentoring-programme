import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const CHECKRIDE_ROLES = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR"];
const db = prisma as any;

function isCheckrideRole(role?: string) {
  return role ? CHECKRIDE_ROLES.includes(role) : false;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return Boolean(value);
}

function normalizeAssessmentPayload(input: Record<string, unknown>) {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (key.endsWith("Passed")) {
      normalized[key] = toBoolean(value);
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

// GET /api/checkrides/mentor-assessment?checkrideId=...
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
        mentorAssessment: true,
        availability: true,
        training: {
          include: { mentors: true },
        },
      },
    });

    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    const isAssignedMentor = checkride.training.mentors?.some((mentor: any) => mentor.mentorId === userId) ?? false;
    const canRead = isAssignedMentor || isCheckrideRole(role);

    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      {
        ...checkride,
        assessment: checkride.mentorAssessment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mentor assessment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/checkrides/mentor-assessment
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
    const { checkrideId, release, overallResult, notes, ...rest } = body;

    if (!checkrideId) {
      return NextResponse.json({ error: "checkrideId is required" }, { status: 400 });
    }

    const checkride = await db.checkride.findUnique({
      where: { id: checkrideId },
      include: { training: { include: { mentors: true } } },
    });

    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    const isAssignedMentor = checkride.training.mentors.some((mentor: any) => mentor.mentorId === userId);
    const canWrite = isAssignedMentor || ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER"].includes(role);

    if (!canWrite) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const mentorOnlyUpdate =
      notes !== undefined &&
      Object.keys(rest).length === 0 &&
      overallResult === undefined &&
      release === undefined;

    if (mentorOnlyUpdate) {
      const assessment = await db.checkrideMentorAssessment.upsert({
        where: { checkrideId },
        create: {
          checkrideId,
          mentorId: userId,
          notes: typeof notes === "string" ? notes : null,
        },
        update: {
          mentorId: userId,
          notes: typeof notes === "string" ? notes : null,
        },
      });

      return NextResponse.json({ assessment, checkride }, { status: 200 });
    }

    const normalizedFields = normalizeAssessmentPayload(rest as Record<string, unknown>);
    const assessmentData: Record<string, unknown> = { ...normalizedFields };
    if (overallResult !== undefined) {
      assessmentData.overallResult = (overallResult as any) || "INCOMPLETE";
    }
    if (notes !== undefined) {
      assessmentData.notes = notes || null;
    }

    const assessment = await db.checkrideMentorAssessment.upsert({
      where: { checkrideId },
      create: {
        checkrideId,
        mentorId: userId,
        overallResult: (overallResult as any) || "INCOMPLETE",
        ...assessmentData,
      },
      update: {
        mentorId: userId,
        ...assessmentData,
      },
    });

    const releaseFlag = typeof release === "string" ? toBoolean(release) : release;

    const updatedAssessment = releaseFlag === true
      ? await db.checkrideMentorAssessment.update({
          where: { checkrideId },
          data: {
            isDraft: false,
            releasedAt: new Date(),
          },
        })
      : releaseFlag === false
      ? await db.checkrideMentorAssessment.update({
          where: { checkrideId },
          data: {
            isDraft: true,
            releasedAt: null,
          },
        })
      : assessment;

    return NextResponse.json({ assessment: updatedAssessment, checkride }, { status: 200 });
  } catch (error) {
    console.error("Error saving mentor assessment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}