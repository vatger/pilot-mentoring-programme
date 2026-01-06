import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EXAMINER_ROLES = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR"];

// GET /api/checkrides/examiner
// Returns examiner's slots and any booked checkrides with trainee info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role;
    const examinerId = (session.user as any).id;

    if (!EXAMINER_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Slots owned by examiner
    const slots = await prisma.checkrideAvailability.findMany({
      where: { examinerId },
      orderBy: { startTime: "asc" },
    });

    // Booked checkrides for this examiner
    const checkrides = await prisma.checkride.findMany({
      where: { availability: { examinerId } },
      include: {
        availability: true,
        trainee: { select: { id: true, cid: true, name: true } },
        assessment: true,
      },
      orderBy: { scheduledDate: "asc" },
    });

    return NextResponse.json({ slots, checkrides }, { status: 200 });
  } catch (error) {
    console.error("Error fetching examiner data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
