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
 * DELETE /api/gdpr-removal/[cid]
 * Delete data associated with a VATSIM CID while preserving other trainees' records.
 * Authentication: Authorization header with GDPR_TOKEN or x-gdpr-token.
 */
export async function DELETE(
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
    const deleted = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { cid },
        select: { id: true },
      });

      const inviteWhere = user
        ? { OR: [{ traineeCid: cid }, { mentorId: user.id }] }
        : { traineeCid: cid };
      const assignmentWhere = user
        ? { OR: [{ traineeCid: cid }, { mentorId: user.id }] }
        : { traineeCid: cid };

      const [registrations, mentorInvites, pendingAssignments] = await Promise.all([
        tx.registration.deleteMany({ where: { cid } }),
        tx.mentorInvite.deleteMany({ where: inviteWhere }),
        tx.pendingMentorAssignment.deleteMany({ where: assignmentWhere }),
      ]);

      if (!user) {
        return {
          registrations: registrations.count,
          mentorInvites: mentorInvites.count,
          pendingAssignments: pendingAssignments.count,
        };
      }

      const authoredSessions = await tx.trainingSession.findMany({
        where: { createdByMentorId: user.id },
        select: { id: true },
      });
      const authoredSessionIds = authoredSessions.map(({ id }) => id);

      if (authoredSessionIds.length > 0) {
        await tx.trainingSessionTopic.updateMany({
          where: { sessionId: { in: authoredSessionIds } },
          data: { comment: null },
        });
        await tx.trainingSession.updateMany({
          where: { id: { in: authoredSessionIds } },
          data: { comments: null, createdByMentorId: null },
        });
      }

      await tx.training.updateMany({
        where: { checkrideRequestAuthorId: user.id },
        data: {
          checkrideRequestText: null,
          checkrideRequestAuthorId: null,
          checkrideRequestedAt: null,
        },
      });
      await tx.training.updateMany({
        where: { cancellationReasonAuthorId: user.id },
        data: {
          cancellationReason: null,
          cancellationReasonAuthorId: null,
          cancellationAt: null,
        },
      });

      const legacyMentorTrainings = await tx.training.findMany({
        where: {
          mentors: { some: { mentorId: user.id } },
          OR: [
            { checkrideRequestText: { not: null }, checkrideRequestAuthorId: null },
            { cancellationReason: { not: null }, cancellationReasonAuthorId: null },
          ],
        },
        select: {
          id: true,
          checkrideRequestText: true,
          checkrideRequestAuthorId: true,
          cancellationReason: true,
          cancellationReasonAuthorId: true,
          mentors: { select: { mentorId: true } },
        },
      });

      const legacyRequestIds: string[] = [];
      const legacyCancellationIds: string[] = [];
      for (const training of legacyMentorTrainings) {
        if (training.mentors.length !== 1 || training.mentors[0].mentorId !== user.id) {
          continue;
        }

        if (training.checkrideRequestText && !training.checkrideRequestAuthorId) {
          legacyRequestIds.push(training.id);
        }
        if (training.cancellationReason && !training.cancellationReasonAuthorId) {
          legacyCancellationIds.push(training.id);
        }
      }

      if (legacyRequestIds.length > 0) {
        await tx.training.updateMany({
          where: { id: { in: legacyRequestIds } },
          data: {
            checkrideRequestText: null,
            checkrideRequestAuthorId: null,
            checkrideRequestedAt: null,
          },
        });
      }
      if (legacyCancellationIds.length > 0) {
        await tx.training.updateMany({
          where: { id: { in: legacyCancellationIds } },
          data: {
            cancellationReason: null,
            cancellationReasonAuthorId: null,
            cancellationAt: null,
          },
        });
      }

      await tx.checkrideMentorAssessment.updateMany({
        where: { mentorId: user.id },
        data: { mentorId: null, notes: null },
      });
      await tx.checkrideAssessment.updateMany({
        where: { mentorNotesAuthorId: user.id },
        data: { mentorNotesAuthorId: null, mentorNotes: null },
      });

      const legacyMentorCheckrides = await tx.checkride.findMany({
        where: { training: { mentors: { some: { mentorId: user.id } } } },
        select: {
          id: true,
          assessment: {
            select: { mentorNotes: true, mentorNotesAuthorId: true },
          },
          training: {
            select: { mentors: { select: { mentorId: true } } },
          },
        },
      });
      const legacyMentorNoteCheckrideIds = legacyMentorCheckrides
        .filter((checkride) =>
          checkride.training.mentors.length === 1 &&
          checkride.training.mentors[0].mentorId === user.id &&
          checkride.assessment?.mentorNotes &&
          !checkride.assessment.mentorNotesAuthorId
        )
        .map(({ id }) => id);
      if (legacyMentorNoteCheckrideIds.length > 0) {
        await tx.checkrideAssessment.updateMany({
          where: { checkrideId: { in: legacyMentorNoteCheckrideIds } },
          data: { mentorNotes: null, mentorNotesAuthorId: null },
        });
      }

      const examinerAvailabilities = await tx.checkrideAvailability.findMany({
        where: { examinerId: user.id },
        select: {
          id: true,
          checkride: { select: { id: true } },
        },
      });
      const linkedAvailabilities = examinerAvailabilities.filter(({ checkride }) => checkride);
      const unlinkedAvailabilityIds = examinerAvailabilities
        .filter(({ checkride }) => !checkride)
        .map(({ id }) => id);

      if (linkedAvailabilities.length > 0) {
        const checkrideIds = linkedAvailabilities.map(({ checkride }) => checkride!.id);
        await tx.checkrideAssessment.updateMany({
          where: { checkrideId: { in: checkrideIds } },
          data: { examinernotes: null },
        });
        await tx.checkrideAvailability.updateMany({
          where: { id: { in: linkedAvailabilities.map(({ id }) => id) } },
          data: { examinerId: null },
        });
      }

      if (unlinkedAvailabilityIds.length > 0) {
        await tx.checkrideAvailability.deleteMany({
          where: { id: { in: unlinkedAvailabilityIds } },
        });
      }

      await tx.user.delete({ where: { id: user.id } });

      return {
        registrations: registrations.count,
        mentorInvites: mentorInvites.count,
        pendingAssignments: pendingAssignments.count,
      };
    });

    return NextResponse.json(
      {
        message: "User data deletion completed successfully",
        deleted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GDPR data deletion error:", error);
    if (error instanceof Error && error.message === "GDPR token not configured") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
