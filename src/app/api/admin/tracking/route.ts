import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrainingTopic } from "@prisma/client";

// GET /api/admin/tracking
// Returns coverage per trainee (topics covered) for ADMIN and PMP_LEITUNG
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!{"ADMIN": true, "PMP_LEITUNG": true}[role]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get("status") || undefined;

    const trainings = await prisma.training.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        trainee: {
          select: { id: true, name: true, cid: true, email: true },
        },
        mentors: {
          include: {
            mentor: { select: { id: true, name: true, cid: true } },
          },
        },
        sessions: {
          where: { isDraft: false },
          orderBy: { sessionDate: "asc" },
          include: {
            topics: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const topicKeys = Object.values(TrainingTopic);

    const result = trainings.map((training) => {
      const covered = new Set<string>();
      training.sessions.forEach((s) => {
        s.topics.forEach((t) => {
          if (t.checked) covered.add(t.topic);
        });
      });

      return {
        trainingId: training.id,
        status: training.status,
        trainee: training.trainee,
        mentors: training.mentors.map((m) => m.mentor),
        sessionsCount: training.sessions.length,
        topicsCoveredCount: covered.size,
        topicsCoverage: topicKeys.map((topicKey) => ({
          topic: topicKey,
          covered: covered.has(topicKey),
        })),
        lastSessionDate:
          training.sessions.length > 0
            ? training.sessions[training.sessions.length - 1].sessionDate
            : null,
      };
    });

    return NextResponse.json({ trainings: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin tracking data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
