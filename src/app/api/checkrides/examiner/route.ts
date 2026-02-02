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

    // All examiner slots (not just this examiner's)
    const slots = await prisma.checkrideAvailability.findMany({
      where: {},
      orderBy: { startTime: "asc" },
      include: {
        examiner: { select: { id: true, cid: true, name: true } },
      },
    });

    // All booked checkrides (not just this examiner's), exclude PASSED
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    // Delete old incomplete checkrides (>2 days old with INCOMPLETE status)
    await prisma.checkride.deleteMany({
      where: {
        result: "INCOMPLETE",
        scheduledDate: { lt: twoDaysAgo },
      },
    });

    const checkrides = await prisma.checkride.findMany({
      where: { 
        result: { not: "PASSED" } // Hide passed exams
      },
      include: {
        availability: {
          include: {
            examiner: { select: { id: true, cid: true, name: true } },
          },
        },
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
