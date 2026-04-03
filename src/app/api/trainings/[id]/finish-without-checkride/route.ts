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
    if (userRole !== "ADMIN" && userRole !== "PMP_LEITUNG") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        trainee: { select: { id: true } },
      },
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTraining = await tx.training.update({
        where: { id },
        data: {
          status: "COMPLETED",
          readyForCheckride: false,
          checkrideRequestText: null,
          checkrideRequestedAt: null,
        },
      });

      await tx.user.update({
        where: { id: training.trainee.id },
        data: {
          userStatus: "Completed Trainee",
          role: "COMPLETED_TRAINEE",
        },
      });

      return updatedTraining;
    });

    return NextResponse.json({ training: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Error finishing training without checkride:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
