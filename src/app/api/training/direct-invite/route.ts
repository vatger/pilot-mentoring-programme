import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createMentorInviteToken } from "@/lib/mentorInviteToken";
import { prisma } from "@/lib/prisma";

async function sendInviteNotification(traineeCid: string, inviteUrl: string) {
  const token = process.env.VATGER_NOTIFICATION_TOKEN;
  if (!token) {
    console.warn("Missing VATGER_NOTIFICATION_TOKEN, skipping notification");
    return;
  }

  const url = `http://hp.vatsim-germany.org/api/user/${traineeCid}/send_notification`;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "PMP Einladung",
      message:
        "Dein Mentor hat dich zum Piloten-Mentoren-Programm eingeladen. Bitte öffne den Link und melde dich mit deinem VATSIM Germany Account an.",
      source_name: "PMP",
      link_text: "Einladung öffnen",
      link_url: inviteUrl,
      via: "",
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(`Notification response for ${traineeCid}:`, data);
  } catch (error) {
    console.error(`Error sending invite notification to ${traineeCid}:`, error);
  }
}

/**
 * POST /api/training/direct-invite
 * Creates a signed invite link and sends it to trainee via VATGER notification API.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const mentorId = (session.user as any).id as string;

    if (!mentorId || !["MENTOR", "PMP_LEITUNG", "ADMIN", "PMP_PRÜFER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const traineeCid = String(body?.traineeCid || "").trim();
    const anmeldetext = String(body?.anmeldetext || "").trim();

    if (!traineeCid || !/^\d+$/.test(traineeCid)) {
      return NextResponse.json({ error: "traineeCid must be numeric" }, { status: 400 });
    }

    if (!anmeldetext) {
      return NextResponse.json({ error: "anmeldetext is required" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const invite = await prisma.mentorInvite.create({
      data: {
        mentorId,
        traineeCid,
        anmeldetext,
        expiresAt,
      },
      select: { id: true },
    });

    const token = createMentorInviteToken({
      inviteId: invite.id,
      expiresInHours: 72,
    });

    const publicBaseUrl = (process.env.PMP_PUBLIC_BASE_URL || "https://pmp.vatger.de").replace(/\/$/, "");
    const inviteUrl = `${publicBaseUrl}/direkt-einladung?invite=${encodeURIComponent(token)}`;

    await sendInviteNotification(traineeCid, inviteUrl);

    return NextResponse.json(
      {
        success: true,
        inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating direct invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
