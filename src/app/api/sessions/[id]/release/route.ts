import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const sessionRecord = await prisma.trainingSession.findUnique({
      where: { id },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!sessionRecord.isDraft) {
      return NextResponse.json(
        { error: "Session is already finalized" },
        { status: 400 }
      );
    }

    // Finalize/release the session
    const released = await prisma.trainingSession.update({
      where: { id },
      data: {
        isDraft: false,
        releasedAt: new Date(),
      },
      include: {
        topics: true,
      },
    });

    return NextResponse.json(released);
  } catch (error: any) {
    console.error("Error releasing session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
