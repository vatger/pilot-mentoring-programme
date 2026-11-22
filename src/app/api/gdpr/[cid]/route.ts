import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest): boolean {
  const gdprToken = process.env.GDPR_TOKEN;
  if (!gdprToken) {
    throw new Error("GDPR token not configured");
  }

  const authHeader = request.headers.get("authorization");
  const customTokenHeader = request.headers.get("x-gdpr-token")?.trim();
  const expectedToken = gdprToken.trim().replace(/^['"]|['"]$/g, "");
  const headerMatch = authHeader?.trim().match(/^(token|bearer)\s+(.+)$/i);
  const providedToken = (customTokenHeader ?? headerMatch?.[2] ?? authHeader ?? "").trim();

  return providedToken === expectedToken;
}

/**
 * GET /api/gdpr/[cid]
 * Retrieve data associated with a VATSIM CID.
 * Authentication: Authorization header with GDPR_TOKEN or x-gdpr-token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    if (!process.env.GDPR_TOKEN) {
      return NextResponse.json({ error: "GDPR token not configured" }, { status: 500 });
    }

    if (!isAuthorized(request)) {
      const hasAuth =
        request.headers.has("authorization") || request.headers.has("x-gdpr-token");
      return NextResponse.json(
        { error: hasAuth ? "Invalid token" : "Missing authorization" },
        { status: 401 }
      );
    }

    const { cid } = await params;
    const user = await prisma.user.findUnique({ where: { cid } });

    const [registration, mentorInvitesByCid, pendingAssignmentsByCid] = await Promise.all([
      prisma.registration.findUnique({ where: { cid } }),
      prisma.mentorInvite.findMany({
        where: { traineeCid: cid },
        include: { mentor: { select: { cid: true, name: true } } },
      }),
      prisma.pendingMentorAssignment.findMany({
        where: { traineeCid: cid },
        include: { mentor: { select: { cid: true, name: true } } },
      }),
    ]);

    if (!user) {
      if (!registration && mentorInvitesByCid.length === 0 && pendingAssignmentsByCid.length === 0) {
        return NextResponse.json({ message: "No user data found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          user: null,
          registration,
          mentorInvitesByCid,
          pendingAssignmentsByCid,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const [
      accounts,
      sessions,
      trainingsAsTrainee,
      trainingsAsMentor,
      authoredTrainingSessions,
      checkridesAsTrainee,
      checkridesAsMentor,
      checkrideMentorAssessments,
      authoredCheckrideMentorNotes,
      authoredCheckrideRequests,
      authoredCancellations,
      examinerAvailabilities,
      mentorInvitesAsMentor,
      pendingAssignmentsAsMentor,
    ] = await Promise.all([
      prisma.account.findMany({ where: { userId: user.id } }),
      prisma.session.findMany({ where: { userId: user.id } }),
      prisma.training.findMany({
        where: { traineeId: user.id },
        include: {
          mentors: { include: { mentor: true } },
          sessions: { include: { topics: true } },
        },
      }),
      prisma.trainingMentor.findMany({
        where: { mentorId: user.id },
        include: {
          training: {
            include: { trainee: true },
          },
        },
      }),
      prisma.trainingSession.findMany({
        where: { createdByMentorId: user.id },
        include: {
          topics: true,
          training: {
            select: {
              id: true,
              status: true,
              trainee: { select: { cid: true, name: true } },
            },
          },
        },
      }),
      prisma.checkride.findMany({
        where: { traineeId: user.id },
        include: {
          availability: {
            include: { examiner: { select: { cid: true, name: true } } },
          },
          training: {
            include: {
              mentors: { include: { mentor: { select: { cid: true, name: true } } } },
              sessions: { include: { topics: true } },
            },
          },
          assessment: true,
          mentorAssessment: true,
        },
      }),
      prisma.checkride.findMany({
        where: { training: { mentors: { some: { mentorId: user.id } } } },
        include: {
          availability: {
            include: { examiner: { select: { cid: true, name: true } } },
          },
          training: {
            select: {
              id: true,
              status: true,
              trainee: { select: { cid: true, name: true } },
            },
          },
          assessment: true,
          mentorAssessment: true,
        },
      }),
      prisma.checkrideMentorAssessment.findMany({
        where: { mentorId: user.id },
        include: {
          checkride: {
            include: {
              training: {
                select: {
                  id: true,
                  trainee: { select: { cid: true, name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.checkrideAssessment.findMany({
        where: { mentorNotesAuthorId: user.id },
        include: {
          checkride: {
            include: {
              training: {
                select: {
                  id: true,
                  trainee: { select: { cid: true, name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.training.findMany({
        where: { checkrideRequestAuthorId: user.id },
        include: { trainee: { select: { cid: true, name: true } } },
      }),
      prisma.training.findMany({
        where: { cancellationReasonAuthorId: user.id },
        include: { trainee: { select: { cid: true, name: true } } },
      }),
      prisma.checkrideAvailability.findMany({
        where: { examinerId: user.id },
        include: {
          checkride: {
            include: {
              training: {
                select: {
                  id: true,
                  trainee: { select: { cid: true, name: true } },
                },
              },
              assessment: true,
              mentorAssessment: true,
            },
          },
        },
      }),
      prisma.mentorInvite.findMany({
        where: { mentorId: user.id },
        include: { mentor: { select: { cid: true, name: true } } },
      }),
      prisma.pendingMentorAssignment.findMany({
        where: { mentorId: user.id },
        include: { mentor: { select: { cid: true, name: true } } },
      }),
    ]);

    const safeAccounts = accounts.map(
      ({ access_token, refresh_token, id_token, session_state, ...account }) => ({
        ...account,
        credentials: {
          accessTokenStored: Boolean(access_token),
          refreshTokenStored: Boolean(refresh_token),
          idTokenStored: Boolean(id_token),
          sessionStateStored: Boolean(session_state),
        },
      })
    );
    const safeSessions = sessions.map(({ sessionToken, ...session }) => ({
      ...session,
      sessionTokenStored: Boolean(sessionToken),
    }));

    return NextResponse.json(
      {
        user: {
          ...user,
          accounts: safeAccounts,
          sessions: safeSessions,
          trainingsAsTrainee,
          trainingsAsMentor,
          authoredTrainingSessions,
          checkridesAsTrainee,
          checkridesAsMentor,
          checkrideMentorAssessments,
          authoredCheckrideMentorNotes,
          authoredCheckrideRequests,
          authoredCancellations,
          examinerAvailabilities,
          mentorInvitesAsMentor,
          pendingAssignmentsAsMentor,
        },
        registration,
        mentorInvitesByCid,
        pendingAssignmentsByCid,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GDPR data retrieval error:", error);
    if (error instanceof Error && error.message === "GDPR token not configured") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
