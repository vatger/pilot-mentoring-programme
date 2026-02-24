import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyMentorInviteToken } from "@/lib/mentorInviteToken";

/**
 * POST /api/training/direct-invite/accept
 * Accepts mentor invite link and auto-creates registration + mentor-trainee assignment.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const inviteToken = String(body?.inviteToken || "").trim();

    if (!inviteToken) {
      return NextResponse.json({ error: "inviteToken is required" }, { status: 400 });
    }

    const payload = verifyMentorInviteToken(inviteToken);
    const invite = await prisma.mentorInvite.findUnique({
      where: { id: payload.inviteId },
      select: {
        id: true,
        mentorId: true,
        traineeCid: true,
        anmeldetext: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Einladung nicht gefunden" }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: "Einladung wurde bereits verwendet" }, { status: 409 });
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Einladung ist abgelaufen" }, { status: 400 });
    }

    const sessionCid = String((session.user as any).cid || "").trim();
    const sessionName = (session.user as any).name || "Unknown";
    const sessionRating = (session.user as any).rating || "UNKNOWN";
    const sessionFir = (session.user as any).fir || "";

    if (!sessionCid) {
      return NextResponse.json(
        { error: "Session CID is missing. Please sign in again." },
        { status: 400 }
      );
    }

    if (sessionCid !== invite.traineeCid) {
      return NextResponse.json(
        {
          error:
            "Diese Einladung wurde für eine andere CID erstellt. Bitte melde dich mit der richtigen CID an.",
        },
        { status: 403 }
      );
    }

    const mentor = await prisma.user.findUnique({
      where: { id: invite.mentorId },
      select: { id: true, role: true },
    });

    if (!mentor || !["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(mentor.role)) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const traineeUser = await prisma.user.upsert({
      where: { cid: sessionCid },
      update: {
        name: sessionName,
        role: "TRAINEE",
        userStatus: null,
      },
      create: {
        cid: sessionCid,
        name: sessionName,
        role: "TRAINEE",
      },
      select: { id: true, cid: true, role: true },
    });

    const registration = await prisma.registration.upsert({
      where: { cid: sessionCid },
      update: {
        name: sessionName,
        rating: sessionRating,
        fir: sessionFir,
        simulator: "Siehe Anmeldetext",
        aircraft: "Siehe Anmeldetext",
        client: "Siehe Anmeldetext",
        clientSetup: "Siehe Anmeldetext",
        experience: invite.anmeldetext,
        charts: "Siehe Anmeldetext",
        airac: "Siehe Anmeldetext",
        category: "Direkte Mentor-Anmeldung",
        topics: null,
        schedule: "Siehe Anmeldetext",
        communication: "Siehe Anmeldetext",
        personal: null,
        other: `Anmeldetext (Mentor-Link):\n${invite.anmeldetext}`,
        status: "pending",
      },
      create: {
        cid: sessionCid,
        name: sessionName,
        rating: sessionRating,
        fir: sessionFir,
        simulator: "Siehe Anmeldetext",
        aircraft: "Siehe Anmeldetext",
        client: "Siehe Anmeldetext",
        clientSetup: "Siehe Anmeldetext",
        experience: invite.anmeldetext,
        charts: "Siehe Anmeldetext",
        airac: "Siehe Anmeldetext",
        category: "Direkte Mentor-Anmeldung",
        topics: null,
        schedule: "Siehe Anmeldetext",
        communication: "Siehe Anmeldetext",
        personal: null,
        other: `Anmeldetext (Mentor-Link):\n${invite.anmeldetext}`,
        status: "pending",
      },
    });

    const existingTraining = await prisma.training.findFirst({
      where: {
        traineeId: traineeUser.id,
        status: { not: "ABGEBROCHEN" },
      },
      include: {
        mentors: true,
      },
    });

    let trainingId: string;

    if (existingTraining) {
      trainingId = existingTraining.id;

      const mentorAlreadyAssigned = existingTraining.mentors.some(
        (entry) => entry.mentorId === mentor.id
      );

      if (!mentorAlreadyAssigned) {
        if (existingTraining.mentors.length >= 3) {
          return NextResponse.json(
            { error: "Training hat bereits die maximale Anzahl an Mentoren" },
            { status: 409 }
          );
        }

        await prisma.trainingMentor.create({
          data: {
            trainingId: existingTraining.id,
            mentorId: mentor.id,
          },
        });
      }
    } else {
      const training = await prisma.training.create({
        data: {
          traineeId: traineeUser.id,
          mentors: {
            create: {
              mentorId: mentor.id,
            },
          },
        },
      });

      trainingId = training.id;
    }

    await prisma.mentorInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        registrationId: registration.id,
        trainingId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting direct invite:", error);

    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("expired") || message.includes("Invalid token") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
