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
    // Authenticate via Authorization header
    const authHeader = request.headers.get("Authorization");
    const gdprToken = process.env.GDPR_TOKEN;

    if (!authHeader || !gdprToken) {
      return NextResponse.json(
        { error: "Missing or invalid authorization" },
        { status: 401 }
      );
    }

    // Expect: "Token XXXXX"
    const token = authHeader.replace(/^Token\s+/, "");
    if (token !== gdprToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { cid } = await params;

    // Fetch user by CID
    const user = await prisma.user.findUnique({
      where: { cid },
    });

    if (!user) {
      // Also check if there's a registration record (in case user never logged in)
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
