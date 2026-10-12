import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EXAMINER_ROLES = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR"];
const db = prisma as any;

function isExaminer(role?: string) {
  return role ? EXAMINER_ROLES.includes(role) : false;
}

function toDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * PATCH /api/checkrides/[id]
 * Update agreed scheduling information for a checkride.
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

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    const { id: checkrideId } = await params;
    const checkride = await db.checkride.findUnique({
      where: { id: checkrideId },
      include: { training: { include: { mentors: true } } },
    });

    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    const isAssignedMentor = checkride.training.mentors.some((mentor: any) => mentor.mentorId === userId);
    if (!isAssignedMentor && !isExaminer(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const agreedDateTime = toDateOrNull(body?.agreedDateTime ?? body?.scheduledDate ?? body?.dateTime);

    if (body?.agreedDateTime !== null && body?.agreedDateTime !== undefined && agreedDateTime === null) {
      return NextResponse.json({ error: "agreedDateTime must be a valid date string" }, { status: 400 });
    }

    const updated = await db.checkride.update({
      where: { id: checkrideId },
      data: {
        agreedDateTime,
      },
      include: {
        availability: {
          include: {
            examiner: { select: { id: true, name: true, cid: true } },
          },
        },
        trainee: { select: { id: true, cid: true, name: true } },
        assessment: true,
        mentorAssessment: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating checkride schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/checkrides/[id]
 * Cancel a planned checkride (examiner can cancel any INCOMPLETE checkride)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (!isExaminer(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: checkrideId } = await params;

    // Get the checkride
    const checkride = await db.checkride.findUnique({
      where: { id: checkrideId },
      include: { availability: true },
    });

    if (!checkride) {
      return NextResponse.json({ error: "Checkride not found" }, { status: 404 });
    }

    // Only allow cancelling INCOMPLETE checkrides
    if (checkride.result !== "INCOMPLETE") {
      return NextResponse.json(
        { error: "Can only cancel incomplete checkrides" },
        { status: 400 }
      );
    }

    // Delete the checkride
    await db.checkride.delete({
      where: { id: checkrideId },
    });

    // Set availability back to AVAILABLE
    await db.checkrideAvailability.update({
      where: { id: checkride.availabilityId },
      data: { status: "AVAILABLE" },
    });

    return NextResponse.json(
      { success: true, message: "Checkride cancelled" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling checkride:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
