import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyPendingMentorAssignments, ExistingTrainingError } from "@/lib/mentorAssignment";
import { sendMentorAssignmentNotification } from "@/lib/mentorAssignmentNotification";

const MANAGER_ROLES = ["ADMIN", "PMP_LEITUNG"];
const MENTOR_ROLES = ["MENTOR", "PMP_LEITUNG", "PMP_PRÜFER", "ADMIN"];

async function getManagerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (session.user as any).role;
  if (!MANAGER_ROLES.includes(role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user: session.user };
}

export async function GET() {
  try {
    const auth = await getManagerSession();
    if ("response" in auth) return auth.response;

    const [assignments, mentors] = await Promise.all([
      prisma.pendingMentorAssignment.findMany({
        include: { mentor: { select: { id: true, name: true, cid: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { role: "MENTOR" },
            { role: "PMP_LEITUNG" },
            { role: "PMP_PRÜFER" },
            { role: "ADMIN" },
          ],
        },
        select: { id: true, name: true, cid: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ assignments, mentors });
  } catch (error) {
    console.error("Error fetching pending mentor assignments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getManagerSession();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const traineeCid = String(body?.traineeCid || "").trim();
    const mentorId = String(body?.mentorId || "").trim();

    if (!/^\d+$/.test(traineeCid)) {
      return NextResponse.json({ error: "Bitte eine gültige numerische CID eingeben" }, { status: 400 });
    }
    if (!mentorId) {
      return NextResponse.json({ error: "mentorId is required" }, { status: 400 });
    }

    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      select: { id: true, name: true, role: true },
    });
    if (!mentor || !MENTOR_ROLES.includes(mentor.role)) {
      return NextResponse.json({ error: "Ausgewählter Mentor ist nicht verfügbar" }, { status: 400 });
    }
    if (!mentor.name?.trim()) {
      return NextResponse.json({ error: "Für den ausgewählten Mentor ist kein Name hinterlegt" }, { status: 400 });
    }

    const existingTrainee = await prisma.user.findUnique({
      where: { cid: traineeCid },
      select: { id: true, name: true, role: true },
    });

    if (existingTrainee) {
      const existingTrainings = await prisma.training.findMany({
        where: { traineeId: existingTrainee.id },
        include: {
          mentors: {
            include: { mentor: { select: { name: true, cid: true } } },
          },
        },
      });

      if (existingTrainings.length > 0) {
        const mentorNames = Array.from(new Set(existingTrainings.flatMap((training) =>
          training.mentors.map(
            ({ mentor: assignedMentor }) =>
              assignedMentor.name || (assignedMentor.cid ? `CID ${assignedMentor.cid}` : "Unbekannt")
          )
        )));
        throw new ExistingTrainingError(mentorNames);
      }
    }

    if (existingTrainee && !["VISITOR", "PENDING_TRAINEE", "TRAINEE"].includes(existingTrainee.role)) {
      return NextResponse.json(
        { error: "Diese CID gehört nicht zu einem zuweisbaren Trainee-Konto" },
        { status: 409 }
      );
    }

    await prisma.pendingMentorAssignment.upsert({
      where: { traineeCid_mentorId: { traineeCid, mentorId } },
      create: { traineeCid, mentorId },
      update: {},
    });

    const trainee = existingTrainee || await prisma.user.findUnique({
      where: { cid: traineeCid },
      select: { id: true, name: true, role: true },
    });

    let assignmentStatus: "pending" | "assigned" = "pending";
    if (trainee) {
      await applyPendingMentorAssignments(traineeCid, trainee.id);
      assignmentStatus = "assigned";
    }

    let notificationWarning: string | undefined;
    try {
      await sendMentorAssignmentNotification({
        traineeCid,
        hasAccount: Boolean(trainee),
        traineeName: trainee?.name || null,
        mentorName: mentor.name.trim(),
      });
    } catch (notificationError) {
      notificationWarning =
        notificationError instanceof Error
          ? notificationError.message
          : "Unbekannter Fehler beim Versand der Benachrichtigung";
      console.error("Mentor assignment notification failed:", notificationError);
    }

    return NextResponse.json(
      { status: assignmentStatus, notificationWarning },
      { status: assignmentStatus === "pending" ? 201 : 200 }
    );
  } catch (error) {
    console.error("Error assigning mentor by CID:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = error instanceof ExistingTrainingError || message.includes("maximal drei")
      ? 409
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getManagerSession();
    if ("response" in auth) return auth.response;

    const { id } = await request.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await prisma.pendingMentorAssignment.deleteMany({ where: { id } });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Vormerkung nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pending mentor assignment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
