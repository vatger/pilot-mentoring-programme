import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { readyForCheckride, checkrideRequestText } = body;

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const isMentor =
      userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

    if (!isMentor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify user is a mentor for this training
    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        mentors: {
          select: { mentor: { select: { id: true } } },
        },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const isMentorForTraining = training.mentors.some(
      (tm) => tm.mentor.id === userId
    );

    if (!isMentorForTraining && userRole !== "PMP_LEITUNG" && userRole !== "ADMIN" && userRole !== "PMP_PRÜFER") {
      return NextResponse.json(
        { error: "You are not a mentor for this trainee" },
        { status: 403 }
      );
    }

    const requestText = typeof checkrideRequestText === "string" ? checkrideRequestText.trim() : "";

    if (readyForCheckride === true && requestText.length === 0) {
      return NextResponse.json(
        { error: "checkrideRequestText is required when marking ready" },
        { status: 400 }
      );
    }

    // Update the readyForCheckride status and mentor request info
    const updated = await prisma.training.update({
      where: { id },
      data: {
        readyForCheckride,
        checkrideRequestText: readyForCheckride ? requestText : null,
        checkrideRequestedAt: readyForCheckride ? new Date() : null,
      } as any,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating checkride status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
