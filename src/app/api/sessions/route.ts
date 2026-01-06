import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrainingTopic } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const db = prisma as any;

/**
 * POST /api/sessions
 * Create or update a training session with topic checkmarks and comments
 * Supports draft mode (isDraft) for autosave. When isDraft=false, the session is released
 * and becomes visible to the trainee. Draft sessions are hidden from the trainee.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Only MENTOR, PMP_LEITUNG, and ADMIN can log sessions
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { trainingId, sessionId, sessionDate, comments, whiteboardSessionId, checkedTopics, isDraft } =
      await request.json();

    if (!trainingId || !sessionDate || !Array.isArray(checkedTopics)) {
      return NextResponse.json(
        { error: "trainingId, sessionDate, and checkedTopics array are required" },
        { status: 400 }
      );
    }

    // Verify the training exists and requester is a mentor
    const training = await db.training.findUnique({
      where: { id: trainingId },
      include: { mentors: true },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const isMentor = training.mentors.some((m: any) => m.mentorId === userId);
    if (!isMentor && !["ADMIN", "PMP_LEITUNG"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only mentors can log sessions" },
        { status: 403 }
      );
    }

    // If sessionId provided, update existing; else create new
    let trainingSession;
    if (sessionId) {
      const existing = await db.trainingSession.findUnique({
        where: { id: sessionId },
        include: { training: true },
      });

      if (!existing || existing.trainingId !== trainingId) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      // Replace topics for simplicity
      await db.trainingSessionTopic.deleteMany({ where: { sessionId } });

      trainingSession = await db.trainingSession.update({
        where: { id: sessionId },
        data: {
          sessionDate: new Date(sessionDate),
          comments: comments || null,
          whiteboardSessionId: whiteboardSessionId || null,
          isDraft: isDraft !== false, // default true if undefined
          releasedAt: isDraft === false ? new Date() : null,
          topics: {
            create: checkedTopics.map(
              (topic: { topic: string; checked: boolean; order: number }) => ({
                topic: topic.topic as TrainingTopic,
                checked: topic.checked,
                order: topic.order,
              })
            ),
          },
        },
        include: { topics: true },
      });
    } else {
      trainingSession = await db.trainingSession.create({
        data: {
          trainingId,
          sessionDate: new Date(sessionDate),
          comments: comments || null,
          whiteboardSessionId: whiteboardSessionId || null,
          isDraft: isDraft !== false, // default true if undefined
          releasedAt: isDraft === false ? new Date() : null,
          topics: {
            create: checkedTopics.map(
              (topic: { topic: string; checked: boolean; order: number }) => ({
                topic: topic.topic as TrainingTopic,
                checked: topic.checked,
                order: topic.order,
              })
            ),
          },
        },
        include: {
          topics: true,
        },
      });
    }

    return NextResponse.json(trainingSession, { status: sessionId ? 200 : 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions?trainingId=...
 * Get all sessions for a training (trainee or mentor can view)
 * Trainees only see released sessions (isDraft=false)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trainingId = request.nextUrl.searchParams.get("trainingId");
    if (!trainingId) {
      return NextResponse.json(
        { error: "trainingId is required" },
        { status: 400 }
      );
    }

    // Verify training exists and user is involved
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { mentors: true },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const isMentor = training.mentors.some((m) => m.mentorId === userId);
    const isTrainee = training.traineeId === userId;

    if (!isMentor && !isTrainee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all sessions for this training
    const sessions = await db.trainingSession.findMany({
      where: {
        trainingId,
        ...(isMentor || ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER"].includes((session.user as any).role)
          ? {}
          : { isDraft: false }),
      },
      include: {
        topics: { orderBy: { order: "asc" } },
      },
      orderBy: { sessionDate: "desc" },
    });

    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
