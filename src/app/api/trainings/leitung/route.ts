import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const LEITUNG_ROLES = ["ADMIN", "PMP_LEITUNG"];

// GET /api/trainings/leitung - All trainings for Leitung/Admin with released session topics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!LEITUNG_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden - Only Leitung/Admin" }, { status: 403 });
    }

    const trainings = await prisma.training.findMany({
      include: {
        trainee: {
          select: { id: true, cid: true, name: true },
        },
        mentors: {
          include: {
            mentor: { select: { id: true, name: true, cid: true } },
          },
        },
        sessions: {
          where: { isDraft: false },
          select: {
            id: true,
            topics: {
              select: {
                topic: true,
                checked: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const trainingsWithRegistration = await Promise.all(
      trainings.map(async (training) => {
        const registration = training.trainee.cid
          ? await prisma.registration.findUnique({
              where: { cid: training.trainee.cid },
              select: {
                cid: true,
                name: true,
                rating: true,
                fir: true,
                simulator: true,
                aircraft: true,
                client: true,
                clientSetup: true,
                experience: true,
                charts: true,
                airac: true,
                category: true,
                topics: true,
                schedule: true,
                communication: true,
                personal: true,
                other: true,
              },
            })
          : null;

        return {
          ...training,
          trainee: {
            ...training.trainee,
            registration,
          },
        };
      })
    );

    return NextResponse.json(trainingsWithRegistration, { status: 200 });
  } catch (error) {
    console.error("Error fetching leitung trainings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
