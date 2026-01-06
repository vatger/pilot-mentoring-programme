import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const userId = (session.user as any).id;
    const isMentor =
      userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN";

    if (!isMentor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        trainee: {
          select: {
            id: true,
            cid: true,
            name: true,
            email: true,
          },
        },
        mentors: {
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                cid: true,
              },
            },
          },
        },
        sessions: {
          orderBy: { sessionDate: "desc" },
          include: {
            topics: {
              select: {
                topic: true,
                checked: true,
              },
            },
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    // Verify the user is a mentor for this training
    const isMentorForTraining = training.mentors.some(
      (tm) => tm.mentor.id === userId
    );

    if (!isMentorForTraining && userRole !== "PMP_LEITUNG" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not a mentor for this trainee" },
        { status: 403 }
      );
    }

    return NextResponse.json(training);
  } catch (error: any) {
    console.error("Error fetching training:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
