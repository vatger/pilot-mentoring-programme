import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trainingTopicKeys, trainingTopics } from "@/lib/trainingTopics";
import { TrainingStatus } from "@prisma/client";

// GET /api/admin/tracking
// Returns coverage per trainee (topics covered) for ADMIN and PMP_LEITUNG
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const allowedRoles = ["ADMIN", "PMP_LEITUNG"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const statusParam = request.nextUrl.searchParams.get("status");
    const status = statusParam as TrainingStatus | null;

    const trainings = await prisma.training.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        trainee: {
          select: { id: true, name: true, cid: true },
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

    const topicKeys = trainingTopicKeys;
    const topicCategoryMap = new Map(trainingTopics.map((topic) => [topic.key, topic.category] as const));

    const result = trainings.map((training) => {
      const coverageByTopic = new Map<string, { theorie: boolean; praxis: boolean }>();

      training.sessions.forEach((s) => {
        s.topics.forEach((t) => {
          if (!t.checked || !topicKeys.includes(t.topic as (typeof topicKeys)[number])) return;

          const current = coverageByTopic.get(t.topic) || { theorie: false, praxis: false };

          current.theorie =
            current.theorie ||
            !!(t as any).theoryCovered ||
            (!(t as any).theoryCovered && !(t as any).practiceCovered && ((t as any).coverageMode || "THEORIE") === "THEORIE");

          current.praxis =
            current.praxis ||
            !!(t as any).practiceCovered ||
            (!(t as any).theoryCovered && !(t as any).practiceCovered && ((t as any).coverageMode === "PRAXIS" || !(t as any).coverageMode));

          coverageByTopic.set(t.topic, current);
        });
      });

      let progressPoints = 0;
      trainingTopics.forEach((topic) => {
        const topicCoverage = coverageByTopic.get(topic.key) || { theorie: false, praxis: false };

        if (topic.category === "THEORY") {
          if (topicCoverage.theorie) progressPoints += 1;
          return;
        }

        if (topicCoverage.theorie) progressPoints += 0.5;
        if (topicCoverage.praxis) progressPoints += 0.5;
      });

      return {
        trainingId: training.id,
        status: training.status,
        trainee: training.trainee,
        mentors: training.mentors.map((m) => m.mentor),
        sessionsCount: training.sessions.length,
        topicsCoveredCount: progressPoints,
        topicsCoverage: topicKeys.map((topicKey) => ({
          topic: topicKey,
          covered:
            !!coverageByTopic.get(topicKey)?.theorie ||
            !!coverageByTopic.get(topicKey)?.praxis,
          category: topicCategoryMap.get(topicKey) || "PRACTICE",
          theorie: !!coverageByTopic.get(topicKey)?.theorie,
          praxis: !!coverageByTopic.get(topicKey)?.praxis,
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
