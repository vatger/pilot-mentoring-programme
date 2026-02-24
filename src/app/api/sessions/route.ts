import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trainingTopicKeys, TrainingTopicKey } from "@/lib/trainingTopics";
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
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { trainingId, sessionId, lessonType, sessionDate, comments, whiteboardSessionId, checkedTopics, isDraft } =
      await request.json();

    if (!trainingId || !sessionDate || !Array.isArray(checkedTopics)) {
      return NextResponse.json(
        { error: "trainingId, sessionDate, and checkedTopics array are required" },
        { status: 400 }
      );
    }

    const normalizedLessonType =
      lessonType && ["THEORIE_TRAINING", "OFFLINE_FLUG", "ONLINE_FLUG"].includes(lessonType)
        ? lessonType
        : "THEORIE_TRAINING";

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

    // Sanitize topics to allowed enum values
    const normalizedTopics = (Array.isArray(checkedTopics) ? checkedTopics : []).filter(
      (topic: { topic: string }) => trainingTopicKeys.includes(topic.topic as TrainingTopicKey)
    );

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
          lessonType: normalizedLessonType,
          sessionDate: new Date(sessionDate),
          comments: comments || null,
          whiteboardSessionId: whiteboardSessionId || null,
          isDraft: isDraft !== false, // default true if undefined
          releasedAt: isDraft === false ? new Date() : null,
          topics: {
            create: normalizedTopics.map(
              (topic: {
                topic: string;
                checked?: boolean;
                theoryCovered?: boolean;
                practiceCovered?: boolean;
                comment?: string;
                order: number;
                coverageMode?: string;
              }) => {
                const theoryCovered =
                  topic.theoryCovered !== undefined
                    ? topic.theoryCovered
                    : topic.coverageMode
                    ? topic.coverageMode === "THEORIE"
                    : !!topic.checked;
                const practiceCovered =
                  topic.practiceCovered !== undefined
                    ? topic.practiceCovered
                    : topic.coverageMode
                    ? topic.coverageMode === "PRAXIS"
                    : !!topic.checked;

                return {
                  topic: topic.topic as TrainingTopic,
                  checked: !!(theoryCovered || practiceCovered),
                  coverageMode: topic.coverageMode === "PRAXIS" ? "PRAXIS" : "THEORIE",
                  theoryCovered,
                  practiceCovered,
                  comment: topic.comment || null,
                  order: topic.order,
                };
              }
            ),
          },
        },
        include: { topics: true },
      });
    } else {
      trainingSession = await db.trainingSession.create({
        data: {
          trainingId,
          lessonType: normalizedLessonType,
          sessionDate: new Date(sessionDate),
          comments: comments || null,
          whiteboardSessionId: whiteboardSessionId || null,
          isDraft: isDraft !== false, // default true if undefined
          releasedAt: isDraft === false ? new Date() : null,
          topics: {
            create: normalizedTopics.map(
              (topic: {
                topic: string;
                checked?: boolean;
                theoryCovered?: boolean;
                practiceCovered?: boolean;
                comment?: string;
                order: number;
                coverageMode?: string;
              }) => {
                const theoryCovered =
                  topic.theoryCovered !== undefined
                    ? topic.theoryCovered
                    : topic.coverageMode
                    ? topic.coverageMode === "THEORIE"
                    : !!topic.checked;
                const practiceCovered =
                  topic.practiceCovered !== undefined
                    ? topic.practiceCovered
                    : topic.coverageMode
                    ? topic.coverageMode === "PRAXIS"
                    : !!topic.checked;

                return {
                  topic: topic.topic as TrainingTopic,
                  checked: !!(theoryCovered || practiceCovered),
                  coverageMode: topic.coverageMode === "PRAXIS" ? "PRAXIS" : "THEORIE",
                  theoryCovered,
                  practiceCovered,
                  comment: topic.comment || null,
                  order: topic.order,
                };
              }
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
    const userRole = (session.user as any).role;
    const isMentor = training.mentors.some((m) => m.mentorId === userId);
    const isTrainee = training.traineeId === userId;
    const isAdminOrLeitung = ["ADMIN", "PMP_LEITUNG"].includes(userRole);
    const isExaminer = userRole === "PMP_PRÜFER";

    let examinerHasPlannedCheckride = false;
    if (isExaminer) {
      const checkride = await prisma.checkride.findFirst({
        where: {
          trainingId,
          availability: { examinerId: userId },
        },
      });
      examinerHasPlannedCheckride = !!checkride;
    }

    if (!isMentor && !isTrainee && !isAdminOrLeitung && !examinerHasPlannedCheckride) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const canSeeDrafts = isMentor || isAdminOrLeitung || examinerHasPlannedCheckride;

    // Get all sessions for this training
    // Fallback is needed for environments where db push has not yet applied
    // newer topic columns (theoryCovered/practiceCovered/coverageMode).
    let sessions;
    try {
      sessions = await db.trainingSession.findMany({
        where: {
          trainingId,
          ...(canSeeDrafts ? {} : { isDraft: false }),
        },
        include: {
          topics: { orderBy: { order: "asc" } },
        },
        orderBy: { sessionDate: "desc" },
      });
    } catch (error: any) {
      const errorMessage = String(error?.message || "").toLowerCase();
      const isLegacyColumnIssue =
        errorMessage.includes("theorycovered") ||
        errorMessage.includes("practicecovered") ||
        errorMessage.includes("coveragemode");

      if (!isLegacyColumnIssue) {
        throw error;
      }

      const legacySessions = await db.trainingSession.findMany({
        where: {
          trainingId,
          ...(canSeeDrafts ? {} : { isDraft: false }),
        },
        include: {
          topics: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              topic: true,
              checked: true,
              comment: true,
              order: true,
            },
          },
        },
        orderBy: { sessionDate: "desc" },
      });

      sessions = legacySessions.map((session: any) => ({
        ...session,
        topics: (session.topics || []).map((topic: any) => ({
          ...topic,
          coverageMode: null,
          theoryCovered: undefined,
          practiceCovered: undefined,
        })),
      }));
    }

    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
