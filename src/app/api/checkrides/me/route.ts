import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/checkrides/me
// Returns trainee's active training, active checkride (if any) and released assessment.
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Find active training for this trainee
    const training = await prisma.training.findFirst({
      where: { traineeId: userId, status: { not: "ABGEBROCHEN" } },
      include: {
        checkrides: {
          orderBy: { createdAt: "desc" },
          include: {
            availability: {
              include: {
                examiner: { select: { id: true, name: true, cid: true } },
              },
            },
            assessment: true,
          },
          take: 1,
        },
      },
    });

    const booking = training?.checkrides?.[0] ?? null;
    const releasedAssessment = booking && !booking.isDraft ? booking.assessment : null;

    return NextResponse.json(
      {
        training,
        booking,
        assessment: releasedAssessment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching trainee checkride data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
