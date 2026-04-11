import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTopicCoverage } from "@/lib/topicCoverage";

const db = prisma as any;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const isMentor =
      userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

    if (!isMentor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessionRecord = await db.trainingSession.findUnique({
      where: { id },
      include: {
        createdByMentor: {
          select: { id: true, name: true, cid: true },
        },
        topics: {
          orderBy: { order: "asc" },
        },
        training: {
          include: {
            mentors: {
              select: { mentorId: true },
            },
            trainee: {
              select: { id: true, cid: true, name: true },
            },
          },
        },
      },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const isLeadership = ["PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(userRole);
    const isAssignedMentor = (sessionRecord.training.mentors || []).some((m: any) => m.mentorId === userId);

    if (!isLeadership && !isAssignedMentor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...sessionRecord,
      topics: (sessionRecord.topics || []).map((topic: any) => normalizeTopicCoverage(topic)),
    });
  } catch (error: any) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { comments } = body;

    const userRole = (session.user as any).role;
    const isMentor =
      userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

    if (!isMentor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessionRecord = await db.trainingSession.findUnique({
      where: { id },
      include: { training: true },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Update comments
    const updated = await db.trainingSession.update({
      where: { id },
      data: { comments },
      include: {
        topics: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const isMentor =
      userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

    if (!isMentor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessionRecord = await db.trainingSession.findUnique({
      where: { id },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only allow deletion of draft sessions
    if (!sessionRecord.isDraft) {
      return NextResponse.json(
        { error: "Cannot delete published sessions" },
        { status: 403 }
      );
    }

    // Delete the session (topics will be cascade deleted)
    await db.trainingSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
