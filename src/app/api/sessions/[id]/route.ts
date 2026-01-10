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
    const { comments } = body;

    const userRole = (session.user as any).role;
    const isMentor =
      userRole === "MENTOR" || userRole === "PMP_LEITUNG" || userRole === "ADMIN" || userRole === "PMP_PRÜFER";

    if (!isMentor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessionRecord = await prisma.trainingSession.findUnique({
      where: { id },
      include: { training: true },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Update comments
    const updated = await prisma.trainingSession.update({
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
