import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function sendMentorAssignedNotification(traineeCid: string | null) {
  const token = process.env.VATGER_NOTIFICATION_TOKEN;
  if (!token || !traineeCid) {
    return;
  }

  const apiBaseUrl = process.env.VATGER_NOTIFICATION_API_BASE_URL || "https://vatsim-germany.org/api";
  const url = `${apiBaseUrl}/user/${traineeCid}/send_notification`;

  const payload = {
    title: "Mentor gefunden",
    message:
      "Wir haben einen Mentor für dich gefunden. Bitte prüfe regelmäßig das Forum – dein Mentor wird dich dort kontaktieren und die weitere Abstimmung findet über das Forum statt.",
    source_name: "PMP",
    link_text: "Forum",
    link_url: "https://board.vatger.de",
    via: "",
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to send mentor assigned notification:", error);
  }
}

/**
 * POST /api/training/assign
 * Mentor picks a pending trainee to mentor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Only MENTOR, PMP_LEITUNG, and ADMIN can assign trainees
    if (!["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { traineeId } = await request.json();
    if (!traineeId) {
      return NextResponse.json(
        { error: "traineeId is required" },
        { status: 400 }
      );
    }

    // Get trainee info
    const trainee = await prisma.user.findUnique({
      where: { id: traineeId },
    });

    if (!trainee) {
      return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
    }

    // Check if trainee already has an active training
    const existingTraining = await prisma.training.findFirst({
      where: {
        traineeId,
        status: { not: "ABGEBROCHEN" },
      },
      include: {
        mentors: true,
      },
    });

    // If training exists but has no mentors, reuse it (orphaned after last mentor removed)
    if (existingTraining && existingTraining.mentors.length === 0) {
      const training = await prisma.training.update({
        where: { id: existingTraining.id },
        data: {
          mentors: {
            create: {
              mentorId: userId,
            },
          },
        },
        include: {
          mentors: {
            include: { mentor: { select: { id: true, name: true, cid: true } } },
          },
        },
      });

      // Update trainee role to TRAINEE if they were PENDING_TRAINEE
      if (trainee.role === "PENDING_TRAINEE") {
        await prisma.user.update({
          where: { id: traineeId },
          data: { role: "TRAINEE" },
        });
      }

      await sendMentorAssignedNotification(trainee.cid);

      return NextResponse.json(training, { status: 200 });
    }

    if (existingTraining) {
      return NextResponse.json(
        { error: "Trainee already assigned to a mentor" },
        { status: 409 }
      );
    }

    // Create new training and assign mentor
    const training = await prisma.training.create({
      data: {
        traineeId,
        mentors: {
          create: {
            mentorId: userId,
          },
        },
      },
      include: {
        mentors: {
          include: { mentor: { select: { id: true, name: true, cid: true } } },
        },
      },
    });

    // Update trainee role to TRAINEE if they were PENDING_TRAINEE
    if (trainee.role === "PENDING_TRAINEE") {
      await prisma.user.update({
        where: { id: traineeId },
        data: { role: "TRAINEE" },
      });
    }

    await sendMentorAssignedNotification(trainee.cid);

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error("Error assigning trainee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
