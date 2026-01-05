import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sessions
 * Create or update a training session with topic checkmarks and comments
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

    const { trainingId, sessionDate, comments, checkedTopics } =
      await request.json();

    if (!trainingId || !sessionDate || !Array.isArray(checkedTopics)) {
      return NextResponse.json(
        { error: "trainingId, sessionDate, and checkedTopics array are required" },
        { status: 400 }
      );
    }

    // Verify the training exists and requester is a mentor
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: { mentors: true },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const isMentor = training.mentors.some((m) => m.mentorId === userId);
    if (!isMentor && !["ADMIN", "PMP_LEITUNG"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only mentors can log sessions" },
        { status: 403 }
      );
    }

    // Create training session
    const trainingSession = await prisma.trainingSession.create({
      data: {
        trainingId,
        sessionDate: new Date(sessionDate),
        comments: comments || null,
        topics: {
          create: checkedTopics.map(
            (topic: { topic: string; checked: boolean; order: number }) => ({
              topic: topic.topic,
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

    return NextResponse.json(trainingSession, { status: 201 });
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
    const sessions = await prisma.trainingSession.findMany({
      where: { trainingId },
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
