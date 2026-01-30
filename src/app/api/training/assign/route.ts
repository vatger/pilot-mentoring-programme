import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function sendMentorAssignedNotification(traineeCid: string | null) {
  const token = process.env.VATGER_NOTIFICATION_TOKEN;
  if (!token || !traineeCid) {
    console.warn("Missing VATGER_NOTIFICATION_TOKEN or trainee CID, skipping notification");
    return;
  }

  const url = `https://vatsim-germany.org/api/user/${traineeCid}/send_notification`;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: `{"title":"Mentor gefunden","message":"Wir haben einen Mentor für dich gefunden. Bitte prüfe regelmäßig das Forum – dein Mentor wird dich dort kontaktieren und die weitere Abstimmung findet über das Forum statt.","source_name":"PMP","link_text":"Forum","link_url":"https://board.vatsim-germany.org","via":""}`,
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`Notification response for ${traineeCid}:`, data);
  } catch (error) {
    console.error(
      `Error sending mentor assigned notification to ${traineeCid}:`,
      error
    );
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
