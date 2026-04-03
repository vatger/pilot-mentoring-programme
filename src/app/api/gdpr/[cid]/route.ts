import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/gdpr/[cid]
 * Retrieve all data for a user (VATSIM ID)
 * Authentication: Authorization header with GDPR_TOKEN
 * Returns: 200 with user data (JSON), or 404 if user not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
    const customTokenHeader = request.headers.get("x-gdpr-token")?.trim();
    const gdprToken = process.env.GDPR_TOKEN;

    if (!gdprToken) {
      return NextResponse.json(
        { error: "GDPR token not configured" },
        { status: 500 }
      );
    }

    if (!authHeader && !customTokenHeader) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 }
      );
    }

    const expectedToken = gdprToken.trim().replace(/^['\"]|['\"]$/g, "");
    const normalizedHeader = authHeader?.trim() ?? "";
    const headerMatch = normalizedHeader.match(/^(token|bearer)\s+(.+)$/i);
    const providedToken = (customTokenHeader ?? headerMatch?.[2] ?? normalizedHeader).trim();

    if (providedToken !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { cid } = await params;

    const user = await prisma.user.findUnique({
      where: { cid },
    });

    if (!user) {
      const registration = await prisma.registration.findUnique({
        where: { cid },
      });

      if (!registration) {
        return NextResponse.json(
          { message: "No user data found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          user: null,
          registration,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Fetch all related records for this user
    const [accounts, sessions, trainingsAsTrainee, trainingsAsMentor, registration] = await Promise.all([
      prisma.account.findMany({ where: { userId: user.id } }),
      prisma.session.findMany({ where: { userId: user.id } }),
      prisma.training.findMany({
        where: { traineeId: user.id },
        include: {
          mentors: {
            include: { mentor: true },
          },
          sessions: {
            include: { topics: true },
          },
        },
      }),
      prisma.trainingMentor.findMany({
        where: { mentorId: user.id },
        include: {
          training: {
            include: {
              trainee: true,
              sessions: { include: { topics: true } },
            },
          },
        },
      }),
      prisma.registration.findUnique({
        where: { cid },
      }),
    ]);

    // Compile all data
    const userData = {
      user: {
        ...user,
        accounts,
        sessions,
        trainingsAsTrainee,
        trainingsAsMentor,
      },
      registration,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("GDPR data retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
