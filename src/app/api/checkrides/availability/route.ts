import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EXAMINER_ROLES = ["ADMIN", "PMP_LEITUNG", "PMP_PRÜFER", "MENTOR"];
const db = prisma as any;

function isExaminer(role?: string) {
  return role ? EXAMINER_ROLES.includes(role) : false;
}

/**
 * POST /api/checkrides/availability
 * Body: { startTime: string }
 * Creates a 2h availability slot for an examiner.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    const examinerId = (session.user as any).id;
    if (!isExaminer(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { startTime } = await request.json();
    if (!startTime) {
      return NextResponse.json({ error: "startTime is required" }, { status: 400 });
    }
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
    }
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const slot = await db.checkrideAvailability.create({
      data: {
        examinerId,
        startTime: start,
        endTime: end,
        status: "AVAILABLE",
      },
    });
    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("Error creating availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/checkrides/availability?status=AVAILABLE&examinerId=...
 * - Examiners: see their own slots (or filter)
 * - Trainees: only see AVAILABLE future slots
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    const status = request.nextUrl.searchParams.get("status") || undefined;
    const examinerId = request.nextUrl.searchParams.get("examinerId") || undefined;

    const where: any = {};
    if (status) where.status = status as any;
    if (examinerId) where.examinerId = examinerId;

    // Trainees can only see available future slots
    if (!isExaminer(role)) {
      where.status = "AVAILABLE";
      where.startTime = { gte: new Date() };
    } else {
      // Examiners default to own slots if no examinerId provided
      if (!examinerId) {
        where.examinerId = userId;
      }
    }

    const slots = await db.checkrideAvailability.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
